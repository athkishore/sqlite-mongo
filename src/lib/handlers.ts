import { ObjectId } from "bson";
import type { OpMsgPayloadSection, ParsedOpMsgPayload, ParsedOpQueryPayload, ParsedOpReplyPayload, WireMessage } from "./wire.js";

export function handleOpQuery(payload: ParsedOpQueryPayload): ParsedOpReplyPayload {
  const responsePayload = {
    responseFlags: 8,
    cursorID: 0n,
    startingFrom: 0,
    numberReturned: 1,
    documents: [
      {
        helloOk: true,
        ismaster: true,
        topologyVersion: {
          processId: new ObjectId(),
          counter: 0,        
        },
        maxBsonObjectSize: 16777216,
        maxMessageSizeBytes: 48000000,
        maxWriteBatchSize: 100000,
        localTime: new Date(),
        logicalSessionTimeoutMinutes: 30,
        connectionId: 6,
        minWireVersion: 0,
        maxWireVersion: 21,
        readOnly: false,
        ok: 1,
      },
    ],
  };

  return responsePayload;
}

export function handleOpMsg(payload: ParsedOpMsgPayload): ParsedOpMsgPayload {
  let responsePayload: ParsedOpMsgPayload;

  const body = payload.sections[0];
  if (!body) throw new Error('Missing payload body');
  if (body.sectionKind !== 0) throw new Error('Invalid section kind for body');

  const command = getCommand(body);

  switch(command) {
    case 'buildInfo': {
      // TODO: Unhardcode
      responsePayload = {
        flagBits: 0,
        sections: [
          {
            sectionKind: 0,
            doc: {
              version: '7.0.25',
              gitVersion: 'xxx',
              sysInfo: 'deprecated',
              modules: [],
              allocator: 'tcmalloc',
              javascriptEngine: 'mozjs',
              versionArray: [7, 0, 25, 0],
              openssl: {
                running: 'OpenSSL 3.0.2 15 Mar 2022',
                compiled: 'OpenSSL 3.0.2 15 Mar 2022',
              },
              buildEnvironment: {
                distmod: 'ubuntu2204',
                distarch: 'x86_64',
                cc: '/opt/mongodbtoolchain/v4/bin/gcc; gcc (GCC) 11.3.0',
                ccflags: '-Werror -include mongo/platform/basic.h -ffp-contract=off -fasynchronous-unwind-tables -g2 -Wall -Wsign-compare -Wno-unknown-pragmas -Winvalid-pch -gdwarf-5 -fno-omit-frame-pointer -fno-strict-aliasing -O2 -march=sandybridge -mtune=generic -mprefer-vector-width=128 -Wno-unused-local-typedefs -Wno-unused-function -Wno-deprecated-declarations -Wno-unused-const-variable -Wno-unused-but-set-variable -Wno-missing-braces -fstack-protector-strong -gdwarf64 -Wa,--nocompress-debug-sections -fno-builtin-memcmp -Wimplicit-fallthrough=5',
                cxx: '/opt/mongodbtoolchain/v4/bin/g++: g++ (GCC) 11.3.0',
                cxxflags: '-Woverloaded-virtual -Wpessimizing-move -Wno-maybe-uninitialized -fsized-deallocation -Wno-deprecated -std=c++20',
                linkflags: '-Wl,--fatal-warnings -B/opt/mongodbtoolchain/v4/bin -gdwarf-5 -pthread -Wl,-z,now -fuse-ld=lld -fstack-protector-strong -gdwarf64 -Wl,--build-id -Wl,--hash-style=gnu -Wl,-z,noexecstack -Wl,--warn-execstack -Wl,-z,relro -Wl,--compress-debug-sections=none -Wl,-z,origin -Wl,--enable-new-dtags',
                target_arch: 'x86_64',
                target_os: 'linux',
                cppdefines: 'SAFEINT_USE_INTRINSICS 0 PCRE2_STATIC NDEBUG _XOPEN_SOURCE 700 _GNU_SOURCE _FORTIFY_SOURCE 2 ABSL_FORCE_ALIGNED_ACCESS BOOST_ENABLE_ASSERT_DEBUG_HANDLER BOOST_FILESYSTEM_NO_CXX20_ATOMIC_REF BOOST_LOG_NO_SHORTHAND_NAMES BOOST_LOG_USE_NATIVE_SYSLOG BOOST_LOG_WITHOUT_THREAD_ATTR BOOST_MATH_NO_LONG_DOUBLE_MATH_FUNCTIONS BOOST_SYSTEM_NO_DEPRECATED BOOST_THREAD_USES_DATETIME BOOST_THREAD_VERSION 5',
              },
              bits: 64,
              debug: false,
              maxBsonObjectSize: 16777216,
              storageEngines: ['devnull', 'wiredTiger'],
              ok: 1,              
            },
          },
        ],
      };
      break;
    }
    default: {
      responsePayload = {
        flagBits: 0,
        sections: [
          {
            sectionKind: 0,
            doc: {
              ok: 0,
              errmsg: 'Command not implemented',
              code: 59,
              codeName: 'commandNotImplemented',
            },
          },
        ],
      };
      break;
    }
  }

  return responsePayload;
}

const COMMANDS = [
  'buildInfo'
] as const;

function getCommand(body: Extract<OpMsgPayloadSection, { sectionKind: 0 }>): typeof COMMANDS[number] | '' {
  return COMMANDS.find(el => el in body.doc) ?? '';
}