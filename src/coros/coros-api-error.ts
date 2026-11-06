export const ACCESS_TOKEN_INVALID_RESULT = '1019';

export class CorosApiError extends Error {
  public readonly result: string;
  public readonly apiCode?: string;

  constructor(message: string, { result, apiCode }: { result: string; apiCode?: string }) {
    super(message, { cause: { result, apiCode } });
    this.name = 'CorosApiError';
    this.result = result;
    this.apiCode = apiCode;
  }

  get isAccessTokenInvalid(): boolean {
    return this.result === ACCESS_TOKEN_INVALID_RESULT;
  }
}
