import config from "../../config.js";
import { DOC_LEVEL_OPERATORS, FIELD_LEVEL_OPERATORS, type CanonicalNode, type CanonicalNode_DocLevel, type CanonicalNode_FieldLevel, type FieldReference, type Value } from "../../query/lib/filter.js";

const JSON_TYPE = config.enableJSONB ? 'jsonb' : 'json';

type TranslationContext = {
  conditionCTEs: string[];
}

export function convertQueryToSQL({
  collection,
  canonicalFilter,
}: {
  collection: string;
  canonicalFilter: CanonicalNode;
  // TODO: canonicalProjection, canonicalSort, etc.
}) {
  const context: TranslationContext = {
    conditionCTEs: [],
  };


}

function traverseFilterAndTranslateCTE(
  canonicalFilter: CanonicalNode,
  context: TranslationContext,
) {
  const { operator, operands } = canonicalFilter;

  for (const operand of operands) {
    const operator = (operand as CanonicalNode).operator;

    if (
      operator 
      && DOC_LEVEL_OPERATORS.includes(operator as CanonicalNode_DocLevel['operator'])
    ) {
      traverseFilterAndTranslateCTE(operand as CanonicalNode, context);
    } else if (
      operator
      && FIELD_LEVEL_OPERATORS.includes(operator as CanonicalNode_FieldLevel['operator'])
    ) {
      const ref = ((operand as CanonicalNode).operands[0] as FieldReference).$ref;
      const value = (operand as CanonicalNode).operands[1] as Value;
      const sqlFragment = getLeafSqlFragment({
        conditionIndex: context.conditionCTEs.length,
        operator: operator as CanonicalNode_FieldLevel['operator'],
        ref,
        value,
      });
    }
  }
}

function getLeafSqlFragment({
  conditionIndex,
  operator,
  ref,
  value,
}: {
  conditionIndex: number;
  operator: CanonicalNode_FieldLevel['operator'];
  ref: string;
  value: Value;
}): string {
  let fieldPathSegments = ref.split('.');
  const n = conditionIndex;

  // If any internal segments have array indices specified,
  // it can be combined with the two adjacent segments to
  // form a single segment and narrow the document scan.
  fieldPathSegments = fieldPathSegments
    .reduce((acc, el, index, arr) => {
      if (!isNaN(Number(el))) {
        return [
          ...acc.slice(0, acc.length - 1),
          `${acc[acc.length - 1]}[${el}]`,
        ];
      } else if (!isNaN(Number(arr[index - 1]))) {
        return [
          ...acc.slice(0, acc.length - 1),
          `${acc[acc.length - 1]}${el}`,
        ];
      } else {
        return [...acc, el];
      }
    }, [] as string[]);

  const segmentCount = fieldPathSegments.length;
  let sqlFragment = '';
  let segment = fieldPathSegments.pop();
  let segmentIdx = fieldPathSegments.length;

  if (segment && segmentCount === 1) {
    sqlFragment = `\
condition_${n} AS (
  SELECT 1 AS c${n}
  FROM (
    SELECT json_type(c.doc, '$.${segment}') AS type,
      ${JSON_TYPE}_extract(c.doc, '$.${segment}') AS value
  ) AS node
  WHERE CASE node.type
    WHEN 'array' THEN EXISTS (
      SELECT 1
      FROM ${JSON_TYPE}_each(node.value) AS c${n}_p${segmentIdx}
      WHERE c${n}_p${segmentIdx} ${getOperatorSqlFragment(operator)} ${getValueSqlFragment(value)}
    )
    ELSE node.value ${getOperatorSqlFragment(operator)} ${getValueSqlFragment(value)}
  END
)`;
  }

  return sqlFragment;
}

function getOperatorSqlFragment(operator: CanonicalNode_FieldLevel['operator']) {
  switch(operator) {
    case '$eq': return '=';
    case '$gt': return '>';
    case '$gte': return '>=';
    case '$lt': return '<';
    case '$lte': return '<=';
    case '$ne': return '<>';
    default:
      throw new Error('Unknown operator: ' + operator);
  }
}

function getValueSqlFragment(value: Value) {
  if (typeof value === 'string') {
    return `'${value}'`;
  } else if (typeof value === 'number') {
    return `${value}`;
  } else if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  } else if (value === null) {
    return 'NULL';
  } else if (Array.isArray(value)) {
    return `${JSON_TYPE}('${JSON.stringify(value)}')`;
  } else if (typeof value === 'object') {
    return `${JSON_TYPE}('${JSON.stringify(value)}')`;
  }

  throw new Error('Unknown type for value: ' + value);
}