import { parseFilterDoc } from "./filter.js";

const filterJSON = process.argv[2];
if (!filterJSON) throw new Error('filter required');

const filter = JSON.parse(filterJSON);

const parsedNode = parseFilterDoc(filter, { parentKey: null });

console.dir(parsedNode, { depth: null });