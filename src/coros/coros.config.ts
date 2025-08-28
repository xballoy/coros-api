import 'dotenv/config';
import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

const CorosConfig = z.object({
  apiUrl: z.string(),
  email: z.string(),
  password: z.string().transform((value) => createHash('md5').update(value).digest('hex')),
});
type CorosConfig = z.infer<typeof CorosConfig>;

@Injectable()
export class CorosConfigService {
  private readonly config: CorosConfig;

  constructor() {
    this.config = CorosConfig.parse({
      apiUrl: process.env.COROS_API_URL,
      email: process.env.COROS_EMAIL,
      password: process.env.COROS_PASSWORD,
    });
  }

  get apiUrl() {
    return this.config.apiUrl;
  }

  get email() {
    return this.config.email;
  }

  get password() {
    return this.config.password;
  }
}
