export const appJson = 'application/json, charset=utf-8';

export const corsOptions = {
    // origin: 'https://budarin.github.io',
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
};

export function tryParseJson(str: string): SberToken | null {
    try {
        return JSON.parse(str);
    } catch {
        return null;
    }
}
