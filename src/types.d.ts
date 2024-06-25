type ResultOrError<T, E = any> =
    | {
          result: T;
          error?: never;
      }
    | {
          result?: never;
          error: Error;
      };

type SberToken = {
    access_token: string;
    expires_at: number;
};

declare type SberTokenResult = Promise<ResultOrError<SberToken>>;

interface ProcessTaskRequestBody {
    authorization: string;
    taskDescription: string;
    aiProvider: 'yandex' | 'sber';
}
