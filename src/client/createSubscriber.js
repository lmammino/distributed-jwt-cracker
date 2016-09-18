'use strict';

const createSubscriber = (subSocket, batchSocket, exit, logger) => {
  const subscriber = (topic, rawMessage) => {
    if (topic.toString() === 'exit') {
      logger.info(`received exit signal, ${rawMessage.toString()}`);
      batchSocket.close();
      subSocket.close();
      exit(0);
    }
  };

  return subscriber;
};

module.exports = createSubscriber;
