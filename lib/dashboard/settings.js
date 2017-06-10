'use strict';

const db = require('../database');

class Settings {
  constructor() {}

  get data() {
    return {
      notification: db.settings.get('notification').cloneDeep().value(),
      dashboard: db.settings.get('dashboard').value(),
      api: {
        twitch: db.settings.get('api.twitch').cloneDeep().value(),
        youtube: {
          enabled: false
        },
        streamlabs: db.settings.get('api.streamlabs').cloneDeep().value(),
        tipeee: {
          enabled: false
        },
      }
    };
  }

  set data(data) {

    db.settings.set(data.prop, data.value).write();

    if (data.value) {
      const scheduler = require('../scheduler');

      switch (data.prop) {
      case 'notification.enabled':
        scheduler.notifications();
        break;
      case 'api.twitch.enabled':
        scheduler.api(data.type);
        break;
      case 'api.youtube.enabled':
        scheduler.api(data.type);
        break;
      case 'api.streamlabs.enabled':
        scheduler.api(data.type);
        break;
      case 'api.tipeee.enabled':
        scheduler.api(data.type);
        break;
      }
    }

  }

}

const settings = new Settings();
module.exports = settings;
