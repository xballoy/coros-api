import { ConsoleLogger, INestApplicationContext, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { CommandFactory, CommandRunnerService } from 'nest-commander';
import { AppModule } from './app.module.js';

dayjs.extend(customParseFormat);

export async function runCli(argv: string[]): Promise<void> {
  const consoleLogger = new ConsoleLogger({ logLevels: ['log', 'warn', 'error', 'fatal'] });
  const logger = new Logger(CommandFactory.name);
  const reportError = (err: unknown) => {
    logger.error(err);
    process.exitCode = 1;
  };

  let app: INestApplicationContext;
  try {
    app = await CommandFactory.createWithoutRunning(AppModule, {
      logger: false,
      abortOnError: false,
      serviceErrorHandler: reportError,
    });
  } catch (err) {
    consoleLogger.error(err, CommandFactory.name);
    process.exitCode = 1;
    return;
  }

  app.useLogger(consoleLogger);
  try {
    await app.get(CommandRunnerService).run(argv);
  } finally {
    await app.close();
  }
}
