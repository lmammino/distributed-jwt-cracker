#!/usr/bin/env node

'use strict';

const zmq = require('zmq');
const generator = require('indexed-string-variation').generator;
const yargs = require('yargs');
const logger = require('./logger');
const processBatch = require('./client/processBatch');

const argv = yargs
  .usage('Usage: $0 [options]')
  .example('$0 --host=localhost --port=9900 -pubPort=9901')
  .string('host')
  .default('host', 'localhost')
  .alias('h', 'host')
  .describe('host', 'The hostname of the server')
  .number('port')
  .default('port', 9900)
  .alias('p', 'port')
  .describe('port', 'The port used to connect to the batch server')
  .number('pubPort')
  .default('pubPort', 9901)
  .alias('P', 'pubPort')
  .describe('pubPort', 'The port used to subscribe to broadcast signals (e.g. exit)')
  .help()
  .version()
  .argv
;

const host = argv.host;
const port = argv.port;
const pubPort = argv.pubPort;

let getPwd;
let id;
let token;

const batchSocket = zmq.socket('dealer');
const subSocket = zmq.socket('sub');

batchSocket.on('message', (rawMessage) => {
  const msg = JSON.parse(rawMessage.toString());

  switch(msg.type) {
    case 'ping':
      logger.info(`PING received`);
      break;

    case 'start':
      id = msg.id;
      getPwd = generator(msg.alphabet);
      token = msg.token;
      logger.info(`client attached, got id "${id}"`);
    case 'batch':
      logger.info(`received batch: ${msg.batch[0]}-${msg.batch[1]}`);
      processBatch(token, getPwd, msg.batch, (pwd) => {
        if (typeof pwd === 'undefined') {
          // request next batch
          logger.info(`password not found, requesting new batch`);
          batchSocket.send(JSON.stringify({type:"next"}));
        } else {
          // propagate success
          logger.info(`found password "${pwd}", exiting now`);
          batchSocket.send(JSON.stringify({type:"success", password: pwd}));
          process.exit(0);
        }
      });
      break;

    case 'default':
      logger.error('invalid message received from server', rawMessage.toString());
  }
});

subSocket.on('message', (topic, rawMessage) => {
  if (topic.toString() === 'exit') {
    logger.info(`received exit signal, ${rawMessage.toString()}`);
    batchSocket.close();
    subSocket.close();
    process.exit(0);
  }
});

batchSocket.connect(`tcp://${host}:${port}`);
subSocket.connect(`tcp://${host}:${pubPort}`);
subSocket.subscribe('exit');
batchSocket.send(JSON.stringify({"type":"join"}));
