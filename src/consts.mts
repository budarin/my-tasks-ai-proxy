export const appJson = 'application/json, charset=utf-8';

export const corsOptions = {
    origin: 'https://budarin.github.io/my-tasks/',
};

export function tryParseJson(str: string): SberToken | null {
    try {
        return JSON.parse(str);
    } catch {
        return null;
    }
}
