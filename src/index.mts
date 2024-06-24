import express from 'express';
import { getSberToken } from './seber.mjs';

const port = 3000;
const app = express();

app.use(express.static('dist/client'));
app.use(express.json());

const appJson = 'application/json, charset=utf-8';
const requestDefaultParams = {
    model: 'GigaChat',
    temperature: 1.0,
    top_p: 0.1,
    n: 1,
    stream: false,
    max_tokens: 512,
    repetition_penalty: 1,
};

// ------------------------------------------------------------------

app.get('/', (req, res) => {
    res.status(200).send('Ok');
});

app.get('/send_tokens', async (req, res) => {
    const token = await getSberToken();

    res.set({
        'Cache-Control': 'no-store, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
    });

    if (token.result) {
        // `sber: ${token.result.access_token}`
        res.status(200).send('Ok');
    } else {
        res.status(400).json(token.error);
    }
});

app.post('/process_task', async (req, res) => {
    const data = req.body;
    const tokenRequest = await getSberToken();

    if (tokenRequest.error) {
        res.status(400).json(tokenRequest.error);
        return;
    }

    const sberToken = tokenRequest.result;

    // делаем запрос к API Сбера
    fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Accept: appJson,
            'Content-Type': appJson,
            Authorization: `Bearer ${sberToken.access_token}`,
        },
        body: JSON.stringify({
            ...requestDefaultParams,
            messages: [
                {
                    role: 'user',
                    content: 'Привет! Как дела?',
                },
            ],
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            const str = JSON.stringify(data.choices[0].message.content, null, 2);

            res.status(200).json(str);
        })
        .catch((error) => {
            res.status(400).json(error);
        });
});

// ------------------------------------------------------------------

app.listen(port, () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Сервер Proxy-AI запущен на http://localhost:${port}`);
    }
});
