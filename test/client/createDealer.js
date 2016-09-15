'use strict';

const test = require('tap').test;
const sinon = require('sinon');
const createDealer = require('../../src/client/createDealer');

test('it should store parameters on start request', t => {
  const batchSocket = sinon.stub();
  const logger = {info: sinon.spy()};

  const dealer = createDealer(batchSocket, logger);
  const id = 'someId';
  const token = 'some.JWT.Token';
  const rawMessage = Buffer(JSON.stringify({
    type: 'start',
    id,
    token
  }));

  dealer(rawMessage);

  t.plan(4);
  t.equal(dealer.getId(), id, 'id set');
  t.equal(dealer.getToken(), token, 'token set');
  t.ok(dealer.getVariations(), 'variations set');
  t.ok(logger.info.called, 'info logged');
});
