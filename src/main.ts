import { Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

dayjs.extend(customParseFormat);

async function bootstrap() {
  const logger = new Logger(CommandFactory.name);

  await CommandFactory.run(AppModule, {
    logger: ['log', 'warn', 'error', 'fatal'],
    serviceErrorHandler: (err) => logger.error(err),
  });
}
void bootstrap();
