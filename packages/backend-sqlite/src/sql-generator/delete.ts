import type { DeleteCommandIR, FilterNodeIR } from "@chikkadb/interfaces/command/types";
import type { Database } from "better-sqlite3";
import { logSql, logSqlResult } from "./lib/utils.js";
import { match } from "./user-defined-functions/match.js";
import { parseFromCustomJSON } from "@chikkadb/interfaces/lib/json";

function translateCommandToSQL({
  collection,
  filterIR,
  limit,
}: {
  collection: string;
  filterIR: FilterNodeIR;
  limit: number | undefined;
}) {
  if (filterIR.operator === '$and' && filterIR.operands.length === 0) {
    return `DELETE FROM ${collection} AS c ${limit ? `LIMIT ${limit}` : ''}`;
  }

  const whereFragment = `_filter(c.doc)`;

  let sql = `\
DELETE
FROM ${collection} AS c
WHERE ${whereFragment}
${limit ? `LIMIT ${limit}` : ''}
`;

  return sql;
}

/* TODO: Standardize return type of generateAndExuteSQL functions */
export function generateAndExecuteSQL_Delete(command: DeleteCommandIR, db: Database) {
  const { collection, deletes } = command;

  // validate and sanitize inputs

  const filterIR = deletes[0]?.filter;
  const limit = deletes[0]?.limit;
  if (!filterIR) throw new Error('Missing filter for delete');

  db.function('_filter', (docJSON: string) => Number(match(parseFromCustomJSON(docJSON), filterIR)));

  const sql = translateCommandToSQL({ collection, filterIR, limit });

  logSql(sql);

  const stmt = db.prepare(sql);
  const result = stmt.run();

  logSqlResult(result);

  return {
    ok: 1,
  };
}