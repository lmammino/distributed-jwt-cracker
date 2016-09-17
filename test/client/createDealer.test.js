'use strict';

const test = require('tap').test;
const sinon = require('sinon');
const mockRequire = require('mock-require');
const createProcessBatchMock = require('../mocks/createProcessBatchMock');
const createDealer = require('../../src/client/createDealer');

test('it should store parameters on start request', t => {
  t.plan(4);

  const batchSocket = sinon.stub();
  const exit = sinon.stub();
  const logger = {info: sinon.spy()};
  const dealer = createDealer(batchSocket, exit, logger);

  const id = 'someId';
  const token = 'some.JWT.Token';
  const rawMessage = Buffer(JSON.stringify({
    type: 'start',
    id,
    token
  }));
  dealer(rawMessage);

  t.equal(dealer.getId(), id, 'id set');
  t.equal(dealer.getToken(), token, 'token set');
  t.ok(dealer.getVariations(), 'variations set');
  t.ok(logger.info.called, 'info logged');
});

test('it should request another batch after unsuccessful search', t => {
  t.plan(1);

  const batchSocket = {send: sinon.spy()};
  const exit = sinon.stub();
  const logger = {info: sinon.spy()};
  const verifyExpectations = () => {
    t.ok(batchSocket.send.calledWith(JSON.stringify({type:"next"})), 'Sent next batch request');
    t.end();
  };
  const processBatch = createProcessBatchMock(undefined, undefined, verifyExpectations);
  mockRequire('../../src/client/processBatch', processBatch);
  const createDealer = mockRequire.reRequire('../../src/client/createDealer');
  const dealer = createDealer(batchSocket, exit, logger);

  const rawMessage = Buffer(JSON.stringify({
    type: 'batch',
    batch: [1234, 4567]
  }));
  dealer(rawMessage);
});

test('it should send success and exit after successful search', t => {
  t.plan(2);

  const pwd = 'foo';
  const index = 1234;
  const batchSocket = {send: sinon.spy()};
  const exit = sinon.spy();
  const logger = {info: sinon.spy()};
  const verifyExpectations = () => {
    t.ok(batchSocket.send.calledWith(JSON.stringify({type:"success", password: pwd, index})), 'Sent password');
    t.ok(exit.calledWith(0));
    t.end();
  };
  const processBatch = createProcessBatchMock(pwd, index, verifyExpectations);
  mockRequire('../../src/client/processBatch', processBatch);
  const createDealer = mockRequire.reRequire('../../src/client/createDealer');
  const dealer = createDealer(batchSocket, exit, logger);

  const rawMessage = Buffer(JSON.stringify({
    type: 'batch',
    batch: [1234, 4567]
  }));
  dealer(rawMessage);
});

test('it should log errors in case of incomprehensible message', t => {
  t.plan(1);

  const batchSocket = sinon.stub();
  const exit = sinon.stub();
  const logger = {error: sinon.spy()};
  const dealer = createDealer(batchSocket, exit, logger);

  const rawMessage = Buffer(JSON.stringify({type: 'something'}));
  dealer(rawMessage);

  t.ok(logger.error.calledWith('invalid message received from server', '{"type":"something"}'), 'error info logged');
});
