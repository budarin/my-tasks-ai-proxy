import { Request, Response } from 'express';

import { appJson } from './consts.mjs';
import { getYandexPrompt } from './prompts/yandex.mjs';

const requestDefaultParams = {
    modelUri: 'gpt://b1gqir1n4cqgstjnbi6b/yandexgpt-lite/rc',
    completionOptions: {
        stream: false,
        temperature: 0.3,
        maxTokens: '2000',
    },
};

export async function processYandexRequest(
    req: Request<{}, {}, ProcessTaskRequestBody>,
    res: Response,
) {
    const { authorization, taskDescription } = req.body;

    fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': appJson,
            Authorization: `Api-Key ${authorization}`,
        },
        body: JSON.stringify({
            ...requestDefaultParams,
            messages: [
                {
                    role: 'system',
                    text: 'Ты мой секретарь.Ты ведешь календарь моих задач.',
                },
                {
                    role: 'user',
                    text: getYandexPrompt(taskDescription),
                },
            ],
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            // const str = JSON.stringify(data.result.alternatives[0].message.text);
            res.status(200).json(data);
        })
        .catch((error) => {
            console.log(error);

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
  aiProvider: "yandex",
  authorization: "AQVN2buSZ6.....MfEqPPShu3_cb",
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
