#!/usr/bin/env node

'use strict';

const zmq = require('zmq');
const yargs = require('yargs');
const logger = require('./logger');
const createDealer = require('./client/createDealer');
const createSubscriber = require('./client/createSubscriber');

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

const batchSocket = zmq.socket('dealer');
const subSocket = zmq.socket('sub');
const dealer = createDealer(batchSocket, logger);
const subscriber = createSubscriber(subSocket, batchSocket, process.exit, logger);

batchSocket.on('message', dealer);
subSocket.on('message', subscriber);

batchSocket.connect(`tcp://${host}:${port}`);
subSocket.connect(`tcp://${host}:${pubPort}`);
subSocket.subscribe('exit');
batchSocket.send(JSON.stringify({"type":"join"}));
