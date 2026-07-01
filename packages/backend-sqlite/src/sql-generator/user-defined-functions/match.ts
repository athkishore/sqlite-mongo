import { DOC_LEVEL_FILTER_OPERATORS, FIELD_LEVEL_FILTER_OPERATORS, type FieldReference, type FilterNodeIR, type FilterNodeIR_DocLevel, type FilterNodeIR_FieldLevel, type Value } from "@chikkadb/interfaces/command/types";
import { stringifyToCustomJSON } from "@chikkadb/interfaces/lib/json";

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
  const fieldPathSegments = ref.$ref.split('.')
    .reduce((acc, el) => {
      if (!isNaN(Number(el))) {
        return [...acc.slice(0, -1), `${acc.slice(-1)[0]}.${el}`];
      } else {
        return [...acc, el];
      }
    }, [] as string[]);

  let pathIndex = 0;
  let segment = fieldPathSegments[pathIndex];

  if (!segment) return false;
  
  function check(doc: any, segment: string, pathIndex: number): boolean {
    let subdoc = segment.includes('.')
      ? segment.split('.').reduce((acc, el) => !isNaN(Number(el)) ? acc?.[Number(el)] : acc?.[el], doc)
      : doc[segment];

    if (pathIndex < fieldPathSegments.length - 1) {
      const nextSegment = fieldPathSegments[pathIndex + 1];
      if (!nextSegment) return false;

      if (Array.isArray(subdoc)) {
        for (const el of subdoc) {
          const result = check(el, nextSegment, pathIndex + 1);
          if (result) return true;
        }
        return false;
      } else if (subdoc && typeof subdoc === 'object') {
        return check(subdoc, nextSegment, pathIndex + 1)
      } else {
        return false;
      }
    } else {
      const result = evaluate(subdoc, operator, value);
      return result;
    }
  }

  const result = segment ? check(doc, segment, 0) : false;
  return result;
}

function getOperatableValue(value: Value) {
  if (
    typeof value === 'string' || 
    typeof value === 'number' || 
    typeof value === 'boolean' ||
    value === null
  ) {
    return value;
  } else if (Array.isArray(value) || typeof value === 'object') {
    return stringifyToCustomJSON(value);
  }
  throw new Error('unknown value');
}

function evaluate(subdoc: any, operator: typeof FIELD_LEVEL_FILTER_OPERATORS[number], value: Value): boolean {
  switch(operator) {
    case '$eq': 
      if (Array.isArray(subdoc) && !Array.isArray(value)) {
        for (const el of subdoc) {
          const result = getOperatableValue(el) === getOperatableValue(value);
          if (result) return true;
        }
        return false;
      }
      return getOperatableValue(subdoc ?? null) === getOperatableValue(value);
    
    case '$ne':
      if (Array.isArray(subdoc) && !Array.isArray(value)) {
        return !subdoc.some(el => getOperatableValue(el) === getOperatableValue(value));
      }
      return getOperatableValue(subdoc ?? null) !== getOperatableValue(value);

    case '$gt':
      if (Array.isArray(subdoc) && !Array.isArray(value)) {
        return subdoc.some(el => (getOperatableValue(el) ?? -Infinity) > (getOperatableValue(value) ?? -Infinity));
      }
      return (getOperatableValue(subdoc) ?? -Infinity) > (getOperatableValue(value) ?? -Infinity);

    case '$gte':
      if (Array.isArray(subdoc) && !Array.isArray(value)) {
        return subdoc.some(el => (getOperatableValue(el) ?? -Infinity) >= (getOperatableValue(value) ?? -Infinity));
      }
      return (getOperatableValue(subdoc) ?? -Infinity) >= (getOperatableValue(value) ?? -Infinity);

    case '$lt':
      if (Array.isArray(subdoc) && !Array.isArray(value)) {
        return subdoc.some(el => (getOperatableValue(el) ?? -Infinity) < (getOperatableValue(value) ?? -Infinity));
      }
      return (getOperatableValue(subdoc) ?? -Infinity) < (getOperatableValue(value) ?? -Infinity);

    case '$lte':
      if (Array.isArray(subdoc) && !Array.isArray(value)) {
        return subdoc.some(el => (getOperatableValue(el) ?? -Infinity) <= (getOperatableValue(value) ?? -Infinity));
      }
      return (getOperatableValue(subdoc) ?? -Infinity) <= (getOperatableValue(value) ?? -Infinity);

    case '$in':
      if (!Array.isArray(value)) throw new Error('$in requires array value');

      return value.some(el => getOperatableValue(subdoc) === getOperatableValue(el));

    case '$nin':
      if (!Array.isArray(value)) throw new Error('$nin requires array value');

      return !value.some(el => getOperatableValue(subdoc) === getOperatableValue(el));

    case '$exists':
      return subdoc !== undefined;


    default:
      return false;
  }
}