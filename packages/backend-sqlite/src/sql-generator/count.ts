import type { Database } from "better-sqlite3";
import { validateIdentifier } from "./utils.js";
import type { CountCommandIR, FilterNodeIR } from "@chikkadb/interfaces/command/types";
import { logSql, logSqlResult } from "./lib/utils.js";
import { match } from "./user-defined-functions/match.js";
import { parseFromCustomJSON } from "@chikkadb/interfaces/lib/json";

export function generateAndExecuteSQL_Count(command: CountCommandIR, db: Database) {
  const { collection, database, filter } = command;
  const isCollectionNameValid = validateIdentifier(collection);

  if (!isCollectionNameValid) throw new Error('Invalid Collection Name');

  if (filter) {
    db.function('_filter', (docJSON: string) => Number(match(parseFromCustomJSON(docJSON), filter)));
  }

  const sql = translateQueryToSQL({ collection, filter: command.filter })
  logSql(sql);
  const stmt = db.prepare(sql);
  const result = stmt.get();
  logSqlResult(result);

  return {
    n: Object.values(result as Object)[0],
    ok: 1,
  };
}

function translateQueryToSQL({
  collection,
  filter,
}: {
  collection: string;
  filter: FilterNodeIR;
}) {
  if (filter.operator === '$and' && filter.operands.length === 0) {
    return `SELECT COUNT(DISTINCT(id)) FROM ${collection} c`;
  }

  const whereFragment = `_filter(c.doc)`;

  let sql = `\
SELECT COUNT(DISTINCT(c.id))
FROM ${collection} c
WHERE ${whereFragment}
`;

  return sql;
}