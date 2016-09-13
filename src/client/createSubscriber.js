'use strict';

const createSubscriber = (subSocket, batchSocket, logger) => {
  return (topic, rawMessage) => {
    if (topic.toString() === 'exit') {
      if (logger) {
        logger.info(`received exit signal, ${rawMessage.toString()}`);
      }
      batchSocket.close();
      subSocket.close();
      process.exit(0);
    }
  }
}

module.exports = createSubscriber;
