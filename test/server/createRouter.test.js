'use strict';

const test = require('tap').test;
const sinon = require('sinon');
const createRouter = require('../../src/server/createRouter');

test('it must register a client and submit a first batch on connection', t => {
  const batchSocket = {send: sinon.spy()};
  const signalSocket = sinon.mock();
  const token = 'some_token';
  const alphabet = 'some_alphabet';
  const batchSize = 10;
  const start = 5;
  const logger = {info: sinon.spy()};
  const router = createRouter(batchSocket, signalSocket, token, alphabet, batchSize, start, logger);
  const channel = 'some_channel';
  const requestMessage = new Buffer(JSON.stringify({type: 'join'}));

  router(channel, requestMessage);

  const expectedResponse = {
    type: 'start',
    id: channel,
    batch: ['5', '14'],
    alphabet,
    token
  };

  t.plan(3);
  t.ok(batchSocket.send.calledWith([channel, JSON.stringify(expectedResponse)]), 'first batch delivered to dealer');
  t.equals(1, router.getClients().size, 'client registered');
  t.ok(logger.info.called, 'connection logged');
});

test('it must send next batch when requested', t => {
  const batchSocket = {send: sinon.spy()};
  const signalSocket = sinon.mock();
  const token = 'some_token';
  const alphabet = 'some_alphabet';
  const batchSize = 10;
  const start = 5;
  const logger = {info: sinon.spy()};
  const router = createRouter(batchSocket, signalSocket, token, alphabet, batchSize, start, logger);
  const channel = 'some_channel';
  const joinMessage = new Buffer(JSON.stringify({type: 'join'}));
  const nextBatchMessage = new Buffer(JSON.stringify({type: 'next'}));

  router(channel, joinMessage);
  router(channel, nextBatchMessage);

  const expectedNewBatch = ['15', '24'];
  const expectedResponse = {
    type: 'batch',
    batch: expectedNewBatch
  };

  t.plan(2);
  t.ok(batchSocket.send.calledWith([channel, JSON.stringify(expectedResponse)]), 'next batch delivered to dealer');
  t.ok(logger.info.called, 'request logged');
});

test('it must inform all dealers and exit on success request', t => {
  const batchSocket = {close: sinon.spy()};
  const signalSocket = {send: sinon.spy(), close: sinon.spy()};
  const token = 'some_token';
  const alphabet = 'some_alphabet';
  const batchSize = 10;
  const start = 5;
  const logger = {info: sinon.spy()};
  const exit = sinon.spy();
  const router = createRouter(batchSocket, signalSocket, token, alphabet, batchSize, start, logger, exit);
  const channel = 'some_channel';
  const password = 'neo bullet time';
  const successMessage = new Buffer(JSON.stringify({type: 'success', password}));

  router(channel, successMessage);

  const expectedMessage = {
    password,
    client: channel
  };

  const containsPassword = val => val.indexOf(password) !== -1;
  const onSignalSent = signalSocket.send.getCall(0).args[2];
  // simulate callback call
  onSignalSent();

  t.plan(5);
  t.ok(containsPassword(logger.info.getCall(0).args[0]), 'success message logged containing password');
  t.ok(signalSocket.send.calledWith(['exit', JSON.stringify(expectedMessage)], 0, onSignalSent), 'exit signal containing password propagated to clients');
  t.ok(batchSocket.close.called, 'batch socket closed');
  t.ok(signalSocket.close.called, 'signal socket closed');
  t.ok(exit.calledWith(0), 'exit invoked with success code');
});

test('it must log invalid requests', t => {
  const batchSocket = sinon.mock();
  const signalSocket = sinon.mock();
  const token = 'some_token';
  const alphabet = 'some_alphabet';
  const batchSize = 10;
  const start = 5;
  const logger = {error: sinon.spy()};
  const router = createRouter(batchSocket, signalSocket, token, alphabet, batchSize, start, logger);
  const channel = 'some_channel';
  const unexpectedMessage = new Buffer(JSON.stringify({type: 'unexpected'}));

  router(channel, unexpectedMessage);
  t.plan(1);
  t.ok(logger.error.called, 'error info logged');
});
