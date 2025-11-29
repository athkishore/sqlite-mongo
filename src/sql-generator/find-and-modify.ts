import type { FilterNodeIR, FindAndModifyCommandIR, FindAndModifyCommandResult, UpdateNodeIR } from "../types.js";
import type { Database } from "better-sqlite3";
import { getWhereClauseFromAugmentedFilter, traverseFilterAndTranslateCTE, type TranslationContext } from "./common/filter.js";
import { getUpdateFragment } from "./common/update.js";

export function generateAndExecuteSQL_FindAndModify(command: FindAndModifyCommandIR, db: Database): FindAndModifyCommandResult {
  const { collection, filter, update } = command;

  const sql = translateCommandToSQL({ collection, filter, update });

  console.log(sql);

  const stmt = db.prepare(sql);
  const result = stmt.get();

  console.log(result);
  return {
    _type: 'findAndModify',
    ok: 1,
    value: JSON.parse((result as any)?.doc),
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
  const filterContext: TranslationContext = {
    conditionCTEs: [],
  };

  traverseFilterAndTranslateCTE(filter, filterContext);

  const { conditionCTEs } = filterContext;

  const whereClause = filter.operator === '$and' && filter.operands.length === 0
    ? ''
    : `\
WHERE EXISTS (
  WITH
  ${conditionCTEs.join(',')}
  SELECT 1
  ${conditionCTEs.map((_, index) => {
    return index === 0
      ? `FROM condition_${index} c${index}`
      : `FULL OUTER JOIN condition_${index} c${index} ON 1=1`;
  }).join('\n')}
  WHERE
    ${getWhereClauseFromAugmentedFilter(filter, filterContext)}
)
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