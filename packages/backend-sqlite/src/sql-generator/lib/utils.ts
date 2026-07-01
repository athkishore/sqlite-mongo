import debug from 'debug';

export const logSql = debug('sqlite:sql');
export const logSqlResult = debug('sqlite:sqlResult');
export const logSqlExecTime = debug('sqlite:sqlExecTime');