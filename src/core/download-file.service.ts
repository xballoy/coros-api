import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DownloadFile {
  private readonly logger = new Logger(DownloadFile.name);
  private readonly httpService: HttpService;

  constructor(httpService: HttpService) {
    this.httpService = httpService;
  }

  async handle(url: string, directory: string, fileName: string): Promise<void> {
    this.logger.log(`Downloading ${fileName}`);
    const response = await this.httpService.axiosRef.get(url, {
      responseType: 'stream',
    });

    await pipeline(response.data, fs.createWriteStream(path.join(directory, fileName)));
  }
}
