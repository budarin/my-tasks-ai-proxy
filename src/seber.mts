import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

import { appJson, tryParseJson } from './consts.mjs';

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

function getPrompt({ text, categories, priorities }: TaskDescription) {
    const dt = new Date();
    return JSON.stringify(`Сейчас: ${dt.toLocaleDateString()} ${dt.toLocaleTimeString()}
Текст задания: "${text}".

Инструкции:
1. Определи, является ли текст задачей. Задача - это действие, которое необходимо выполнить.
2. Если текст не является задачей, ответь пустым объектом {} и завершай работу.
3. Если текст является задачей, продолжай выполнение следующих шагов.

Из текста выбери: 
- название задачи (до 100 символов)
- детали задачи (до 500 символов)
- дату задачи YYYY-MM-DD
- время выполнения задачи HH:MM 

Категии задач: [${categories}]
Приоритеты: [${priorities}]

Укажи подходящую категорию из списка и приоритет.
Если даты и время не указаны в тексте - не выдумывай и не вставляй ничего.
Важно: если дата или время указаны не явно (пример: завтра, на следующей неделе, в следующем месяце и т.п.) - вычисли ее по отношению к текущей дате и времени.
Будь внимателен и точен.

Примеры:
1. Текст задания: "Купить продукты завтра в 10:00. Хлеб -1шт, молоко - 1л."
Результат: 
{
"title": "Купить продукты",
"description": "Хлеб -1шт, молоко - 1л.",
"date": "2024-06-28",
"time": "10:00",
"category": "Дом",
"priority": "обычный"
}

2. Текст задания: "Встретить маму в 3 часа."
Результат: 
{
"title": "Встреча по работе",
"date": "2024-06-27",
"time": "15:00",
"category": "Работа",
"priority": "обычный"
}

3. Текст задания: "Завтра у меня встреча по работе."
Результат: 
{
"title": "Встреча по работе",
"date": "2024-06-28",
"category": "Работа",
"priority": "обычный"
}

4. Текст задания: "В последнее воскресенье следующего месяца"
Результат: 
{
"title": "Сходить в баню",
"date": "2024-07-28",
"priority": "обычный"
}

5. Текст задания: "Сегодня хорошая погода."
Текст не является задачей, поэтому результат:{}

6. Текст задания: "Как хорошо на свете жить."
Результат:{}

Ответ подготовь в формате JSON:
{
"title": название задачи,
"description": детали задачи,
"date": дата,
"time": время,
"category": категория,
"priority": приоритет
}
`);
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
                    content: getPrompt(taskDescription),
                },
            ],
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            const str = JSON.stringify(data.choices[0].message.content);

            res.status(200).json(str);
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
