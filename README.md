> This project is in the initial stages of development and is not yet stable. Minimal functionality exists for Create, Read, Update and Delete, but most of the operators are still being implemented. Feel free to [try it out](#get-started), or look around and play with the code.
> 
> You might also be interested in checking out the companion exploration packages at https://github.com/athkishore/chikkadb-journey

# Introduction

ChikkaDB is a server application providing a translation layer around [SQLite](https://sqlite.org/) that enables you to use SQLite as a MongoDB-compatible JSON database. You can connect to ChikkaDB using any of your favourite MongoDB clients or language drivers.

The name of the project is a tribute to the beautiful city of Bengaluru in the diverse southern Indian state of Karnataka, where this project was born. 'Chikka' in Kannada means 'small', 'little', 'young' (as in younger sibling), etc.

The idea for this project is the result of my frustration at `mongod` being restricted to a narrow range of environments, and my growing curiosity around the possibilities of JSON in SQLite. 

I would like to acknowledge [FerretDB](https://www.ferretdb.com/) as my main inspiration. I hadn't imagined myself embarking on such an ambitious project, but when FerretDB completely dropped the SQLite backend to focus on Postgres in their v2, I felt it might be fun to build something in that space.

# Get Started
Clone this repository on a machine with [Node.js](https://nodejs.org) installed. 

1. Install dependencies
```shell
npm install
```
2. Build the typescript source.
```shell
npm run build
```

3. Start the ChikkaDB server. By default it will listen on port 27017, but you can override that using the `--port` CLI argument.
```shell
npm run serve -- --port 9999
```

Connect to ChikkaDB using your favourite MongoDB client and happy databasing!

If you wish to import your existing MongoDB database, `mongorestore` and `mongoimport` work just fine with ChikkaDB.

# Compatibility with MongoDB

ChikkaDB aims to implement a subset of the MongoDB commands that is sufficiently rich to unlock the power of JSON in SQLite. It doesn't aim for completeness in compatibility, since MongoDB has some obscure commands. The selection of commands and operators is based on the expressive value they add in interacting with JSON data stored in SQLite. See [Supported Commands](https://chikkadb.org/reference/database-commands/) to find out which commands are available.

The ChikkaDB server is wire-compatible with `mongod`, so you can connect to ChikkaDB using any of your favourite MongoDB clients or language drivers.

ChikkaDB achieves a great degree of BSON-compatibility by storing and operating on the Extended JSON values wherever the value is not a part of the core JSON specification. See [Data Types](https://chikkadb.org/reference/data-types/) to find more details about the representation and handling of types.

# Architecture

## User-defined functions on top of an SQL scaffold

To begin with, the approach was to translate MongoDB Query Language documents into SQL statements, using SQLite's internal JSON and JSONB functions as much as possible. While the project achieved considerable early success using this approach, it did not seem scalabale or maintainable. The generated SQL statements were extremely complex, and in some cases, slow. It also became difficult to test. 

In July 2026, ChikkaDB has pivoted towards user-defined functions for command components such as match, project, and update, while using SQLite's SQL statements as a scaffold. This means that the queries are going to be much slower in the short run as SQLite calls into Javascript UDFs. However, in the longer run, it can be optimized significantly by a reimplementation in a language that compiles to native code. 

Also, currently ChikkaDB doesn't leverage SQLite's native JSONB storage format. That can speed up queries further.

## Major Components
1. **TCP server** that handles communication with MongoDB Client 
2. **MongoDB Query Language parser** that converts the query into a *canonical syntax tree*
3. **Backend** that translates the canonical syntax tree into SQLite dialect, connects to an SQLite database, and executes the query

This design choice leaves room for extensions and variants in the future. For example, ChikkaDB could possibly be used as an embedded library, as a thin wrapper around SQLite, without the TCP server. Or maybe if there is some other backend implementation that can receive and process the query in the form of the canonical syntax tree, it could be used without SQLite.


# Roadmap

The first version will be written in Typescript as a quick protoyping language. The aim is to implement enough database commands to support basic CRUD functionality. Each document will be stored in a single JSON field in an SQLite table.

If this turns out to be successful, I have a more ambitious plan of reimplementing the server in C (or more realistically Go/Rust), to make it more performant. 

A more detailed roadmap will be made available as the project evolves.

# Fun Project, Serious Project

This is first and foremost a project for me to have fun learning new things I would otherwise not have explored. At the same time, I see that it can fill a gap that is currently not served by any existing solution out there, if it turns out half as well as I hope it will.

There are intresting projects such as [LiteDB](https://www.litedb.org/), [Doclite](https://github.com/dwgebler/doclite), etc. but a lightweight mongod substitute that can talk to MongoDB clients is something different and will be so awesome to have.

Putting it out there even at this early stage in the spirit of building in public. I plan to document my journey on my [blog](https://akishore.in/blog). The journey matters as much as the outcome.

- [2025-10-31 Part 1: Talking to mongod](https://akishore.in/posts/2025-10-31-talking-to-mongod)
- [2025-11-07 Part 2: Eavesdropping on the Wire](https://akishore.in/posts/2025-11-07-eavesdropping-on-wire)
- [2025-11-16 Part 3: Decoding Wire Messages](https://akishore.in/posts/2025-11-16-decoding-wire-messages)