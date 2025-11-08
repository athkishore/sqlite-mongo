import Database from "better-sqlite3";
const DB_PATH = 'data/sqlite/cricket.db';

const db = new Database(DB_PATH);

const collection = process.argv[2];
if (!collection) {
  console.error('Collection name is required');
}

const filter = process.argv[3];
if (!filter) {
  console.error('Filter is required');
}

