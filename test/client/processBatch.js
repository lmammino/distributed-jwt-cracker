'use strict';

const test = require('tap').test;
const mockery = require('mockery');
const generator = require('indexed-string-variation').generator;
mockery.enable({
  warnOnReplace: false,
  warnOnUnregistered: false
});

mockery.registerMock('readline', require('../mocks/readline'));
const processBatch = require('../../src/client/processBatch');

const testBatch = (t, batch, expectNotFound) => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ';
  const alphabet = 'scret';
  const expectedPassword = !expectNotFound ? 'secret' : undefined;
  const expectedIndex = !expectNotFound ? 5975 : undefined;

  const getPwd = generator(alphabet);

  const onComplete = (password, index) => {
    t.equal(password, expectedPassword);
    t.equal(index, expectedIndex);
    t.end();
  }

  processBatch(token, getPwd, batch, onComplete);
}

test('it must return the secret in batch when found in a single chunk iteration', t => {
  testBatch(t, [5950, 6000]);
});

test('it must return the secret in batch when found after multiple iterations', t => {
  testBatch(t, [2950, 6000]);
});

test('it must return undefined when password is not found in batch', t => {
  testBatch(t, [6000, 8000], true);
});