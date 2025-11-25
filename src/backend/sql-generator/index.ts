import type { QueryIR } from "#shared/types.js";
import Database from "better-sqlite3";
import { generateAndExecuteSQL_Create } from "./create.js";
import { generateAndExecuteSQL_Insert } from "./insert.js";
export function generateAndExecuteSQLFromQueryIR(commandIR: any, db: Database.Database): any {
  switch (commandIR.command) {
    case 'create': {
      return generateAndExecuteSQL_Create(commandIR, db);
    }

    case 'insert': {
      return generateAndExecuteSQL_Insert(commandIR, db);
    }
  }
  
  return db.prepare('');
}