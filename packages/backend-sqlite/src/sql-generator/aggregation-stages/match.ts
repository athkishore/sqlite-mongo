import type { AggregationStageIR_$match } from "@chikkadb/interfaces/command/types";
import type { Database } from "better-sqlite3";
import { match } from "../user-defined-functions/match.js";
import { parseFromCustomJSON } from "@chikkadb/interfaces/lib/json";

export function translateMatchToSQL(stage: AggregationStageIR_$match, index: number, collection: string, db: Database): string {
  const { filter } = stage;

  if (!filter) throw new Error('Missing filter');

  if (filter.operator === '$and' && filter.operands.length === 0) {
    let s = '';
    s += `stage${index} AS (\n`;
    s += `  SELECT id, c.doc\n`;
    s += `  FROM ${index === 0 ? collection : `stage${index - 1}`} c\n`;
    s += `)`;

    return s;
  }

  db.function('_filter', (docJSON: string) => Number(match(parseFromCustomJSON(docJSON), filter)));
  const whereFragment = `_filter(c.doc)`;

  let s = '';
  s += `stage${index} AS (\n`;
  s += `  SELECT c.id, c.doc\n`;
  s += `  FROM ${index === 0 ? collection : `stage${index - 1}`} c\n`;
  s += `  WHERE ${whereFragment}\n`;
  s += `)`;

  return s;
}