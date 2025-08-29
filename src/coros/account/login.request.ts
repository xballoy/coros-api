import { URL } from 'node:url';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import {
  CONFIGURATION_SERVICE_TOKEN,
  ConfigurationService,
} from '../../infrastructure/configuration/configuration.service';
import { BaseRequest } from '../base-request';
import { CorosResponse } from '../common';

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
  private readonly configurationService: ConfigurationService;

  constructor(
    httpService: HttpService,
    @Inject(CONFIGURATION_SERVICE_TOKEN) configurationService: ConfigurationService,
  ) {
    super();
    this.configurationService = configurationService;
    this.httpService = httpService;
  }

  protected inputValidator(): z.Schema<LoginInput> {
    return LoginInput;
  }

  protected responseValidator(): z.Schema<LoginResponse> {
    return LoginResponse;
  }

  protected async handle(_: LoginInput): Promise<Omit<LoginData, 'accessToken'>> {
    const url = new URL('/account/login', this.configurationService.apiUrl);
    const { data } = await this.httpService.axiosRef.post(url.toString(), {
      account: this.configurationService.email,
      accountType: 2,
      pwd: this.configurationService.hashedPassword,
    } satisfies LoginBody);
    this.logger.verbose('Login request response', data);

    this.assertCorosResponseBase(data);
    this.assertCorosResponse(data);

    const {
      data: { accessToken, ...rest },
    } = data;

    this.httpService.axiosRef.interceptors.request.use(
      (config) => {
        config.headers.accessToken = accessToken;
        return config;
      },
      (error) => Promise.reject(error),
    );

    return rest;
  }
}
