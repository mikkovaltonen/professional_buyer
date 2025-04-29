import 'dotenv/config';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const storage = new Storage({
  projectId: serviceAccount.project_id,
  credentials: serviceAccount,
});

const bucketName = 'genai-456910-bucket';
const fileName = 'test.json';
const localFilePath = './test.json';

async function writeJsonToGCS() {
  const data = { message: 'Hello from GCS!', timestamp: new Date().toISOString() };
  fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2));
  await storage.bucket(bucketName).upload(localFilePath, { destination: fileName });
  console.log('JSON written to GCS:', fileName);
}

async function readJsonFromGCS() {
  const tempDownloadPath = './downloaded.json';
  await storage.bucket(bucketName).file(fileName).download({ destination: tempDownloadPath });
  const content = fs.readFileSync(tempDownloadPath, 'utf8');
  console.log('JSON read from GCS:', JSON.parse(content));
}

(async () => {
  try {
    await writeJsonToGCS();
    await readJsonFromGCS();
    console.log('GCS connection test complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error with GCS connection:', err);
    process.exit(1);
  }
})(); 