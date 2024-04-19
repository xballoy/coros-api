import { Input, merge, object, ObjectEntries, ObjectSchema, string } from 'valibot';

export const CorosResponseBase = object({
  apiCode: string(),
  message: string(),
  result: string(),
});
export type CorosResponseBase = Input<typeof CorosResponseBase>;

export const CorosResponse = <TEntries extends ObjectEntries>(dataSchema: ObjectSchema<TEntries>) =>
  merge([
    CorosResponseBase,
    object({
      data: dataSchema,
    }),
  ]);

const CorosResponseWithData = CorosResponse(object({}));
export type CorosResponseWithData = Input<typeof CorosResponseWithData>;
