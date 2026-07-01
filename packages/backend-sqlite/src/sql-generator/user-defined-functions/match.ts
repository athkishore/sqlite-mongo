import { DOC_LEVEL_FILTER_OPERATORS, FIELD_LEVEL_FILTER_OPERATORS, type FieldReference, type FilterNodeIR, type FilterNodeIR_DocLevel, type FilterNodeIR_FieldLevel, type Value } from "@chikkadb/interfaces/command/types";

export function match(doc: Record<string, any>, filter: FilterNodeIR): boolean {
  function traverseFilter(doc: any, filter: FilterNodeIR): boolean {
    const { operator, operands } = filter;

    if (
      operator &&
      FIELD_LEVEL_FILTER_OPERATORS.includes(operator as FilterNodeIR_FieldLevel['operator'])
    ) {
      const ref = (operands[0] as FieldReference);
      const value = operands[1] as Value;
      const op = operator as FilterNodeIR_FieldLevel['operator'];

      const result = applyFieldLevelOperator({
        doc,
        ref,
        value,
        operator: op,
      });

      return result;
    } else if (
      operator
      && DOC_LEVEL_FILTER_OPERATORS.includes(operator as FilterNodeIR_DocLevel['operator'])
    ) {
      const results = [];
      for (const operand of operands) {
        results.push(traverseFilter(doc, operand as FilterNodeIR));
      }
      if (operator === '$and') {
        return results.reduce((acc, el) => acc && el, true);
      } else if (operator === '$or') {
        return results.reduce((acc, el) => acc || el, false);
      } else if (operator === '$nor') {
        return results.reduce((acc, el) => !(acc || el), false);
      } else {
        return false;
      }
    } else {
      return false;
    }
  }


  
  return traverseFilter(doc, filter);
}

function applyFieldLevelOperator({
  doc,
  ref,
  value,
  operator,
}: {
  doc: Record<string, any>;
  ref: FieldReference;
  value: Value;
  operator: typeof FIELD_LEVEL_FILTER_OPERATORS[number];
}): boolean {
  let fieldPathSegments = ref.$ref.split('.');

  

  return false;
}