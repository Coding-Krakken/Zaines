import fs from 'fs';
import path from 'path';

const QUEUE = path.resolve(process.cwd(), 'tmp', 'email-queue.log');

async function drain(shouldClear = false) {
  try {
    const contents = fs.readFileSync(QUEUE, 'utf8');
    if (!contents) {
      console.log('No queued emails.');
      return;
    }

    console.log('Queued email entries:');
    console.log(contents);

    if (shouldClear) {
      fs.unlinkSync(QUEUE);
      console.log('Queue cleared.');
    }
  } catch {
    console.log('No queue file found.');
  }
}

const clear = process.argv.includes('--clear') || process.argv.includes('-c');
void drain(clear);
