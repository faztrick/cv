import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const storage = new Storage();
const bucketName = process.env.UPLOADS_BUCKET;
const uploadsDir = path.join(process.cwd(), 'uploads');

// Ensure local uploads dir exists if we fallback
if (!bucketName && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function uploadFile(filename: string, buffer: Buffer, mimeType: string): Promise<void> {
  if (bucketName) {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);
    await file.save(buffer, {
      contentType: mimeType,
      resumable: false
    });
  } else {
    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);
  }
}

export async function getFileStream(filename: string): Promise<Readable> {
  if (bucketName) {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error('File not found');
    }
    return file.createReadStream();
  } else {
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    return fs.createReadStream(filePath);
  }
}
