import { translateCommandToSQL } from "#backend/sql-generator/update.js";
import type { UpdateCommand } from "#frontend/types.js";
import { type UpdateCommandIR, type UpdateNodeIR, type Value } from "#shared/types.js";
import { parseFilterDoc } from "./common/filter.js";
import { parseUpdateDoc } from "./common/update.js";

export function parseUpdateCommand(command: UpdateCommand): UpdateCommandIR {
  const { updates } = command;

  const { q, u } = updates?.[0] ?? {};

  // TODO: Support multiple updates

  if (!q) throw new Error('Missing filter');
  if (!u) throw new Error('Missing update');

  const [filterParseError, filterIR] = parseFilterDoc(q, { parentKey: null });
  if (filterParseError) throw filterParseError;

  const [updateParseError, updateIR] = parseUpdateDoc(u);
  if (updateParseError) throw updateParseError;

  return {
    ...command,
    updates: [{
      filter: filterIR,
      update: updateIR,
    }]
  }
}

// const cmd: UpdateCommand = {
//   command: 'update',
//   database: 'test',
//   collection: 'users',
//   updates: [
//     {
//       q: { username: 'user1' },
//       u: { $set: { email: 'user1@example.org', name: 'User 1' } },
//     },
//   ],
// }

// const cmdIR = parseUpdateCommand(cmd);

// console.dir(cmdIR, { depth: null });

// const {
//   collection,
//   updates
// } = cmdIR;

// const {
//   filter,
//   update
// } = updates[0] ?? {};

// if (!filter || !update) throw 'missing filter or update';

// const sql = translateCommandToSQL({ collection, filter, update });
// console.log(sql);