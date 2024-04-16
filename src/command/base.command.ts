import { ObjectEntries, ObjectSchema, parse } from 'valibot';

export abstract class BaseCommand<Input, Output> {
  public run(args: Input): Output {
    parse(this.inputValidator(), args);
    return this.handle(args);
  }

  protected abstract inputValidator(): ObjectSchema<ObjectEntries, undefined, Input>;
  protected abstract handle(args: Input): Output;
}
