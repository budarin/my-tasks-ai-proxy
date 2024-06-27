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

2. Текст задания: "Завтра у меня встреча по работе."
Результат: 
{
"title": "Встреча по работе",
"date": "2024-06-28",
"category": "Работа",
"priority": "обычный"
}

3. Текст задания: "Сегодня хорошая погода."
Текст не является задачей, поэтому результат:{}

4. Текст задания: "Как хорошо на свете жить."
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
                    text: getPrompt(taskDescription),
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
