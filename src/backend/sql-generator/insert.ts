import type { Database } from "better-sqlite3";
import { validateIdentifier } from "./utils.js";

export function generateAndExecuteSQL_Insert(command: InsertCommandIR, db: Database) {
  const { collection, documents } = command;
  
  const isCollectionNameValid = validateIdentifier(collection);
  if (!isCollectionNameValid) throw new Error('Invalid Collection Name');

  const isDocumentsValid = Array.isArray(documents) && documents.every(d => d !== null && typeof d === 'object');
  if (!isDocumentsValid) throw new Error('Invalid Documents');

  const insert = db.prepare(`INSERT INTO ${collection} VALUES (?, ?)`);
  const transaction = db.transaction(documents => {
    for (const document of documents) {
      insert.run(document._id, JSON.stringify(document));
    }
  });

  return transaction(documents);
}

type InsertCommandIR = {
  command: 'insert';
  database: string;
  collection: string;
  documents: Record<string, any>[];
}