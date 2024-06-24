import express from 'express';
import { get_sber_token } from './seber.mjs';

const port = 5000;
const app = express();
let sberToken: SberToken;

app.use(express.static('dist/client'));
app.use(express.json());

// ------------------------------------------------------------------

app.get('/', (req, res) => {
    res.status(200).send('Ok');
});

app.post('/process_task', async (req, res) => {
    const data = req.body;

    // Если жить токену осталось меньше 5сек или срок истек - перезапрашиваем токн
    if (!sberToken || sberToken.expires_at - Date.now() < 5000) {
        const result = await get_sber_token();

        if (result.error) {
            res.status(400).json({
                message: 'Ошибка получения токена',
            });
        }

        sberToken = result.result;
    }

    fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json, charset=utf-8',
            Accept: 'application/json',
            Authorization: `Bearer ${sberToken.access_token}`,
        },
        body: JSON.stringify({
            model: 'GigaChat',
            messages: [
                {
                    role: 'user',
                    content: 'Привет! Как дела?',
                },
            ],
            temperature: 1.0,
            top_p: 0.1,
            n: 1,
            stream: false,
            max_tokens: 512,
            repetition_penalty: 1,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            const str = JSON.stringify(data.choices[0].message.content, null, 2);
            console.log(str);
            res.status(200).json(str);
        })
        .catch((error) => {
            console.error('Error:', error);
            res.status(400).json({
                message: 'Ошибка получения данных',
            });
        });
});

// ------------------------------------------------------------------

app.listen(port, () => {
    console.log(`Сервер Proxy-AI запущен на http://localhost:${port}`);
});
