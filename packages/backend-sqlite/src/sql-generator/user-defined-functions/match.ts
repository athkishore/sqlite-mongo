import type { FilterNodeIR } from "@chikkadb/interfaces/command/types";

export function match(doc: Record<string, any>, filter: FilterNodeIR): 1 | 0 {
  return doc['username'] === 'user2' ? 1 : 0;
}