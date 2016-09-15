'use strict';

const createSubscriber = (subSocket, batchSocket, exit, logger) => {
  const subscriber = (topic, rawMessage) => {
    if (topic.toString() === 'exit') {
      if (logger) {
        logger.info(`received exit signal, ${rawMessage.toString()}`);
      }
      batchSocket.close();
      subSocket.close();
      if (typeof exit === 'function') {
        exit(0);
      }
    }
  }

  return subscriber;
}

module.exports = createSubscriber;
