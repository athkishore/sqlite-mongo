import type { FindCommand, FindCommandIR } from "#src/types.js";
import { parseFilterDoc } from "./common/filter.js";
import { parseSortDoc } from "./common/sort.js";

export function parseFindCommand(command: FindCommand): FindCommandIR {
  const [error, filterIR] = parseFilterDoc(command.filter, { parentKey: null });
  const [sortError, sortIR] = command.sort ? parseSortDoc(command.sort) : [];


  if (error) throw error;
  if (sortError) throw sortError;

  return {
    ...command,
    filter: filterIR,
    sort: sortIR,
  };
}