import Database from 'better-sqlite3';
import { BSON } from 'bson';
import fs from 'fs';
import { before, describe, it } from 'node:test';
import { generateAndExecuteSQLFromQueryIR } from '#backend/sql-generator/index.js';
import assert from 'assert';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


let db: Database.Database;
let collectionObjs: { collection: string; documents: Record<string, any>[] }[];
before(() => {
  db = new Database();
  collectionObjs = JSON.parse(fs.readFileSync(path.join(__dirname, './seed.json'), 'utf-8'));
});

describe('insert command', () => {
  it('inserts new documents in the specified collection', () => {
    // for (const collectionObj of collectionObjs) {
    //   const { collection, documents } = collectionObj;

    //   db
    // }
    // generateAndExecuteSQLFromQueryIR(command)
    assert(true);
  })
});


