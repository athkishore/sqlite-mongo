import type { QueryIR } from "#shared/types.js";
import Database from "better-sqlite3";
import { generateAndExecuteSQL_Create } from "./create.js";
import { generateAndExecuteSQL_Insert } from "./insert.js";
import { generateAndExecuteSQL_Find } from "./find.js";
import { getDatabases } from "#backend/database/index.js";
import { generateAndExecuteSQL_ListCollections } from "./list-collections.js";
import { generateAndExecuteSQL_Count } from "./count.js";

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

    case 'count': {
      return generateAndExecuteSQL_Count(commandIR, db);
    }

    case 'listDatabases': {
      return {
        databases: getDatabases().map(d => ({ name: d })),
        ok: 1,
      };
    }

    case 'listCollections': {
      const collections = generateAndExecuteSQL_ListCollections(commandIR, db);
      
      return {
        cursor: {
          id: 0n,
          ns: `${commandIR.database}.$cmd.listCollections`,
          firstBatch: collections.map((c: any) => ({
            ...c,
            type: 'collection',
          }))
        },
        ok: 1,
      };
    }
  }
  
  return db.prepare('');
}