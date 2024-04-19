import fs from 'node:fs';
import path from 'node:path';
import stream from 'node:stream/promises';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DownloadFile {
  constructor(private readonly httpService: HttpService) {}

  async handle(url: string, directory: string, fileName: string): Promise<void> {
    console.log(`Downloading ${fileName}`);
    const writer = fs.createWriteStream(path.join(directory, fileName));

    const response = await this.httpService.axiosRef.get(url, {
      responseType: 'stream',
    });

    response.data.pipe(writer);
    await stream.finished(writer);
  }
}
