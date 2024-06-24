type ResultOrError<T, E = any> =
  | {
      result: DeepReadonly<T>;
      error?: never;
    }
  | {
      result?: never;
      error: DeepReadonly<JsonRpcError<E>>;
    };

type SberToken = {
  access_token: string;
  expires_at: number;
};

declare type SberTokenResult = Promise<ResultOrError<SberToken>>;
