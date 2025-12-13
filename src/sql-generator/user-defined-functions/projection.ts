import type { ProjectionDocIR, ProjectionNodeIR } from "#src/types.js";

export function project(doc: Record<string, any>, projection: ProjectionDocIR) {
  const includePaths = getPathsFromIR(projection.include);
  const excludePaths = getPathsFromIR(projection.exclude);



  const projectedDoc = projectDocInclusion(doc, includePaths);

  return projectedDoc;
}

function projectDocInclusion(doc: Record<string, any>, includePaths: string[], parentPath = '') {
  // const copy_of_doc = structuredClone(doc);
  const copy_of_doc = doc;

  for (const [key, value] of Object.entries(copy_of_doc)) {
    if (Array.isArray(value)) {
      const matchingPaths = includePaths.filter(p => p.match(parentPath ? `${parentPath}.${key}` : key));
      if (matchingPaths.length === 0) {
        delete copy_of_doc[key];
        continue;
      }

      const isExactMatch = matchingPaths.length === 1 && matchingPaths[0] === (parentPath ? `${parentPath}.${key}` : key);
      if (isExactMatch) continue;

      const updatedArr = value.map(el => {
        if (!Array.isArray(el) && el !== null && typeof el === 'object') {
          return projectDocInclusion(el, includePaths, parentPath ? `${parentPath}.${key}` : key);
        } else {
          return undefined;
        }
      }).filter(el => el !== undefined);

      copy_of_doc[key] = updatedArr;
    } else if (value !== null && typeof value === 'object') {
      const matchingPaths = includePaths.filter(p => p.match(parentPath ? `${parentPath}.${key}` : key));
      if (matchingPaths.length === 0) {
        delete copy_of_doc[key];
        continue;
      }

      const isExactMatch = matchingPaths.length === 1 && matchingPaths[0] === (parentPath ? `${parentPath}.${key}` : key);
      if (isExactMatch) continue;

      const updatedObj = projectDocInclusion(value, includePaths, parentPath ? `${parentPath}.${key}` : key);
      copy_of_doc[key] = updatedObj;

    } else {
      const matchingPaths = includePaths.filter(p => p.match(parentPath ? `${parentPath}.${key}` : key));
      const isExactMatch = matchingPaths.length === 1 && matchingPaths[0] === (parentPath ? `${parentPath}.${key}` : key);

      if (!isExactMatch) {
        delete copy_of_doc[key];
      }
    }
  }

  return copy_of_doc;
}

function getPathsFromIR(nodes: ProjectionNodeIR[]) {
  const paths: string[] = [];

  function walk(node: ProjectionNodeIR, parentPath: string) {
    if (node.children.length === 0) {
      paths.push(`${parentPath}${parentPath === '' ? '' : '.'}${node.path}`);
      return;
    }

    for (const child of node.children) {
      walk(child, `${parentPath}${parentPath === '' ? '' : '.'}${node.path}`);
    }
  }

  for (const node of nodes) {
    walk(node, '');
  }

  return paths;

}
