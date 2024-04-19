import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BaseCommand } from '../../command/base.command';
import { object, ObjectEntries, ObjectSchema, Input, string, number, array, tuple } from 'valibot';
import { CorosConfigService } from '../coros.config';
import { CorosResponse } from '../common';
import { CorosAuthenticationService } from '../coros-authentication.service';
import { URL } from 'node:url';

export const LoginBody = object({
  account: string(),
  accountType: number(),
  pwd: string(),
});
export type LoginBody = Input<typeof LoginBody>;

export const LoginData = object({
  accessToken: string(),
  birthday: number(),
  countryCode: string(),
  email: string(),
  headPic: string(),
  hrZoneType: number(),
  isCompetitionTestUser: number(),
  maxHr: number(),
  newMessageCount: number(),
  nickname: string(),
  profile: string(),
  regionId: number(),
  rhr: number(),
  runScoreList: array(
    object({
      avgPace: number(),
      distance: number(),
      distanceRatio: number(),
      distanceTargetTotal: number(),
      distanceTotal: number(),
      duration: number(),
      durationRatio: number(),
      durationTargetTotal: number(),
      durationTotal: number(),
      trainingLoadRatio: number(),
      trainingLoadTargetTotal: number(),
      trainingLoadTotal: number(),
      type: number(),
    }),
  ),
  sex: number(),
  stature: number(),
  unit: number(),
  userId: string(),
  userProfile: object({
    acceptTeamInvitation: number(),
    age: number(),
    allowCoachEditing: number(),
    allowMembersView: number(),
    allowsTeamViewHistorical: number(),
    autoTrainingLoadData: number(),
    facade: number(),
    gender: number(),
    language: string(),
    region: number(),
    showActivityMap: number(),
    stature: number(),
    weight: number(),
  }),
  weight: number(),
  zoneData: object({
    lthr: number(),
    lthrRange: tuple([number(), number()]),
    lthrZone: array(
      object({
        hr: number(),
        index: number(),
        ratio: number(),
      }),
    ),
    ltsp: number(),
    ltspRange: tuple([number(), number()]),
    ltspZone: array(
      object({
        index: number(),
        pace: number(),
        ratio: number(),
      }),
    ),
    ltspZoneDefault: array(
      object({
        index: number(),
        pace: number(),
        ratio: number(),
      }),
    ),
    maxHr: number(),
    maxHrRange: tuple([number(), number()]),
    maxHrZone: array(
      object({
        hr: number(),
        index: number(),
        ratio: number(),
      }),
    ),
    rhr: number(),
    rhrRange: tuple([number(), number()]),
    rhrZone: array(
      object({
        hr: number(),
        index: number(),
        ratio: number(),
      }),
    ),
  }),
});
export type LoginData = Input<typeof LoginData>;

export const LoginResponse = CorosResponse(LoginData);
export type LoginResponse = Input<typeof LoginResponse>;

const LoginCommandInput = object({});
type LoginCommandInput = Input<typeof LoginCommandInput>;

@Injectable()
export class LoginCommand extends BaseCommand<LoginCommandInput, LoginResponse, Omit<LoginData, 'accessToken'>> {
  constructor(
    private readonly httpService: HttpService,
    private readonly corosConfig: CorosConfigService,
    private readonly corosAuthenticationService: CorosAuthenticationService,
  ) {
    super();
  }

  protected inputValidator(): ObjectSchema<ObjectEntries, undefined, LoginCommandInput> {
    return LoginCommandInput;
  }

  protected responseValidator(): ObjectSchema<ObjectEntries, undefined, LoginResponse> {
    return LoginResponse;
  }

  protected async handle({}: LoginCommandInput): Promise<Omit<LoginData, 'accessToken'>> {
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
