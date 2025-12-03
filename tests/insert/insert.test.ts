import Database from 'better-sqlite3';
import { ObjectId } from 'bson';
import { before, describe, it } from 'node:test';
import { generateAndExecuteSQLFromQueryIR } from '#sql-generator/index.js';
import assert from 'assert';
import type { InsertCommandIR } from '../../src/types.js';
import { parseFromCustomJSON, stringifyToCustomJSON } from '#src/interfaces/lib/json.js';

const collection = 'users';
const documents = [
  {
    _id: new ObjectId(),
    username: 'user1',
  },
  {
    _id: new ObjectId(),
    username: 'user2',
  },
];

let db: Database.Database;
before(() => {
  db = new Database();
});

describe('insert command', () => {
  it('inserts new documents in the specified collection', () => {
    db.exec(`CREATE TABLE ${collection} (id TEXT, doc TEXT)`);      
    
    const command: InsertCommandIR = {
      command: 'insert',
      database: 'test',
      collection,
      documents,
    };

    generateAndExecuteSQLFromQueryIR(command, db);

    const stmt = db.prepare(`SELECT doc FROM ${collection}`);
    const stmtResult = stmt.all();

    assert.equal(stmtResult.length, documents.length);
    for (const document of documents) {
      const resultDocJSON = (stmtResult.find((el: any) => parseFromCustomJSON(el.doc).username === document.username) as any)?.doc;

      assert.equal(stringifyToCustomJSON(document), resultDocJSON);
    }
  });
});


