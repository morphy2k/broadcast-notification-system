'use strict';

const request = require('request');

const db = require('../../database');


class Hosts {
  constructor(userId) {

    this.url = `https://tmi.twitch.tv/hosts?include_logins=1&target=${userId}`;
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
        await this.compare(body);
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

      request(url, async(err, response, body) => {
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
    return new Promise(async(resolve, reject) => {

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

            try {
              await new Promise((resolve, reject) => {
                request(`https://tmi.twitch.tv/group/user/${name}/chatters`,
                  (err, response, body) => {
                    if (err) {
                      return reject(err);
                    } else if (response.statusCode === 200) {

                      let json = JSON.parse(body),
                        viewers = json.chatter_count;

                      if (viewers > 1) {
                        arr.push({
                          name,
                          display_name,
                          viewers,
                          date: new Date()
                        });
                      }

                      resolve();

                    } else {
                      return reject(`TMI HTTP ${response.statusCode}`);
                    }
                  });
              });
            } catch (e) {
              return reject(e);
            }

            last.push(id);

          }

          i = i + 1;

          if (i === length) resolve({
            arr,
            last
          });
        }
      } else {
        resolve(null);
      }

    });
  }

  compare(body) {
    return new Promise(async(resolve, reject) => {

      const json = JSON.parse(body),
        hosts = json.hosts;

      if (hosts && hosts.length) {
        if (this.last.length) {

          let lasts = this.last,
            current = [];

          await new Promise(resolve => {
            let i = 0;
            for (let host of hosts) {
              current.push(host.host_id);
              i = i + 1;
              if (i === hosts.length) resolve();
            }
          });

          await new Promise(resolve => {
            let i = 0;
            for (let last of lasts) {
              if (!current.includes(last)) {
                this.last.splice(i, 1);
              } else {
                i = i + 1;
              }
              if (i === lasts.length) resolve();
            }
          });

          db.queue.set('hosts.last', this.last).write();
          resolve();

        } else {
          resolve(null);
        }
      } else if (this.last.length) {
        this.last.length = 0;
        db.queue.get('hosts.last').remove().write();
        reject();
      } else {
        reject();
      }

    });
  }

}

module.exports = Hosts;
