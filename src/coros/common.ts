import { z } from 'zod';

export const CorosResponseBase = z.object({
  apiCode: z.string(),
  message: z.string(),
  result: z.string(),
});
export type CorosResponseBase = z.infer<typeof CorosResponseBase>;

export const CorosResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  CorosResponseBase.merge(
    z.object({
      data: dataSchema,
    }),
  );

const CorosResponseWithData = CorosResponse(z.object({}));
export type CorosResponseWithData = z.infer<typeof CorosResponseWithData>;
