import type { FilterNodeIR, FindAndModifyCommandIR, FindAndModifyCommandResult, UpdateNodeIR } from "@chikkadb/interfaces/command/types";
import type { Database } from "better-sqlite3";
import { parseFromCustomJSON, stringifyToCustomJSON } from "@chikkadb/interfaces/lib/json";
import { logSql, logSqlResult } from "./lib/utils.js";
import { match } from "./user-defined-functions/match.js";
import { update as updateFn } from "./user-defined-functions/update.js";

export function generateAndExecuteSQL_FindAndModify(command: FindAndModifyCommandIR, db: Database): FindAndModifyCommandResult {
  const { collection, filter, update } = command;

  if (filter) {
    db.function('_filter', (docJSON: string) => Number(match(parseFromCustomJSON(docJSON), filter)));
  }

  if (update) {
    db.function('_update', (docJSON: string) => stringifyToCustomJSON(updateFn(parseFromCustomJSON(docJSON), update)));
  }

  const sql = translateCommandToSQL({ collection, filter, update });

  logSql(sql);

  const stmt = db.prepare(sql);
  const result = stmt.get();

  logSqlResult(result);
  return {
    _type: 'findAndModify',
    ok: 1,
    value: parseFromCustomJSON((result as any)?.doc),
  };
}

function translateCommandToSQL({
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
  const updateFragment = `_update(c.doc)`;

  let sql = `
UPDATE ${collection} AS c
set doc = ${updateFragment}
${whereClause}
RETURNING doc;
`;

  return sql;
}