'use strict';

const createProcessBatchMock = (returnPassword, returnIndex, onFinish) => {
  const processBatch = (token, variations, batch, cb) => {
    setImmediate(() => {
      cb(returnPassword, returnIndex);
      onFinish();
    });
  };

  return processBatch;
};

module.exports = createProcessBatchMock;
