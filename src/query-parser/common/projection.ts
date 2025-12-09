import type { ProjectionDoc, ProjectionDocIR, ProjectionNodeIR } from "#src/types.js";

export function parseProjectionDoc(
  projectionDoc: ProjectionDoc,
): [Error, null] | [null, ProjectionDocIR] {
  try {
    const parseResult: ProjectionDocIR = {
      include: [],
      exclude: [],
    };

    const elements = Object.entries(projectionDoc);

    for (const [key, value] of elements) {
      const [error, node] = parseProjectionElement(key, value, {
        parentPath: [],
        parseResult,
      });
      if (error) throw error;

      // TODO: Unhardcode include/exclude
      parseResult.include.push(node);
    }

    return [null, parseResult];
  } catch (error) {
    return [error as Error, null];
  }
}

function parseProjectionElement(
  key: string, 
  value: 1 | 0 | ProjectionDoc,
  context: {
    parentPath: string[];
    parseResult: ProjectionDocIR;
  }
): [Error, null] | [null, ProjectionNodeIR] {
  try {
    const { parentPath, parseResult } = context;
    const pathSegments = key.split('.');

    return [null, { path: 'a' }];
  } catch (error) {
    return [error as Error, null];
  }
}