import fs from 'node:fs';
import path from 'node:path';
import stream from 'node:stream/promises';
import axios from 'axios';

export const downloadFile = async (url: string, directory: string, fileName: string): Promise<void> => {
  console.log(`Downloading ${fileName}`);
  const writer = fs.createWriteStream(path.join(directory, fileName));

  const response = await axios.get(url, {
    responseType: 'stream',
  });

  response.data.pipe(writer);
  await stream.finished(writer);
};
