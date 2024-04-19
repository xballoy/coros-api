import { flatten, ObjectEntries, ObjectSchema, parse, safeParse } from 'valibot';
import { CorosResponseBase, CorosResponseWithData } from '../coros/common';

export abstract class BaseCommand<Input, Response extends CorosResponseWithData, Output = Response['data']> {
  public async run(args: Input): Promise<Output> {
    parse(this.inputValidator(), args);
    return await this.handle(args);
  }

  protected assertCorosResponseBase(data: any): asserts data is CorosResponseBase {
    const parseResult = safeParse(CorosResponseBase, data);
    if (!parseResult.success) {
      throw new Error(flatten(parseResult.issues).root?.join(', ') ?? 'Invalid Coros response', {
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
      throw new Error(flatten(parseResult.issues).root?.join(', ') ?? 'Invalid Coros response', {
        cause: data,
      });
    }
  }

  protected abstract inputValidator(): ObjectSchema<ObjectEntries, undefined, Input>;
  protected abstract responseValidator(): ObjectSchema<ObjectEntries, undefined, Response>;
  protected abstract handle(args: Input): Promise<Output>;
}
