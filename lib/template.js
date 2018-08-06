'use strict';

const path = require('path');
const fs = require('fs');
const {promisify} = require('util');

const db = require('./database');


class Template {
  constructor() {
    this.selected = db.settings.get('notification.template.selected').value();
    this.targetPath = path.resolve('./views/template');

    try {
      this.search();
      this.set(this.selected);
    } catch (e) {
      console.error(new Error(e));
    }

  }

  async search() {
    const readdir = promisify(fs.readdir);

    let dirs = [];

    try {
      dirs = await readdir('./templates');
    } catch (e) {
      return Promise.reject(e);
    }

    let templates = [],
      length = dirs.length,
      i = 0;

    for (const dir of dirs) {

      templates.push(dir);

      i = i + 1;

      if (i === length) {
        db.settings.get('notification.template').set('list', templates).write();
        return {
          templates,
          selected: this.selected
        };
      }
    }
  }

  async set(name) {
    const selected = name || 'default';
    const source = path.resolve(`./templates/${selected}`);
    const target = this.targetPath;

    const readlink = promisify(fs.readlink);
    const unlink = promisify(fs.unlink);
    const symlink = promisify(fs.symlink);

    const link = async () => {
      try {
        await symlink(source, target, 'dir');
      } catch (err) {
        return Promise.reject(err);
      }

      db.settings.get('notification.template').set('selected', selected).write();
      return;
    };

    try {
      const src = await readlink(target);
      if (src === source) return;
    } catch (err) {
      if (err.errno === -2) {
        await link();
        return;
      } else {
        return Promise.reject(err);
      }
    }

    try {
      await unlink(target);
    } catch (err) {
      return Promise.reject(err);
    }

    try {
      await link();
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

const template = new Template();
module.exports = template;
