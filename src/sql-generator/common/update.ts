import config from "#src/config.js";
import type { UpdateNodeIR } from "../../types.js";
import { getValueSqlFragment } from "./filter.js";

const JSON_TYPE = config.enableJSONB ? 'jsonb' : 'json';

export function getUpdateFragment(update: UpdateNodeIR[]) {
  for (const element of update) {
    switch(element.operator) {
      case '$set': {
        const argPairs = element.operandsArr.map((item, index, arr) => {
          const ref = item[0].$ref;
          const val = item[1];

          const fieldPathSegments = ref.split('.');

          const sqlFieldRef = fieldPathSegments.reduce((acc, seg) => {
            return !isNaN(Number(seg))
              ? `${acc}[${seg}]`
              : `${acc}.${seg}`;
          }, '$');

          const sqlValue = Array.isArray(val) || (!!val && typeof val === 'object')
            ? `${JSON_TYPE}(${getValueSqlFragment(val)})`
            : getValueSqlFragment(val);

          let s = '';
          s += `'${sqlFieldRef}',\n`;
          s += `${sqlValue}${index === arr.length - 1 ? '' : ','}\n`;
          return s;
        });


        let s = '';
        s += `${JSON_TYPE}_set(\n`;
        s += `  c.doc,\n`;
        for (const argPair of argPairs) {
          s += argPair;
        }
        s += `)\n`;
        return s;
      }

      case '$unset': {
        const args = element.operandsArr.map((item, index, arr) => {
          const ref = item[0].$ref;

          const fieldPathSegments = ref.split('.');

          const sqlFieldRef = fieldPathSegments.reduce((acc, seg) => {
            return !isNaN(Number(seg))
              ? `${acc}[${seg}]`
              : `${acc}.${seg}`;
          }, '$');

          let s = '';
          s += `'${sqlFieldRef}'${index === arr.length - 1 ? '' : ','}\n`;
          return s;
        });

        let s = '';
        s += `${JSON_TYPE}_remove(\n`;
        s += `  c.doc,\n`;
        for (const arg of args) {
          s += arg;
        }
        s += `)\n`;
        return s;
      }
    }
  }
}