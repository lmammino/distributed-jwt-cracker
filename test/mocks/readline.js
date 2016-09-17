'use strict';

module.exports = {
  createInterface: () => {
    return {
      write: () => {},
      close: () => {}
    };
  }
};
