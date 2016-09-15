'use strict';

const processBatch = require('./processBatch');
const generator = require('indexed-string-variation').generator;

const createDealer = (batchSocket, logger) => {

  let id;
  let variations;
  let token;

  const dealer = (rawMessage) => {
    const msg = JSON.parse(rawMessage.toString());

    switch(msg.type) {
      case 'start':
        id = msg.id;
        variations = generator(msg.alphabet);
        token = msg.token;
        if (logger) {
          logger.info(`client attached, got id "${id}"`);
        }
        break;

      case 'batch':
        if (logger) {
          logger.info(`received batch: ${msg.batch[0]}-${msg.batch[1]}`);
        }
        processBatch(token, variations, msg.batch, (pwd, index) => {
          if (typeof pwd === 'undefined') {
            // request next batch
            if (logger) {
              logger.info(`password not found, requesting new batch`);
            }
            batchSocket.send(JSON.stringify({type:"next"}));
          } else {
            // propagate success
            if (logger) {
              logger.info(`found password "${pwd}" (index: ${index}), exiting now`);
            }
            batchSocket.send(JSON.stringify({type:"success", password: pwd, index}));
            process.exit(0);
          }
        });
        break;

      case 'default':
        if (logger) {
          logger.error('invalid message received from server', rawMessage.toString());
        }
    }
  }

  dealer.getId = () => id;
  dealer.getToken = () => token;
  dealer.getVariations = () => variations;

  return dealer;
}

module.exports = createDealer;
