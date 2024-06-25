import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { Request, Response } from 'express';

import { corsOptions } from './consts.mjs';
import { processSberRequest } from './seber.mjs';
import { processYandexRequest } from './yandex.mjs';

const port = 3000;
const app = express();

app.use(express.static('dist/client'));
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// ------------------------------------------------------------------

app.get('/', (_, res) => {
    res.status(200).send('Ok');
});

app.post('/process_task', async (req: Request<{}, {}, ProcessTaskRequestBody>, res: Response) => {
    const { aiProvider } = req.body;

    if (aiProvider === 'sber') {
        processSberRequest(req, res);
    }

    if (aiProvider === 'yandex') {
        processYandexRequest(req, res);
    }
});

// ------------------------------------------------------------------

app.listen(port, () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Сервер Proxy-AI запущен на http://localhost:${port}`);
    }
});
