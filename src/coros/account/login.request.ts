import { createHash } from 'node:crypto';
import { URL } from 'node:url';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod/v4';
import { BaseRequest } from '../base-request';
import { CorosResponse } from '../common';
import { CorosAuthenticationService } from '../coros-authentication.service';
import { CorosConfigService } from '../coros.config';

export const LoginBody = z.object({
  account: z.string(),
  accountType: z.number(),
  pwd: z.string(),
});
export type LoginBody = z.infer<typeof LoginBody>;

export const LoginData = z.object({
  accessToken: z.string(),
});
export type LoginData = z.infer<typeof LoginData>;

export const LoginResponse = CorosResponse(LoginData);
export type LoginResponse = z.infer<typeof LoginResponse>;

const LoginInput = z.object({});
type LoginInput = z.infer<typeof LoginInput>;

@Injectable()
export class LoginRequest extends BaseRequest<LoginInput, LoginResponse, Omit<LoginData, 'accessToken'>> {
  private readonly logger = new Logger(LoginRequest.name);
  private readonly httpService: HttpService;
  private readonly corosConfig: CorosConfigService;
  private readonly corosAuthenticationService: CorosAuthenticationService;

  constructor(
    httpService: HttpService,
    corosConfig: CorosConfigService,
    corosAuthenticationService: CorosAuthenticationService,
  ) {
    super();
    this.corosAuthenticationService = corosAuthenticationService;
    this.corosConfig = corosConfig;
    this.httpService = httpService;
  }

  protected inputValidator(): z.Schema<LoginInput> {
    return LoginInput;
  }

  protected responseValidator(): z.Schema<LoginResponse> {
    return LoginResponse;
  }

  protected async handle(_: LoginInput): Promise<Omit<LoginData, 'accessToken'>> {
    const url = new URL('/account/login', this.corosConfig.apiUrl);
    const { data } = await this.httpService.axiosRef.post(url.toString(), {
      account: this.corosConfig.email,
      accountType: 2,
      pwd: createHash('md5').update(this.corosConfig.password).digest('hex'),
    } satisfies LoginBody);
    this.logger.verbose('Login request response', data);

    this.assertCorosResponseBase(data);
    this.assertCorosResponse(data);

    const {
      data: { accessToken, ...rest },
    } = data;
    this.corosAuthenticationService.accessToken = accessToken;

    return rest;
  }
}
