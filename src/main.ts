import dayjs from 'dayjs';
import { AppModule } from './app.module';
import { CommandFactory } from 'nest-commander';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

async function bootstrap() {
  await CommandFactory.run(AppModule, ['warn', 'error']);
}
void bootstrap();
