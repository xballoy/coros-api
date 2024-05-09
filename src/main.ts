import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

dayjs.extend(customParseFormat);

async function bootstrap() {
  await CommandFactory.run(AppModule, ['log', 'warn', 'error', 'fatal']);
}
void bootstrap();
