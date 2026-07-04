import debug from 'debug';

export const logSql = debug('sqlite:sql');
export const logSqlResult = debug('sqlite:sqlResult');
export const logSqlExecTime = debug('sqlite:sqlExecTime');

type Idx<T, K> = K extends keyof T ? T[K] :
number extends keyof T ? K extends `${number}` ? T[number] : never : never

type Join<K, P> = K extends string | number ?
  P extends string | number ?
  `${K}${"" extends P ? "" : "."}${P}`
  : never : never;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]
  
export type Paths<T, D extends number = 6> = [D] extends [never] ? never : T extends object ?
  { [K in keyof T]-?: K extends string | number ?
    `${K}` | Join<K, Paths<T[K], Prev[D]>>
    : never
  }[keyof T] : ""
  
export type PathValue<T, P extends Paths<T, 6>> = P extends `${infer Key}.${infer Rest}`
  ? Rest extends Paths<Idx<T, Key>, 6>
  ? PathValue<Idx<T, Key>, Rest>
  : never
  : Idx<T, P>

// Reference: https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object/58436959#58436959

export function deepGet<T extends object, P extends Paths<T>>(obj: T, pathString: P) {
  const path = (pathString as string).split('.');

  let value = obj;

  for (const key of path) {
    if (value === undefined) return value;
    
    if (Array.isArray(value)) {
      value = value?.[Number(key)];
    } else {
      value = value?.[key as keyof typeof value] as any;
    }
  }

  return value as PathValue<T, P>;
}

export function deepSetImmutable<T extends object>(obj: Partial<T> | undefined, pathString: string, value: any) {
  let updatedObj = structuredClone(obj);
  if (updatedObj === undefined) updatedObj = {};

  const path = (pathString as string).split('.');

  if (path.length === 0) return updatedObj;

  let elem = updatedObj;

  for (const [index, key] of path.entries()) {
    if (index === path.length - 1) {
      if (!isNaN(Number(key))) {
        (elem as any)[Number(key)] = value;
      } else {
        (elem as { [x: string]: any })[key] = value;
      }

      return updatedObj;
    }

    if ((elem as any)[key] === undefined) {
      if (!isNaN(Number(path[index + 1]))) {
        (elem as any)[key] = [];
      } else if (typeof path[index + 1] === 'string') {
        (elem as any)[key] = {};
      }
    }

    if (Array.isArray(elem)) {
      elem = elem[Number(key)];
    } else {
      elem = (elem as any)[key];
    }
  }
}

export function deepUnsetMutable(obj: Record<string, any>, pathString: string) {
  const path = pathString.split('.');

  function update(subdoc: any, pathIndex: number) {
    const segment = path[pathIndex]!;
    
    if (pathIndex === path.length - 1) {      
      if (subdoc !== undefined) {
        delete subdoc[segment];
      }
    } else {
      update(subdoc[segment], pathIndex + 1);
    }
  }
  update(obj, 0);
  return obj;
}

