'use strict';

const zmq = require('zmq');
const isv = require('indexed-string-variation');
const yargs = require('yargs');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

const argv = yargs
  .usage('Usage: $0 <token> [options]')
  .example('$0 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ')
  .demand(1)
  .number('port')
  .default('port', 9900)
  .alias('p', 'port')
  .describe('port', 'The port used to accept incoming connections')
  .number('pubPort')
  .default('pubPort', 9901)
  .alias('P', 'pubPort')
  .describe('pubPort', 'The port used to publish signals to all the workers')
  .string('alphabet')
  .default('alphabet', isv.defaultAlphabet)
  .alias('a', 'alphabet')
  .describe('alphabet', 'The alphabet used to generate the passwords')
  .number('batchSize')
  .alias('b', 'batchSize')
  .default('batchSize', 1000000)
  .describe('batchSize', 'the number of attempts assigned to every client in a batch')
  .number('start')
  .alias('s', 'start')
  .describe('start', 'the index from where to start the search')
  .default('start', 0)
  .number('maxLength')
  .default('maxLength', undefined)
  .alias('m', 'maxLength')
  .describe('maxLength', 'The maximum length for the generated passwords')
  .help()
  .version()
  .check((args, opts) => {
    const token = jwt.decode(args._[0], {complete:true});
    if (!token) {
      throw "Invalid JWT token: cannot decode token";
    }

    if (!(token.header.alg === 'HS256' && token.header.typ === 'JWT')) {
      throw "Invalid JWT token: only HS256 JWT tokens supported";
    }

    return true;
  })
  .argv
;

const token = argv._[0];
const port = argv.port;
const pubPort = argv.pubPort;
const alphabet = argv.alphabet;
const batchSize = argv.batchSize;
const maxLength = argv.maxLength;
const start = argv.start;

let cursor = start;
const clients = new Map();

const addClient = (channel) => {
  const id = channel.toString('hex');
  const client = {id, channel, joinedAt: new Date()}
  assignNextBatch(client);
  clients.set(id, client);

  return client;
}

const assignNextBatch = (client) => {
  const batch = [cursor, cursor + batchSize - 1];
  cursor += batchSize;
  client.currentBatch = batch;
  client.currentBatchStartedAt = new Date();
  return batch;
}

const batchSocket = zmq.socket('router');
const signalSocket = zmq.socket('pub');

batchSocket.on('message', (channel, rawMessage) => {
  const msg = JSON.parse(rawMessage.toString());

  switch (msg.type) {
    case 'join':
      const client = addClient(channel);
      const response = {
        type: 'start',
        id: client.id,
        batch: client.currentBatch,
        alphabet,
        token
      };
      batchSocket.send([channel, JSON.stringify(response)]);
      logger.info(`${client.id} joined (batch: ${client.currentBatch[0]}-${client.currentBatch[1]})`);
      break;

    case 'next':
      const batch = assignNextBatch(clients.get(channel.toString('hex')));
      logger.info(`client ${channel.toString('hex')} requested new batch, sending ${batch[0]}-${batch[1]}`);
      batchSocket.send([channel, JSON.stringify({type: 'batch', batch})]);
      break;

    case 'success':
      const pwd = msg.password;
      logger.info(`client ${channel.toString('hex')} found password "${pwd}"`);
      // publish exit signal
      signalSocket.send(['exit', `password "${pwd}" found by client ${channel.toString('hex')}`]);
      // close the main process after 5 sec (take time to propagate the exit signal);
      setTimeout(() => {
        batchSocket.close();
        signalSocket.close();
        process.exit(0);
      }, 5000);
      break;

    default:
      logger.error('invalid message received from channel', channel.toString('hex'), rawMessage.toString());
  }

});

batchSocket.bindSync(`tcp://*:${port}`);
signalSocket.bindSync(`tcp://*:${pubPort}`);
logger.info(`Server listening on port ${port}, signal publish on port ${pubPort}`);
