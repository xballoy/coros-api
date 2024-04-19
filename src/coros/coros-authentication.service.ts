import assert from 'node:assert';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CorosAuthenticationService {
  private _accessToken?: string;

  public get accessToken(): string {
    assert(this._accessToken, 'Access token missing, did you forget to login?');
    return this._accessToken;
  }

  public set accessToken(value: string) {
    this._accessToken = value;
  }
}
