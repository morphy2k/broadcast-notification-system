'use strict';

require('./socket');

const settings = require('./settings');
const stats = require('./stats');

exports.data = async () => {
  return {
    settings: settings.data,
    stats: stats.data
  };
};
