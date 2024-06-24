import path from 'path';
import fs from 'fs';

const pem = fs.readFileSync(path.resolve('./certs/russian_trusted_root_ca.cer')).toString();

process.env.NODE_EXTRA_CA_CERTS = pem;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let tokenPromise: SberTokenResult | null = null;
let promiseStatus: 'pendig' | 'fulfilled' | 'rejected' = 'pendig';

async function createSberRequest(): SberTokenResult {
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
            Authorization: `Basic ${process.env.SBER_KEY}`,
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

export async function getSberToken(): SberTokenResult {
    if (!tokenPromise) {
        tokenPromise = createSberRequest();
        return tokenPromise;
    }

    // @ts-ignore
    if (tokenPromise !== null && promiseStatus === 'pending') {
        return tokenPromise;
    }

    const token = await tokenPromise;

    if (token?.result && token.result.expires_at - Date.now() < 30000) {
        tokenPromise = createSberRequest();
    }

    return tokenPromise as SberTokenResult;
}
