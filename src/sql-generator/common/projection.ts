import type { ProjectionDocIR, ProjectionNodeIR } from "#src/types.js";

export function getProjectionFragment(projection: ProjectionDocIR) {
  const includePaths: string[] = [];

  const { include } = projection;


  let s = '';
  s += `(\n`;
  s += `  WITH\n`;
  s += `  include_paths AS (\n`;

  s += `),\n`;


  s += `)`;


  return s;
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
