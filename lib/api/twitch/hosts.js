'use strict';

const request = require('request-promise-native');

const db = require('../../database');


class Hosts {
  constructor(userId) {
    this.uri = `https://tmi.twitch.tv/hosts?include_logins=1&target=${userId}`;
    this.last = db.queue.get('hosts.last').value();
  }

  async check() {

    let data;
    try {
      const body = await request(this.uri);
      if (!this.compare(body)) return null;
      data = await this.parse(body);
    } catch (err) {
      return Promise.reject(err);
    }

    if (data) {
      db.queue.get('hosts').set('last', this.last).write();
      return {
        type: 'hosts',
        arr: data.arr
      };
    } else {
      return null;
    }
  }

  async parse(body) {

    const json = JSON.parse(body),
      hosts = json.hosts,
      length = hosts.length;

    let i = 1,
      arr = [];

    if (length) {
      for (let host of hosts) {

        const id = host.host_id,
          name = host.host_login,
          display_name = host.host_display_name;

        if (!this.last.includes(id)) {

          const add = async () => {
            try {
              const body = request(`https://tmi.twitch.tv/group/user/${name}/chatters`);

              const json = JSON.parse(body),
                viewers = json.chatter_count;

              if (viewers > 2) {
                arr.push({
                  name,
                  display_name,
                  viewers,
                  date: new Date()
                });
              }

              this.last.push(id);

              return;

            } catch (err) {
              console.error(err);
              return;
            }
          };

          await add();

        }

        if (i === length) {
          if (arr.length) {
            return {
              arr
            };
          } else {
            return null;
          }
        }

        i = i + 1;
      }
    } else {
      return null;
    }
  }

  compare(body) {
    const json = JSON.parse(body),
      hosts = json.hosts;

    if (hosts.length) {
      if (this.last.length) {

        const getCurrent = hosts => {
          let arr = [],
            i = 1;

          for (const host of hosts) {
            arr.push(host.host_id);

            if (i === hosts.length) return arr;
            i = i + 1;
          }
        };

        const getLast = current => {
          let i = 0,
            arr = [];

          for (const last of this.last) {
            if (current.includes(last)) {
              arr.push(last);
            }

            if (i === this.last.length - 1) return arr;
            i = i + 1;
          }
        };

        const current = getCurrent(hosts);
        this.last = getLast(current);

        db.queue.set('hosts.last', this.last).write();
        return true;

      } else {
        return true;
      }
    } else if (this.last.length) {
      this.last.length = 0;
      db.queue.get('hosts.last').remove().write();
      return false;
    } else {
      return false;
    }
  }

}

module.exports = Hosts;
