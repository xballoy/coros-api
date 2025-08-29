import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationService } from './configuration.service';
import { Configuration, ConfigurationKey } from './validation';

@Injectable()
export class DefaultConfigurationService implements ConfigurationService {
  private configService: ConfigService<Configuration, true>;

  constructor(configService: ConfigService<Configuration, true>) {
    this.configService = configService;
  }

  get apiUrl(): string {
    return this.configService.get(ConfigurationKey.COROS_API_URL);
  }

  get email(): string {
    return this.configService.get(ConfigurationKey.COROS_EMAIL);
  }

  get hashedPassword(): string {
    return this.configService.get(ConfigurationKey.COROS_PASSWORD);
  }
}
