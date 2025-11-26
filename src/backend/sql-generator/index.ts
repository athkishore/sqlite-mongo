import type { QueryIR } from "#shared/types.js";
import Database from "better-sqlite3";
import { generateAndExecuteSQL_Create } from "./create.js";
import { generateAndExecuteSQL_Insert } from "./insert.js";
import { generateAndExecuteSQL_Find } from "./find.js";
import { databases } from "#backend/database/index.js";

export function generateAndExecuteSQLFromQueryIR(commandIR: any, db: Database.Database): any {
  switch (commandIR.command) {
    case 'create': {
      return generateAndExecuteSQL_Create(commandIR, db);
    }

    case 'insert': {
      return generateAndExecuteSQL_Insert(commandIR, db);
    }

    case 'find': {
      return generateAndExecuteSQL_Find(commandIR, db);
    }

    case 'listDatabases': {
      return {
        databases: databases.map(d => ({ name: d })),
        ok: 1,
      };
    }
  }
  
  return db.prepare('');
}