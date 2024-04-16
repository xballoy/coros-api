import { object, ObjectEntries, ObjectSchema, string, merge } from 'valibot';

export const BASE_URL = 'https://teamapi.coros.com';

export const CorosResponseBase = object({
  apiCode: string(),
  message: string(),
  result: string(),
});

export const CorosResponse = <TEntries extends ObjectEntries>(dataSchema: ObjectSchema<TEntries>) =>
  merge([
    CorosResponseBase,
    object({
      data: dataSchema,
    }),
  ]);
