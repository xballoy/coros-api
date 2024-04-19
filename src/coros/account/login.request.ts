import { createHash } from 'node:crypto';
import { URL } from 'node:url';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Input, number, object, ObjectEntries, ObjectSchema, string } from 'valibot';
import { BaseRequest } from '../base-request';
import { CorosResponse } from '../common';
import { CorosAuthenticationService } from '../coros-authentication.service';
import { CorosConfigService } from '../coros.config';

export const LoginBody = object({
  account: string(),
  accountType: number(),
  pwd: string(),
});
export type LoginBody = Input<typeof LoginBody>;

export const LoginData = object({
  accessToken: string(),
});
export type LoginData = Input<typeof LoginData>;

export const LoginResponse = CorosResponse(LoginData);
export type LoginResponse = Input<typeof LoginResponse>;

const LoginInput = object({});
type LoginInput = Input<typeof LoginInput>;

@Injectable()
export class LoginRequest extends BaseRequest<LoginInput, LoginResponse, Omit<LoginData, 'accessToken'>> {
  constructor(
    private readonly httpService: HttpService,
    private readonly corosConfig: CorosConfigService,
    private readonly corosAuthenticationService: CorosAuthenticationService,
  ) {
    super();
  }

  protected inputValidator(): ObjectSchema<ObjectEntries, undefined, LoginInput> {
    return LoginInput;
  }

  protected responseValidator(): ObjectSchema<ObjectEntries, undefined, LoginResponse> {
    return LoginResponse;
  }

  protected async handle({}: LoginInput): Promise<Omit<LoginData, 'accessToken'>> {
    const url = new URL('/account/login', this.corosConfig.apiUrl);
    const { data } = await this.httpService.axiosRef.post(url.toString(), {
      account: this.corosConfig.email,
      accountType: 2,
      pwd: createHash('md5').update(this.corosConfig.password).digest('hex'),
    } satisfies LoginBody);

    this.assertCorosResponseBase(data);
    this.assertCorosResponse(data);

    const {
      data: { accessToken, ...rest },
    } = data;
    this.corosAuthenticationService.accessToken = accessToken;

    return rest;
  }
}
