'use strict';

const jwt = require('jsonwebtoken');
const readline = require('readline');

const processBatch = (token, variations, batch, cb) => {
  const chunkSize = 1000;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
  });

  const processChunk = (from, to) => {
    let pwd;
    const progress = Math.floor((from - batch[0]) / (batch[1] - batch[0]) * 100);
    rl.write(`>  ${progress}% (${variations(from)} - ${variations(to)})`);

    for (let i = from; i < to; i++) {
      pwd = variations(i);
      try {
        jwt.verify(token, pwd, {ignoreExpiration: true, ignoreNotBefore: true});
        // finished, password found
        rl.write(null, {ctrl: true, name: 'u'});
        rl.close();
        return cb(pwd, i);
      } catch (e) {}
    }

    // prepare next chunk
    from = to;
    to = Math.min(batch[1], from + chunkSize);

    rl.write(null, {ctrl: true, name: 'u'});
    if (from === to) {
      // finished, password not found
      rl.close();
      return cb(undefined);
    }

    // process next chunk
    setImmediate(() => processChunk(from, to));
  };

  setImmediate(() => processChunk(batch[0], Math.min(batch[1], batch[0] + chunkSize)));
};

module.exports = processBatch;
