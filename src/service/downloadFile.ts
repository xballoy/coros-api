import fs from 'fs';
import path from 'path';
import axios from 'axios';
import stream from 'stream/promises';

export const downloadFile = async (url: string, directory: string, fileName: string): Promise<void> => {
  console.log(`Downloading ${fileName}`);
  const writer = fs.createWriteStream(path.join(directory, fileName));

  const response = await axios.get(url, {
    responseType: 'stream',
  });

  response.data.pipe(writer);
  await stream.finished(writer);
};
