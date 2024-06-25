import { Request, Response } from 'express';
import { appJson } from './consts.mjs';

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
    const { aiProvider, authorization, taskDescription } = req.body;

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
                    text: JSON.stringify('Ты мой друг'),
                },
                {
                    role: 'user',
                    text: JSON.stringify('Привет! Как твои дела?'),
                },
            ],
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            const str = JSON.stringify(data.result.alternatives[0].message.text);
            res.status(200).json(str);
        })
        .catch((error) => {
            console.log(error);

            res.status(400).json(error);
        });
}

/*
async function postData(url = '', data = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
    
  return response.json();
}

await postData('process_task', { aiProvider: 'yandex', authorization: 'AQVN2b........' })
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
*/
