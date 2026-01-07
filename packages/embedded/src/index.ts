import fs from 'fs';

export class Client {
  dbPath: string;
  connected = false;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  connect() {
    try {
      fs.accessSync(this.dbPath, fs.constants.R_OK | fs.constants.W_OK);
      this.connected = true;
    } catch (error) {
      console.error(error);
    }
  }

  db(dbName: string) {
    
  }
}

export class Database {

}

export class Collection {

}