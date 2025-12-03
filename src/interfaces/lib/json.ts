import { ObjectId, EJSON } from "bson";

export function stringifyToCustomJSON(value: any) {
  // return EJSON.stringify(value, { relaxed: false });
  return JSON.stringify(value);
}

export function parseFromCustomJSON(text: string) {
  // return EJSON.parse(text, { relaxed: false });
  return JSON.parse(text);
}