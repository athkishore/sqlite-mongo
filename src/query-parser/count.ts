import type { CountCommand, CountCommandIR } from "#src/types.js";
import { parseFilterDoc } from "./common/filter.js";

export function parseCountCommand(command: CountCommand): CountCommandIR {
  const [error, filterIR] = parseFilterDoc(command.filter, { parentKey: null });

  if (error) throw error;

  return {
    ...command,
    filter: filterIR,
  };
}