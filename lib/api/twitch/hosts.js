'use strict';

const request = require('request');

const db = require('../../database');


class Hosts {
  constructor(userId, options) {

    this.url = `https://tmi.twitch.tv/hosts?include_logins=1&target=${userId}`;
    this.options = options;

    this.last = db.queue.get('hosts.last').value();

  }

  check() {
    return new Promise(async(resolve, reject) => {

      let body;

      try {
        body = await this.get();
      } catch (e) {
        return reject(e);
      }

      try {
        await this.cleanup(body);
      } catch (e) {
        return resolve();
      }

      let data;

      try {
        data = await this.parse(body);
      } catch (e) {
        return reject(e);
      }

      if (data) {
        this.last = data.last;
        db.queue.get('hosts').set('last', this.last).write();
        resolve(data.arr);
      } else {
        resolve(null);
      }

    });
  }

  get() {
    return new Promise((resolve, reject) => {

      const url = this.url;
      const options = this.options;

      request(url, options, async(err, response, body) => {
        if (err) {
          reject(err);
        } else if (response.statusCode === 200) {
          resolve(body);
        } else {
          reject(`TMI HTTP ${response.statusCode}`);
        }
      });
    });
  }

  parse(body) {
    return new Promise((resolve, reject) => {

      const options = this.options;

      let json = JSON.parse(body),
        hosts = json.hosts,
        length = hosts.length,
        i = 0,
        arr = [],
        last = this.last;

      if (length) {
        for (let host of hosts) {

          let id = host.host_id,
            name = host.host_login,
            display_name = host.host_display_name;

          if (!last.includes(id)) {
            request(`https://tmi.twitch.tv/group/user/${name}/chatters`,
              options, (err, response, body) => {
                if (err) {
                  reject(err);
                } else if (response.statusCode === 200) {

                  let json = JSON.parse(body);

                  let viewers = json.chatter_count;

                  if (viewers > 1) {
                    arr.push({
                      display_name,
                      viewers
                    });

                    last.push(id);

                    i = i + 1;

                    if (i === length) resolve({
                      arr,
                      last
                    });
                  }
                } else {
                  reject(`TMI HTTP ${response.statusCode}`);
                }
              });

          } else {
            i = i + 1;
          }
        }
      } else {
        resolve(null);
      }
    });
  }

  cleanup(body) {
    return new Promise((resolve, reject) => {

      const json = JSON.parse(body),
        hosts = json.hosts;

      if (hosts && hosts.length) {
        if (this.last.length) {
          for (let i = 0; i < this.last.length; i++) {
            let lastHost = this.last[i];

            for (let host of hosts) {
              if (host.host_id !== lastHost) {
                this.last.splice(i, 1);
                break;
              }
            }

            if (i >= this.last.length) {
              db.queue.set('hosts.last', this.last).write();
              resolve();
            }
          }
        } else {
          resolve(null);
        }
      } else {
        this.last.length = 0;
        db.queue.get('hosts.last').remove().write();
        reject();
      }

    });
  }

}

module.exports = Hosts;
