'use strict';

const bigInt = require('big-integer');
const jwt = require('jsonwebtoken');
const readline = require('readline');

const processBatch = (token, variations, batch, cb) => {
  const chunkSize = bigInt(String(1000));
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
  });

  const batchStart = bigInt(batch[0]);
  const batchEnd = bigInt(batch[1]);

  const processChunk = (from, to) => {
    let pwd;
    const progress = from.minus(batchStart).multiply(bigInt(String(100))).divide(batchEnd.minus(batchStart));
    rl.write(`>  ${progress}% (${variations(from)} - ${variations(to)})`);

    for (let i = from; i.lesser(to); i = i.add(bigInt.one)) {
      pwd = variations(i);
      try {
        jwt.verify(token, pwd, {ignoreExpiration: true, ignoreNotBefore: true});
        // finished, password found
        rl.write(null, {ctrl: true, name: 'u'});
        rl.close();
        return cb(pwd, i.toString());
      } catch (e) {}
    }

    // prepare next chunk
    from = to;
    to = bigInt.min(batchEnd, from.add(chunkSize));

    rl.write(null, {ctrl: true, name: 'u'});
    if (from === to) {
      // finished, password not found
      rl.close();
      return cb(undefined);
    }

    // process next chunk
    setImmediate(() => processChunk(from, to));
  };

  const firstChunkStart = batchStart;
  const firstChunkEnd = bigInt.min(batchEnd, batchStart.add(chunkSize));
  setImmediate(() => processChunk(firstChunkStart, firstChunkEnd));
};

module.exports = processBatch;
