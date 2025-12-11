import type { ProjectionDocIR, ProjectionNodeIR } from "#src/types.js";

export function getProjectionFragment(projection: ProjectionDocIR) {
  const includePaths = getPathsFromIR(projection.include);

  console.log(includePaths);


  let s = '';
  s += `(\n`;
  s += `  WITH\n`;
  
  /** include_paths CTE */
  s += `  include_paths AS (\n`;
  
  let maxPathLength = 0;
  for (const [index, path] of includePaths.entries()) {
    const pathLength = path.split('.').length;
    if (pathLength > maxPathLength) maxPathLength = pathLength;
    s += `    SELECT '${path}' AS _path, ${pathLength} AS _length\n`
    if (index < includePaths.length - 1) {
      s += `    UNION\n`;
    }
  }
  
  s += `  ),\n`;
  /** End of include_paths CTE */

  let pathIndex = 0;

  while (pathIndex < maxPathLength) {
    /** p{i} CTE */
    s += `  p${pathIndex} AS (\n`;
    s += `  ),\n`;
    /** End of p{i} CTE */

    if (pathIndex === maxPathLength - 1) {
      pathIndex++;
      continue;
    }
    
    /** p{i}_each CTE */
    s += `  p${pathIndex}_each AS (\n`;
    s += `  ),\n`;
    /** End of p{i}_each CTE */
    pathIndex++;
  }

  pathIndex -= 2;
  while (pathIndex >= 0) {
    /** p{i}_each_mod CTE */
    s += `  p${pathIndex}_each_mod AS (\n`;
    s += `  ),\n`;
    /** End of p{i}_each_mod */

    /** p{i}_mod CTE */
    s += `  p${pathIndex}_mod AS (\n`;
    s += `  ),\n`;
    /** End of p{i}_mod CTE */
    pathIndex--;
  }


  s += `)`;

  console.log(s);
  console.log(maxPathLength);


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
