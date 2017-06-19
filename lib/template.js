'use strict';

const path = require('path');
const fs = require('fs');
const {promisify} = require('util');

const db = require('./database');


class Template {
  constructor() {

    this.selected = db.settings.get('notification.template.selected').value();
    this.fromPath = path.resolve(`./templates/${this.selected}`);
    this.toPath = path.resolve('./views/template');

    try {
      this.search();
    } catch (e) {
      console.error(new Error(e));
    }

    try {
      this.set();
    } catch (e) {
      console.error(new Error(e));
    }

  }

  search() {
    return new Promise(async(resolve, reject) => {

      const readdir = promisify(fs.readdir);

      let dirs = [];

      try {
        dirs = await readdir('./templates');
      } catch (e) {
        return reject(e);
      }

      let templates = [],
        length = dirs.length,
        i = 0;

      for (let dir of dirs) {

        templates.push(dir);

        i = i + 1;

        if (i === length) {
          db.settings.get('notification.template').set('list', templates).write();
          resolve({
            templates,
            selected: this.selected
          });
        }
      }

    });
  }

  set(name) {
    return new Promise(async(resolve, reject) => {

      this.selected = name || this.selected || 'default';

      const selected = this.selected;
      const fromPath = path.resolve(`./templates/${selected}`);
      const toPath = this.toPath;

      const stat = promisify(fs.stat);
      const unlink = promisify(fs.unlink);
      const symlink = promisify(fs.symlink);

      const link = () => {
        try {
          symlink(fromPath, toPath, 'dir');
        } catch (e) {
          return reject(e);
        }

        db.settings.get('notification.template').set('selected', selected).write();
        resolve();
      };

      try {
        await stat(toPath);
      } catch (e) {
        return link();
      }

      try {
        await unlink(toPath);
      } catch (e) {
        return reject(e);
      }

      link();

    });
  }
}

const template = new Template();
module.exports = template;
