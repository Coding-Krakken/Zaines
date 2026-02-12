import fs from 'fs';
import path from 'path';

const QUEUE = path.resolve(process.cwd(), 'tmp', 'email-queue.log');

export default async function cleanup() {
  try {
    await fs.promises.rm(QUEUE, { force: true });
  } catch (e) {
    // ignore
  }
}
