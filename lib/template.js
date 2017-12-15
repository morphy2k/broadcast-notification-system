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
      this.set();
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

    for (let dir of dirs) {

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
    this.selected = name || this.selected || 'default';

    const selected = this.selected;
    const fromPath = path.resolve(`./templates/${selected}`);
    const toPath = this.toPath;

    const stat = promisify(fs.stat);
    const unlink = promisify(fs.unlink);
    const symlink = promisify(fs.symlink);

    const link = async () => {
      try {
        await symlink(fromPath, toPath, 'dir');
      } catch (err) {
        return Promise.reject(err);
      }

      db.settings.get('notification.template').set('selected', selected).write();
      return;
    };

    try {
      await stat(toPath);
    } catch (e) {
      try {
        await link();
      } catch (err) {
        return Promise.reject(err);
      }
    }

    try {
      await unlink(toPath);
    } catch (err) {
      return Promise.reject(err);
    }

    try {
      link();
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

const template = new Template();
module.exports = template;
