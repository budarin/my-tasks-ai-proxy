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

type SberTokenResult = Promise<ResultOrError<SberToken>>;
type TaskDescription = {
    text: string;
    categories: string[];
    priorities: string[];
};

interface ProcessTaskRequestBody {
    authorization: string;
    taskDescription: TaskDescription;
    aiProvider: 'yandex' | 'sber';
}
