import { MongoClient } from "mongodb";
import fs from 'fs';

const DB_URI = 'mongodb://127.0.0.1:27017';
const JSON_DIR = 'data/json';

async function main() {
  const client = await MongoClient.connect(DB_URI);
  const db = client.db('cricket');
  const matchesCollection = db.collection('matches');

  const jsonFiles = fs.readdirSync(JSON_DIR);
  for (const jsonFile of jsonFiles) {
    const doc = JSON.parse(fs.readFileSync(`${JSON_DIR}/${jsonFile}`, 'utf-8'));
    await matchesCollection.insertOne(doc);
  }
}

main();
