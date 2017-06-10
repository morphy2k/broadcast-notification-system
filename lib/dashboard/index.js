'use strict';

require('./socket');

const settings = require('./settings');
const stats = require('./stats');

exports.data = () => {
  return new Promise(resolve => {

    resolve({
      settings: settings.data,
      stats: stats.data
    });

  });
};
