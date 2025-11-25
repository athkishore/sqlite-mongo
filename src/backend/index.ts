import type { QueryIR, ResultIR } from "#shared/types.js";
import { db } from "./database/index.js";
import { generateAndExecuteSQLFromQueryIR } from "./sql-generator/index.js";

export function executeQueryIR(queryIR: any) : any {
  try {
    const result = generateAndExecuteSQLFromQueryIR(queryIR, db);

    return result;
  } catch (error) {
    console.error(error);
    return {
      ok: 0,
    }
  }
  
}
