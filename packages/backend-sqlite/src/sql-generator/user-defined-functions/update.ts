import type { UpdateNodeIR } from "@chikkadb/interfaces/command/types";
import { deepGet, deepSetImmutable, deepUnsetMutable } from "../lib/utils.js";

export function update(doc: Record<string, any>, update: UpdateNodeIR[]): Record<string, any> {
  const refs: string[] = [];
  let updatedDoc: Record<string, any> = doc;
  
  try {
    for (const element of update) {
      for (const operand of element.operandsArr) {
        const ref = operand[0].$ref;
        const val = operand[1];
  
        if (refs.includes(ref)) {
          throw new Error('Conflicting update');
        }
  
        refs.push(ref);
  
        switch (element.operator) {
          case '$set': {
            updatedDoc = deepSetImmutable(updatedDoc, ref, val) as any;
            break;
          }
          case '$unset': {
            updatedDoc = deepUnsetMutable(updatedDoc, ref) as any;
            break;
          }
          case '$inc': {
            const currentVal = deepGet(updatedDoc, ref);
            if (typeof currentVal === 'number' && typeof val === 'number') {
              updatedDoc = deepSetImmutable(updatedDoc, ref, currentVal + val) as any;
            }
            break;
          }
          case '$mul': {
            const currentVal = deepGet(updatedDoc, ref);
            if (typeof currentVal === 'number' && typeof val === 'number') {
              updatedDoc = deepSetImmutable(updatedDoc, ref, currentVal * val) as any;
            }
            break;
          }
          case '$max': {
            const currentVal = deepGet(updatedDoc, ref);
            const newVal = currentVal > (val ?? -Infinity) ? currentVal : val;
            updatedDoc = deepSetImmutable(updatedDoc, ref, newVal) as any;
            break;
          }
          case '$min': {
            const currentVal = deepGet(updatedDoc, ref);
            const newVal = currentVal < (val ?? -Infinity) ? currentVal : val;
            updatedDoc = deepSetImmutable(updatedDoc, ref, newVal) as any;
            break;
          }
          case '$push': {
            const currentVal = deepGet(updatedDoc, ref);
            if (!Array.isArray(currentVal)) {
              throw new Error('$push requires an array field');
            }
            const newVal = currentVal.concat([val]);
            updatedDoc = deepSetImmutable(updatedDoc, ref, newVal) as any;
            break;
          }
        }
      }
    }
  } catch {
    return doc;
  }
  return updatedDoc;
}
