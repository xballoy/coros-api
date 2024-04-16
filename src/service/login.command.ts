import { createHash } from 'node:crypto';
import { BASE_URL, CorosResponse, CorosResponseBase } from './common.js';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BaseCommand } from '../command/base.command';
import { object, ObjectEntries, ObjectSchema, string, parse, Input, is } from 'valibot';

const LoginResponse = CorosResponse(
  object({
    accessToken: string(),
  }),
);

const LoginCommandInput = object({
  username: string(),
  password: string(),
});
type LoginCommandInput = Input<typeof LoginCommandInput>;

const LoginCommandOutput = object({
  accessToken: string(),
});
type LoginCommandOutput = Input<typeof LoginCommandOutput>;

@Injectable()
export class LoginCommand extends BaseCommand<LoginCommandInput, Promise<LoginCommandOutput>> {
  constructor(private readonly httpService: HttpService) {
    super();
  }

  protected inputValidator(): ObjectSchema<ObjectEntries, undefined, LoginCommandInput> {
    return LoginCommandInput;
  }

  protected async handle({ username, password }: LoginCommandInput): Promise<LoginCommandOutput> {
    const url = `${BASE_URL}/account/login`;
    const response = await this.httpService.axiosRef.post(url, {
      account: username,
      accountType: 2,
      pwd: createHash('md5').update(password).digest('hex'),
    });

    if (is(CorosResponseBase, response.data) && response.data.result !== '0000') {
      throw new Error(response.data.message);
    }
    const { data } = parse(LoginResponse, response.data);

    return data;
  }
}
