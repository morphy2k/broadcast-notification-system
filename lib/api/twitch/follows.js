'use strict';

const request = require('request');
const moment = require('moment');

const db = require('../../database');


class Follows {
  constructor(userId, options) {
    this.url = `https://api.twitch.tv/kraken/channels/${userId}/follows`;
    this.options = options;
  }

  check() {
    return new Promise(async(resolve, reject) => {

      let data;

      try {
        data = await this.worker();
      } catch (e) {
        return reject(e);
      }

      if (data) {
        db.queue.get('follows').set('last', new Date(data.arr[0].date).toISOString()).write();

        data.arr.reverse();

        db.stats.get('follows').assign(data.week).write();

        for (let el of data.bl) {
          db.blacklist.get('list').push(el).write();
        }

        resolve({
          type: 'follows',
          arr: data.arr
        });
      } else {
        resolve(null);
      }

    });
  }

  worker() {
    return new Promise((resolve, reject) => {

      const url = this.url;
      const last = new Date(db.queue.get('follows.last').value()).toISOString();

      let arr = [],
        bl = [],
        week = db.stats.get('follows').value(),
        options = this.options;


      const get = cursor => {

        if (cursor) {
          Object.assign(options.qs, {
            cursor
          });
        }

        request(url, options, (err, response, body) => {
          if (err) {
            reject(err);
          } else if (response.statusCode === 200) {
            parse(body);
          } else {
            reject(`[TWITCH FOLLOWS] HTTP ${response.statusCode}`);
          }
        });
      };


      const parse = body => {

        const json = JSON.parse(body),
          follows = json.follows,
          length = follows.length - 1;

        let i = 0;

        if (length) {
          for (let follow of follows) {

            const id = parseInt(follow.user._id),
              name = follow.user.name,
              display_name = follow.user.display_name,
              date = new Date(follow.created_at).toISOString(),
              blacklist = db.blacklist.get('list').value(),
              blocked = blacklist.includes(id);

            if (date > last) {
              if (!blocked) {

                arr.push({
                  id,
                  name,
                  display_name,
                  date
                });

                const day = moment(date).isoWeekday() - 1;
                week[day] = week[day] + 1;

                bl.push(id);
              }
            } else if (arr.length) {
              resolve({
                arr,
                week,
                bl
              });
              break;
            } else {
              resolve(null);
              break;
            }

            i = i + 1;

            if (i === length && json._cursor) {
              get(json._cursor);
            } else if (i === length) {
              resolve({
                arr,
                week,
                bl
              });
            }
          }
        } else {
          resolve(null);
        }
      };

      get();

    });
  }

}

module.exports = Follows;
