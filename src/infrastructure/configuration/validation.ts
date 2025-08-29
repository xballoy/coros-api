import { createHash } from 'node:crypto';
import { z } from 'zod/v4';

export const ConfigurationKey = {
  COROS_API_URL: 'COROS_API_URL' as const,
  COROS_EMAIL: 'COROS_EMAIL' as const,
  COROS_PASSWORD: 'COROS_PASSWORD' as const,
};

export const configurationSchema = z.object({
  [ConfigurationKey.COROS_API_URL]: z.literal([
    'https://teamapi.coros.com',
    'https://teameuapi.coros.com',
    'https://teamcnapi.coros.com',
  ]),
  [ConfigurationKey.COROS_EMAIL]: z.string(),
  [ConfigurationKey.COROS_PASSWORD]: z.string().transform((value) => createHash('md5').update(value).digest('hex')),
});
export type Configuration = z.infer<typeof configurationSchema>;

export const validateConfiguration = (config: Record<string, unknown>): Configuration => {
  const result = configurationSchema.safeParse(config);
  if (result.error) {
    throw result.error;
  }

  return result.data;
};
