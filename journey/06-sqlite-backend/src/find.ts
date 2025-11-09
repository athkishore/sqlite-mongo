import Database from "better-sqlite3";
const DB_PATH = 'data/sqlite/cricket.db';

const db = new Database(DB_PATH);

const collection = process.argv[2];
if (!collection) {
  console.error('Collection name is required');
  process.exit(1);
}

const filterJSON = process.argv[3];
if (!filterJSON) {
  console.error('Filter is required');
  process.exit(1);
}

const { error, filterParseTree } = parseFilter(filterJSON);
if (error) console.error(error);
if (filterParseTree) console.dir(filterParseTree, { depth: null });

const FILTER_OPERATORS = [
  '$and',
  '$eq',
] as const;

type FilterOperator = typeof FILTER_OPERATORS[number];

interface FilterParseTree {
  operator: '$and',
  operands: FilterParseNode[];
}

interface FieldReference {
  $ref: string;
}

interface FilterParseNode {
  operator: FilterOperator;
  operands: (FilterParseNode | FieldReference | string | number | boolean | BigInt | null)[];
}

function parseFilter(filterJSON: string): { error: Error | null, filterParseTree: FilterParseTree | null } {
  try {
    const filter = JSON.parse(filterJSON);
    const elements = Object.entries(filter);

    const operands: FilterParseNode[] = [];

    for (const [key, value] of elements) {
      if (
        !key.match(/^\$/) 
        && (
          typeof value === 'string'
          || typeof value === 'number'
          || typeof value === 'bigint'
          || typeof value === 'boolean'
          || value === null
        )
      ) {
        operands.push({
          operator: '$eq',
          operands: [{ $ref: key }, value]
        });
      } else {
        throw new Error('Operand type not supported yet');
      }
    }

    return {
      error: null,
      filterParseTree: {
        operator: '$and',
        operands,
      }
    }
  } catch(error) {
    return {
      error: error as Error,
      filterParseTree: null,
    };
  }
}

const FilterNodetoSQLWhereFragmentMap = {
  $eq: function (filterNode: FilterParseNode) {
    const { operator, operands } = filterNode;
    if (operator !== '$eq') throw new Error('An unexpected error occured'); // print node id
    if (operands.length !== 2) throw new Error('$eq needs exactly two operands');

    let sqlFragment = ``;
  }
};

function getSQLWhereFromFilter(filter: FilterParseTree) {

}
