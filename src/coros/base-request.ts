import { ObjectEntries, ObjectSchema, safeParse } from 'valibot';
import { ValidationError } from '../core/validation-error';
import { CorosResponseBase, CorosResponseWithData } from './common';

export abstract class BaseRequest<Input, Response extends CorosResponseWithData, Output = Response['data']> {
  protected abstract inputValidator(): ObjectSchema<ObjectEntries, undefined, Input>;
  protected abstract responseValidator(): ObjectSchema<ObjectEntries, undefined, Response>;
  protected abstract handle(args: Input): Promise<Output>;

  public async run(args: Input): Promise<Output> {
    const parseResult = safeParse(this.inputValidator(), args);
    if (!parseResult.success) {
      throw new ValidationError(parseResult.issues, { cause: args });
    }
    return await this.handle(args);
  }

  protected assertCorosResponseBase(data: any): asserts data is CorosResponseBase {
    const parseResult = safeParse(CorosResponseBase, data);
    if (!parseResult.success) {
      throw new ValidationError(parseResult.issues, {
        cause: data,
      });
    }

    const { message, result, apiCode } = parseResult.output;
    if (result !== '0000') {
      throw new Error(message, { cause: { apiCode, result } });
    }
  }

  protected assertCorosResponse(data: any): asserts data is Response {
    const parseResult = safeParse(this.responseValidator(), data);
    if (!parseResult.success) {
      throw new ValidationError(parseResult.issues, {
        cause: data,
      });
    }
  }
}
