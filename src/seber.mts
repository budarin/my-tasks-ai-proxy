import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

import { appJson, tryParseJson } from './consts.mjs';
import { getSberPrompt } from './prompts/sber.mjs';

const pem = fs.readFileSync(path.resolve('./certs/russian_trusted_root_ca.cer')).toString();
process.env.NODE_EXTRA_CA_CERTS = pem;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let tokenPromise: SberTokenResult | null = null;
let promiseStatus: 'pendig' | 'fulfilled' | 'rejected' = 'pendig';

const requestDefaultParams = {
    model: 'GigaChat',
    temperature: 1.0,
    top_p: 0.1,
    n: 1,
    stream: false,
    max_tokens: 512,
    repetition_penalty: 1,
};

async function createSberTokenRequest(authorization: string): SberTokenResult {
    if (process.env.NODE_ENV !== 'production') {
        console.log('start createSberRequest');
    }

    promiseStatus = 'pendig';

    return fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            RqUID: '04633e8d-50d2-4868-ad3e-803b779106e9',
            Authorization: `Basic ${authorization}`,
        },
        body: new URLSearchParams({
            scope: 'GIGACHAT_API_PERS',
        }),
    })
        .then((resp) => {
            promiseStatus = 'fulfilled';
            return resp.json();
        })
        .then((data: SberToken) => {
            return { result: data };
        })
        .catch((error) => {
            promiseStatus = 'rejected';

            return {
                error,
            };
        });
}

export async function getSberToken(authorization: string): SberTokenResult {
    if (tokenPromise === null) {
        tokenPromise = createSberTokenRequest(authorization);
        return tokenPromise;
    }

    // @ts-ignore
    if (tokenPromise !== null && promiseStatus === 'pending') {
        return tokenPromise;
    }

    const token = await tokenPromise;

    if (
        token.error ||
        promiseStatus === 'rejected' ||
        (token.result && token.result.expires_at - Date.now() < 30000)
    ) {
        tokenPromise = createSberTokenRequest(authorization);
    }

    return tokenPromise as SberTokenResult;
}

async function processToken(authorization: string, res: Response) {
    const tokenRequest = await getSberToken(authorization);

    if (tokenRequest !== null && tokenRequest.result) {
        const sberToken = tokenRequest.result;

        res.cookie('token', JSON.stringify(sberToken), {
            maxAge: sberToken.expires_at,
            httpOnly: true,
        });
    }

    return tokenRequest;
}

async function processSberCookie(
    authorization: string,
    req: Request<{}, {}, ProcessTaskRequestBody>,
    res: Response,
): SberTokenResult {
    const tokenString = req.cookies.token;

    if (!tokenString) {
        return processToken(authorization, res);
    }

    const token = tryParseJson(tokenString);

    if (!token) {
        return processToken(authorization, res);
    }

    if (!token || token.expires_at < Date.now()) {
        return processToken(authorization, res);
    } else {
        return { result: token };
    }
}

export async function processSberRequest(
    req: Request<{}, {}, ProcessTaskRequestBody>,
    res: Response,
) {
    const { authorization, taskDescription } = req.body;

    if (!authorization) {
        res.status(400).json(new Error('no authorization'));
        return;
    }

    const sberToken = await processSberCookie(authorization, req, res);

    if (sberToken.error) {
        res.status(400).json(sberToken.error);
        return;
    }

    // делаем запрос к API Сбера
    fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Accept: appJson,
            'Content-Type': appJson,
            Authorization: `Bearer ${sberToken.result.access_token}`,
        },
        body: JSON.stringify({
            ...requestDefaultParams,
            messages: [
                {
                    role: 'system',
                    content: 'Ты мой секретарь.Ты ведешь календарь моих задач.',
                },
                {
                    role: 'user',
                    content: getSberPrompt(taskDescription),
                },
            ],
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            // const str = JSON.stringify(data.choices[0].message.content);

            res.status(200).json(data);
        })
        .catch((error) => {
            res.status(400).json(error);
        });
}

/*

async function postData(url = "", data = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

await postData("/api/process_task", {
  aiProvider: "sber",
  authorization:
    "OWNiODMyO...DE5ZmM5Nw==",
  taskDescription: {
    text: `После завтра позвонить на работу в 7 утра. Описать проблему`,
    categories: ["Дом", "Работа", "Здоровье"],
    priorities: ["обычный", "повышенный", "высокий"],
  },
})
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.error("Error:", error);
  });

*/
