import Database from 'better-sqlite3';
import fs from 'fs';

const DB_PATH = 'data/db';

const filenames = fs.readdirSync(DB_PATH);

const databaseFilenames = filenames.filter(f => /.*sqlite$/.test(f));

export const databases = databaseFilenames.map(f => f.split('.')[0]);

export const db = new Database(`${DB_PATH}/test.sqlite`);