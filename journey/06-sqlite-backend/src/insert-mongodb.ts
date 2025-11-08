import { MongoClient } from "mongodb";
import fs from 'fs';

const DB_URI = 'mongodb://127.0.0.1:27017';
const JSON_DIR = 'data/json/cricket-data';

async function main() {
  const client = await MongoClient.connect(DB_URI);
  const db = client.db('cricket');
  const matchesCollection = db.collection('matches');

  const jsonFiles = fs.readdirSync(JSON_DIR).filter(el => el.match(/json$/));
  for (const jsonFile of jsonFiles) {
    const doc = JSON.parse(fs.readFileSync(`${JSON_DIR}/${jsonFile}`, 'utf-8'));
    await matchesCollection.insertOne(doc);
  }

  await client.close();
}

main();
