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
                    text: 'Ты мой секретарь.Я даю тебе указания, ты из них выделяешь задачи и ведешь календарь моих задач.',
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
            res.status(200).json(data);
        })
        .catch((error) => {
            console.log(error);

            res.status(400).json(error);
        });
}
