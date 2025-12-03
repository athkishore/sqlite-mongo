import { ObjectId } from "bson";

export function stringifyToCustomJSON(value: any) {
  const orig_ObjectId_toJSON = ObjectId.prototype.toJSON;
  const orig_Date_toJSON = Date.prototype.toJSON;

  ObjectId.prototype.toJSON = function(this: ObjectId) {
    return { $oid: this.toHexString() };
  } as any;
  
  Date.prototype.toJSON = function(this: Date) {
    return { $date: this.toISOString() };
  } as any;


  try {
    return JSON.stringify(value);  
  } finally {
    ObjectId.prototype.toJSON = orig_ObjectId_toJSON;
    Date.prototype.toJSON = orig_Date_toJSON;
  }
}

export function parseFromCustomJSON(text: string) {
  return JSON.parse(text, (_, value) => {
    if (value && typeof value === 'object') {
      if (value.$oid) {
        return new ObjectId(value.$oid as string);
      }
      if (value.$date) {
        return new Date(value.$date);
      }
    }
    return value;
  });
}