'use strict';

const test = require('tap').test;
const sinon = require('sinon');
const createSubscriber = require('../../src/client/createSubscriber');

test('it should close sockets and exits on exit message', t => {
  const subSocket = {close: sinon.spy()};
  const batchSocket = {close: sinon.spy()};
  const exit = sinon.spy();
  const logger = {info: sinon.spy()};

  const subscriber = createSubscriber(subSocket, batchSocket, exit, logger);

  subscriber('exit', {});
  t.plan(4);
  t.ok(subSocket.close.called, 'subscriber socket closed');
  t.ok(batchSocket.close.called, 'batch socket closed');
  t.ok(logger.info.called, 'message logged');
  t.ok(exit.called, 'exited');
});
