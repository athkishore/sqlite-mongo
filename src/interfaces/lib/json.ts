import { Decimal128, ObjectId, Binary, MinKey, MaxKey, BSONRegExp, Timestamp, EJSON } from "bson";

export function stringifyToCustomJSON(value: any) {
  const orig_ObjectId_toJSON = ObjectId.prototype.toJSON;
  const orig_Date_toJSON = Date.prototype.toJSON;
  const orig_Binary_toJSON = Binary.prototype.toJSON;
  const orig_Timestamp_toJSON = Timestamp.prototype.toJSON;

  ObjectId.prototype.toJSON = function(this: ObjectId) {
    return { $oid: this.toHexString() };
  } as any;
  
  Date.prototype.toJSON = function(this: Date) {
    return { $date: this.toISOString() };
  } as any;

  Binary.prototype.toJSON = function(this: Binary) {
    return { $binary: { base64: orig_Binary_toJSON.apply(this), subType: this.sub_type.toString() } };
  } as any;

  (MinKey.prototype as any).toJSON = function() {
    return { $minKey: 1 };
  };

  (MaxKey.prototype as any).toJSON = function() {
    return { $maxKey: 1 };
  };

  Timestamp.prototype.toJSON = function(this: Timestamp) {
    return { $timestamp: { t: this.t, i: this.i } };
  } as any;

  try {
    return JSON.stringify(value, (_, v) => {
      if (v instanceof RegExp) {
        return {
          $regularExpression: {
            pattern: v.source,
            options: v.flags,
          },
        };
      }

      return v;
    });  
  } finally {
    ObjectId.prototype.toJSON = orig_ObjectId_toJSON;
    Date.prototype.toJSON = orig_Date_toJSON;
    Binary.prototype.toJSON = orig_Binary_toJSON;
    delete (MinKey.prototype as any).toJSON;
    delete (MaxKey.prototype as any).toJSON;
    Timestamp.prototype.toJSON = orig_Timestamp_toJSON;
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
      if (value.$numberDecimal) {
        return new Decimal128(value.$numberDecimal);
      }

      if (value.$binary) {
        return new Binary(Buffer.from(value.$binary.base64, 'base64'), Number(value.$binary.subType));
      }

      if (value.$minKey) {
        return new MinKey();
      }

      if (value.$maxKey) {
        return new MaxKey();
      }

      if (value.$regularExpression) {
        return new BSONRegExp(value.$regularExpression.pattern, value.$regularExpression.options);
      }

      if (value.$timestamp) {
        return EJSON.parse(JSON.stringify(value));
      }
    }
    return value;
  });
}