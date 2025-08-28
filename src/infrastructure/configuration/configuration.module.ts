import { Global, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CONFIGURATION_SERVICE_TOKEN } from './configuration.service';
import { DefaultConfigurationService } from './default-configuration.service';
import { validateConfiguration } from './validation';

const configurationServiceProvider: Provider = {
  provide: CONFIGURATION_SERVICE_TOKEN,
  useClass: DefaultConfigurationService,
};

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      validate: validateConfiguration,
    }),
  ],
  providers: [configurationServiceProvider],
  exports: [configurationServiceProvider],
})
export class ConfigurationModule {}
