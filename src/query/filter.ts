type FilterDoc = Record<string, any>;

export type CanonicalNode = 
  | CanonicalNode_DocLevel
  | CanonicalNode_FieldLevel;

export type CanonicalNode_DocLevel = 
  | CanonicalNode_$and
  | CanonicalNode_$or
  | CanonicalNode_$nor;

export type CanonicalNode_FieldLevel = 
  | CanonicalNode_$eq
  | CanonicalNode_$gt
  | CanonicalNode_$gte
  | CanonicalNode_$lt
  | CanonicalNode_$lte
  | CanonicalNode_$ne;

type CanonicalNode_$and = {
  operator: '$and';
  operands: CanonicalNode[];
};

type CanonicalNode_$or = {
  operator: '$or';
  operands: CanonicalNode[];
};

type CanonicalNode_$nor = {
  operator: '$nor';
  operands: CanonicalNode[];
};

type CanonicalNode_$eq = {
  operator: '$eq';
  operands: [FieldReference, Value];
};

type CanonicalNode_$gt = {
  operator: '$gt';
  operands: [FieldReference, Value];
};

type CanonicalNode_$gte = {
  operator: '$gte';
  operands: [FieldReference, Value];
};

type CanonicalNode_$lt = {
  operator: '$lt';
  operands: [FieldReference, Value];
};

type CanonicalNode_$lte = {
  operator: '$lte';
  operands: [FieldReference, Value];
};

type CanonicalNode_$ne = {
  operator: '$ne';
  operands: [FieldReference, Value];
};

export type FieldReference = {
  $ref: string;
};

export type Value = 
  | string
  | number
  | boolean
  | null
  | Array<any>
  | Object;

export const FIELD_LEVEL_OPERATORS = [
  '$eq',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$ne',
] as const;

export const DOC_LEVEL_OPERATORS = [
  '$and',
  '$or',
  '$nor',
] as const;

export function parseFilterDoc(
  filterDoc: FilterDoc, 
  { parentKey }: { parentKey: string | null }
): [Error, null] | [null, CanonicalNode] {
  try {
    const elements = Object.entries(filterDoc);
    const parsedNodes: CanonicalNode[] = [];
    
    for (const [key, value] of elements) {
      const [error, node] = parseFilterElement(key, value, { parentKey });
      if (error) throw error;
      parsedNodes.push(node);
    }

    if (parsedNodes.length === 1 && parsedNodes[0]) {
      return [null, parsedNodes[0]]
    } else {
      return [
        null,
        {
          operator: '$and',
          operands: parsedNodes,
        }
      ]
    }
  } catch (error) {
    return [error as Error, null];
  }
}

function parseFilterElement(key: string, value: any, { parentKey }: { parentKey: string | null }): [Error, null] | [null, CanonicalNode] {
  try {
    const isKeyOperator = /^\$/.test(key);
    const parser = parsers[key as keyof typeof parsers];

    if (isKeyOperator && !parser) {
      throw new Error(`Unknown operator: ${key}`);
    }

    if (isKeyOperator && parser) {
      const [error, node] = parser.parse(value, { parentKey });
      if (error) throw error;

      return [null, node];
    }

    if (!isKeyOperator && value !== null && !Array.isArray(value) && typeof value === 'object') {
      const isFirstKeyOfObjectOperator = /^\$/.test(Object.keys(value)[0] ?? '');

      if (isFirstKeyOfObjectOperator) {
        const [error, node] = parseFilterDoc(value, { parentKey: key });
        if (error) throw error;
        return [null, node];
      } else {
        return [null, {
          operator: '$eq',
          operands: [{ $ref: key }, value],
        }];
      }
      
    }

    return [null, {
      operator: '$eq',
      operands: [{ $ref: key }, value],
    }];

    
  } catch (error) {
    return [error as Error, null];
  }
}

const parsers = {
  '$eq': {
    parse(
      value: any, 
      { parentKey }: { parentKey: string | null }
    ): [Error, null] | [null, CanonicalNode_$eq] {
      try {
        const isParentKeyOperator = parentKey ? /^\$/.test(parentKey) : false;

        if (!parentKey || isParentKeyOperator) {
          throw new Error(`$eq should have a field reference as the parent key`);
        }

        return [null, {
          operator: '$eq',
          operands: [{ $ref: parentKey }, value]
        }];
      } catch (error) {
        return [error as Error, null];
      }
    }
  },
  '$gt': {
    parse(
      value: any,
      { parentKey }: { parentKey: string | null }
    ): [Error, null] | [null, CanonicalNode_$gt] {
      try {
        const isParentKeyOperator = parentKey ? /^\$/.test(parentKey) : false;

        if (!parentKey || isParentKeyOperator) {
          throw new Error(`$gt should have a field reference as the parent key`);
        }

        return [null, {
          operator: '$gt',
          operands: [{ $ref: parentKey }, value]
        }];
      } catch (error) {
        return [error as Error, null];
      }
    }
  },
  '$gte': {
    parse(
      value: any,
      { parentKey }: { parentKey: string | null }
    ): [Error, null] | [null, CanonicalNode_$gte] {
      try {
        const isParentKeyOperator = parentKey ? /^\$/.test(parentKey) : false;

        if (!parentKey || isParentKeyOperator) {
          throw new Error('$gte should have a field reference as the parent key');
        }

        return [null, {
          operator: '$gte',
          operands: [{ $ref: parentKey }, value],
        }];
      } catch (error) {
        return [error as Error, null];
      }
    }
  },
  '$lt': {
    parse(
      value: any,
      { parentKey }: { parentKey: string | null }
    ): [Error, null] | [null, CanonicalNode_$lt] {
      try {
        const isParentKeyOperator = parentKey ? /^\$/.test(parentKey) : false;

        if (!parentKey || isParentKeyOperator) {
          throw new Error('$lt should have a field reference as the parent key');
        }

        return [null, {
          operator: '$lt',
          operands: [{ $ref: parentKey }, value],
        }];
      } catch (error) {
        return [error as Error, null];
      }
    }
  },
  '$lte': {
    parse(
      value: any,
      { parentKey }: { parentKey: string | null }
    ): [Error, null] | [null, CanonicalNode_$lte] {
      try {
        const isParentKeyOperator = parentKey ? /^\$/.test(parentKey) : false;

        if (!parentKey || isParentKeyOperator) {
          throw new Error('$lte should have a field reference as the parent key');
        }

        return [null, {
          operator: '$lte',
          operands: [{ $ref: parentKey }, value],
        }];
      } catch (error) {
        return [error as Error, null];
      }
    }
  },
  '$ne': {
    parse(
      value: any,
      { parentKey }: { parentKey: string | null }
    ): [Error, null] | [null, CanonicalNode_$ne] {
      try {
        const isParentKeyOperator = parentKey ? /^\$/.test(parentKey) : false;

        if (!parentKey || isParentKeyOperator) {
          throw new Error('$ne should have a field reference as the parent key');
        }

        return [null, {
          operator: '$ne',
          operands: [{ $ref: parentKey }, value],
        }];
      } catch (error) {
        return [error as Error, null];
      }
    }
  },
  '$and': {
    parse(
      value: any,
      { parentKey }: { parentKey: string | null }
    ): [Error, null] | [null, CanonicalNode] {
      try {
        if (!Array.isArray(value)) {
          throw new Error('Array value required for $and');
        }
        
        if (value.some(el => !el || Array.isArray(el) || typeof el !== 'object')) {
          throw new Error('Array elements must be full objects');
        }

        const isParentKeyOperator = parentKey ? /^\$/.test(parentKey) : false;

        if (!isParentKeyOperator && parentKey !== null) {
          throw new Error('$and cannot have a field reference as the parent key');
        }

        const parsedNodes: CanonicalNode[] = [];
        for (const el of value) {
          const [error, node] = parseFilterDoc(el, { parentKey: '$and' });
          if (error) throw error;
          parsedNodes.push(node);
        }

        return parsedNodes.length === 1
          ? [null, parsedNodes[0]!] 
          : [
              null, 
              {
                operator: '$and',
                operands: parsedNodes,
              }
            ];

      } catch (error) {
        return [error as Error, null];
      }
    }
  },
  '$or': {
    parse(
      value: any,
      { parentKey }: { parentKey: string | null }
    ): [Error, null] | [null, CanonicalNode] {
      try {
        if (!Array.isArray(value)) {
          throw new Error('Array value required for $or');
        }
        
        if (value.some(el => !el || Array.isArray(el) || typeof el !== 'object')) {
          throw new Error('Array elements must be full objects');
        }

        const isParentKeyOperator = parentKey ? /^\$/.test(parentKey) : false;

        if (!isParentKeyOperator && parentKey !== null) {
          throw new Error('$or cannot have a field reference as the parent key');
        }

        const parsedNodes: CanonicalNode[] = [];
        for (const el of value) {
          const [error, node] = parseFilterDoc(el, { parentKey: '$or' });
          if (error) throw error;
          parsedNodes.push(node);
        }

        return parsedNodes.length === 1
          ? [null, parsedNodes[0]!] 
          : [
              null, 
              {
                operator: '$or',
                operands: parsedNodes,
              }
            ];

      } catch (error) {
        return [error as Error, null];
      }
    }
  },
  '$nor': {
    parse(
      value: any,
      { parentKey }: { parentKey: string | null }
    ): [Error, null] | [null, CanonicalNode] {
      try {
        if (!Array.isArray(value)) {
          throw new Error('Array value required for $nor');
        }
        
        if (value.some(el => !el || Array.isArray(el) || typeof el !== 'object')) {
          throw new Error('Array elements must be full objects');
        }

        const isParentKeyOperator = parentKey ? /^\$/.test(parentKey) : false;

        if (!isParentKeyOperator && parentKey !== null) {
          throw new Error('$nor cannot have a field reference as the parent key');
        }

        const parsedNodes: CanonicalNode[] = [];
        for (const el of value) {
          const [error, node] = parseFilterDoc(el, { parentKey: '$nor' });
          if (error) throw error;
          parsedNodes.push(node);
        }

        return parsedNodes.length === 1
          ? [null, parsedNodes[0]!] 
          : [
              null, 
              {
                operator: '$nor',
                operands: parsedNodes,
              }
            ];

      } catch (error) {
        return [error as Error, null];
      }
    }
  }
} as const;