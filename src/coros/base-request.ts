import type { z } from 'zod/v4';
import { ValidationError } from '../core/validation-error';
import { CorosResponseBase, type CorosResponseWithData } from './common';

export abstract class BaseRequest<Input, Response extends CorosResponseWithData, Output = Response['data']> {
  protected abstract inputValidator(): z.Schema<Input>;
  protected abstract responseValidator(): z.Schema<Response>;
  protected abstract handle(args: Input): Promise<Output>;

  public async run(args: Input): Promise<Output> {
    const parseResult = this.inputValidator().safeParse(args);
    if (!parseResult.success) {
      throw new ValidationError(parseResult.error, { cause: args });
    }
    return await this.handle(args);
  }

  protected assertCorosResponseBase(data: unknown): asserts data is CorosResponseBase {
    const parseResult = CorosResponseBase.safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError(parseResult.error, {
        cause: data,
      });
    }

    const { message, result, apiCode } = parseResult.data;
    if (result !== '0000') {
      throw new Error(message, { cause: { apiCode, result } });
    }
  }

  protected assertCorosResponse(data: unknown): asserts data is Response {
    const parseResult = this.responseValidator().safeParse(data);
    if (!parseResult.success) {
      throw new ValidationError(parseResult.error, {
        cause: data,
      });
    }
  }
}
