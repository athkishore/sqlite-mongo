import Database from 'better-sqlite3';
import fs from 'fs';

const DB_PATH = 'data/db';



export const db = new Database(`${DB_PATH}/test.sqlite`);

export function listDatabases() {
  const filenames = fs.readdirSync(DB_PATH);

  const databaseFilenames = filenames.filter(f => /.*sqlite$/.test(f)); 

  const databases = databaseFilenames.map(f => f.split('.')[0]);

  return databases;
}

export function getDatabase(name: string) {
  const db = new Database(`${DB_PATH}/${name}.sqlite`);
  return db;
}