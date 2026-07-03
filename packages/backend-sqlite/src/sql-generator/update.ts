import type { FilterNodeIR, UpdateCommandIR, UpdateNodeIR } from "@chikkadb/interfaces/command/types";
import type { Database } from "better-sqlite3";
import { getUpdateFragment } from "./common/update.js";
import { parseFromCustomJSON, stringifyToCustomJSON } from "@chikkadb/interfaces/lib/json";
import { logSql, logSqlResult } from "./lib/utils.js";
import { match } from "./user-defined-functions/match.js";


export function generateAndExecuteSQL_Update(command: UpdateCommandIR, db: Database) {
  const { collection, updates, database } = command;

  // TODO: validate and sanitize inputs
  // TODO: Support multiple updates

  const u = updates[0];
  const { filter, update } = u ?? {};

  if (!filter) throw new Error('Missing filter for update');
  if (!update) throw new Error('Missing update');

  db.function('_filter', (docJSON: string) => Number(match(parseFromCustomJSON(docJSON), filter)));

  const sql = translateCommandToSQL({ collection, filter, update });

  logSql(sql);

  const stmt = db.prepare(sql);
  const result = stmt.all();

  logSqlResult(result);

  return {
    cursor: {
      firstBatch: result.map(el => parseFromCustomJSON((el as any).doc)),
      id: 0n,
      ns: `${database}.${collection}`,
    },
    ok: 1,
  };
}

export function translateCommandToSQL({
  collection,
  filter,
  update,
}: {
  collection: string;
  filter: FilterNodeIR;
  update: UpdateNodeIR[];
}) {
  const whereFragment = `_filter(c.doc)`;

  const whereClause = filter.operator === '$and' && filter.operands.length === 0
    ? ''
    : `\
  WHERE ${whereFragment}
`;

  
  const updateFragment = getUpdateFragment(update);

  let sql = `
UPDATE ${collection} AS c
set doc = ${updateFragment}
${whereClause}
RETURNING doc;
`;
  
  return sql;
}
