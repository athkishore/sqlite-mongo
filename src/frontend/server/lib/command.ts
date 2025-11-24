import type { MQLCommand } from "#frontend/types.js";
import type { OpMsgPayload } from "./wire.js";

export function getCommandFromOpMsg(payload: OpMsgPayload): MQLCommand {
  return {
    command: 'create',
    database: '',
    collection: '',
  };
}