import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { Input, object, parse, string } from 'valibot';

const CorosConfig = object({
  apiUrl: string(),
  email: string(),
  password: string(),
});
type CorosConfig = Input<typeof CorosConfig>;

@Injectable()
export class CorosConfigService {
  private readonly config: CorosConfig;

  constructor() {
    this.config = parse(CorosConfig, {
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
