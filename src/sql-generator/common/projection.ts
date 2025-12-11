import type { ProjectionDocIR, ProjectionNodeIR } from "#src/types.js";

export function getProjectionFragment(projection: ProjectionDocIR) {
  const includePaths = getPathsFromIR(projection.include);

  console.log(includePaths);


  let s = '';
  s += `(\n`;
  s += `  WITH\n`;
  s += `  include_paths AS (\n`;
  
  for (const [index, path] of includePaths.entries()) {
    s += `    SELECT '${path}' AS _path, ${path.split('.').length} AS _length\n`
    if (index < includePaths.length - 1) {
      s += `    UNION\n`;
    }
  }
  
    s += `),\n`;


  s += `)`;

  console.log(s);


  return '';
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
