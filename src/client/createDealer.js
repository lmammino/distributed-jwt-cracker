'use strict';

const processBatch = require('./processBatch');
const generator = require('indexed-string-variation').generator;

const createDealer = (batchSocket, exit, logger) => {
  let id;
  let variations;
  let token;

  const dealer = rawMessage => {
    const msg = JSON.parse(rawMessage.toString());

    const start = msg => {
      id = msg.id;
      variations = generator(msg.alphabet);
      token = msg.token;
      logger.info(`client attached, got id "${id}"`);
    };

    const batch = msg => {
      logger.info(`received batch: ${msg.batch[0]}-${msg.batch[1]}`);
      processBatch(token, variations, msg.batch, (pwd, index) => {
        if (typeof pwd === 'undefined') {
          // request next batch
          logger.info(`password not found, requesting new batch`);
          batchSocket.send(JSON.stringify({type: 'next'}));
        } else {
          // propagate success
          logger.info(`found password "${pwd}" (index: ${index}), exiting now`);
          batchSocket.send(JSON.stringify({type: 'success', password: pwd, index}));
          exit(0);
        }
      });
    };

    switch (msg.type) {
      case 'start':
        start(msg);
        batch(msg);
        break;

      case 'batch':
        batch(msg);
        break;

      default:
        logger.error('invalid message received from server', rawMessage.toString());
    }
  };

  dealer.getId = () => id;
  dealer.getToken = () => token;
  dealer.getVariations = () => variations;

  return dealer;
};

module.exports = createDealer;
