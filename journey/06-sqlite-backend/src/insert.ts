import Database from 'better-sqlite3';
import fs from 'fs';
import { ObjectId } from 'bson';

const JSON_PATH = 'data/json/cricket-data';
const DB_PATH = 'data/sqlite/cricket_jsonb.db';

if (fs.existsSync(DB_PATH)) fs.rmSync(DB_PATH);

const db = new Database(DB_PATH);

const collection = 'matches';

db.exec(`
  CREATE TABLE IF NOT EXISTS ${collection} (
    id TEXT PRIMARY KEY,
    doc JSON
  );  
`);

const insert = db.prepare(`
  INSERT INTO ${collection}
  (id, doc)
  VALUES 
  (?, jsonb(?)) 
`);

const jsonFiles = fs.readdirSync(JSON_PATH).filter(el => el.match(/json$/));

const transaction = db.transaction((jsonFiles: string[]) => {
  for (const jsonFile of jsonFiles) {
    console.log(jsonFile);
    const doc = JSON.parse(fs.readFileSync(`${JSON_PATH}/${jsonFile}`, 'utf-8'));
    const id = new ObjectId().toHexString();
    insert.run(id, JSON.stringify({ _id: id, ...doc }));
  };
});

transaction(jsonFiles);
db.close();
