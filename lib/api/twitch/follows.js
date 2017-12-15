'use strict';

const request = require('request-promise-native');
const moment = require('moment');

const db = require('../../database');


class Follows {
  constructor(userId, options) {
    this.options = Object.assign({}, options);
    this.options.uri = `https://api.twitch.tv/kraken/channels/${userId}/follows`;
  }

  async check() {

    let data;
    try {
      data = await this.worker();
    } catch (e) {
      return Promise.reject(e);
    }

    if (data) {
      db.queue.get('follows').set('last', data.arr[0].date).write();

      data.arr.reverse();

      db.stats.get('follows').assign(data.week).write();

      for (let el of data.bl) {
        db.blacklist.get('list').push(el).write();
      }

      return {
        type: 'follows',
        arr: data.arr
      };
    } else {
      return null;
    }
  }

  worker() {

    let arr = [],
      bl = [],
      week = db.stats.get('follows').value(),
      options = this.options,
      last = db.queue.get('follows.last').value();

    if (!last) {
      last = moment().startOf('isoWeek')._d;
      db.queue.get('follows').set('last', last).write();
    }
    last = new Date(last);


    const get = async cursor => {

      if (cursor) Object.assign(options.qs, {
        cursor
      });

      try {
        return parse(await request(options));
      } catch (err) {
        return Promise.reject(err);
      }

    };


    const parse = body => {

      const json = JSON.parse(body),
        follows = json.follows,
        length = follows.length;

      let i = 1;

      if (length) {
        for (let follow of follows) {

          const id = parseInt(follow.user._id),
            name = follow.user.name,
            display_name = follow.user.display_name,
            date = new Date(follow.created_at),
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
            return {
              arr,
              week,
              bl
            };
          } else {
            return null;
          }

          if (i === length && json._cursor) {
            return get(json._cursor);
          } else if (i === length) {
            return {
              arr,
              week,
              bl
            };
          }

          i = i + 1;
        }
      } else {
        return null;
      }
    };

    return get();
  }

}

module.exports = Follows;
