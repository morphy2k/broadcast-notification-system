[![Build Status](https://travis-ci.org/morphy2k/broadcast-notification-system.svg?branch=master)](https://travis-ci.org/morphy2k/broadcast-notification-system)  [![David](https://david-dm.org/morphy2k/broadcast-notification-system.svg)](https://david-dm.org)
[![Code Climate](https://codeclimate.com/github/Morphy2k/broadcast-notification-system.png)](https://codeclimate.com/github/Morphy2k/broadcast-notification-system)

# Broadcast Notification System
The Broadcast Notification System (BNS) is an open, simple and highly customisable notification/alert system for live streams on Twitch and YouTube.

### Features
-   Complete design freedom *(fully HTML, CSS and JS editing)*
-   Trigger different notifications and variations according to your own rules *(soon with v0.11)*
-   Modern and lightweight dashboard with different options, activity feed and weekly statistics
-   Different API support *(look at notes)*
-   Passwordless authentication *(optional)*
-   Runs on your local machine and on remote hosts
-   Cross-platform support

---

## Notes

**The project is still in development and not feature complete!**
**[Roadmap](https://github.com/Morphy2k/broadcast-notification-system/projects)**

#### Notification type support
-   Follows
-   Subscriptions
-   Donations
-   Hosts

#### API support
-   [x] Twitch
-   [x] Streamlabs
-   [ ] TipeeeStream
-   [ ] Twitch Event Tracker *(own project)*
-   [ ] YouTube

#### Current restrictions
-   Only **new** subscriptions will show up, no resubs! *(This will change with a future API implementation like TipeeeStream)*

### Requirements
-   HTML and CSS skills *(+ JS optional)*
-   Technical know-how
-   NodeJS runtime
-   Server (optional)
-   OBS Studio + Browser plugin *(plugin in full package included)*

---

## Getting started

### Install

1.  Download and install the current [NodeJS](https://nodejs.org) version
2.  [Download](https://github.com/Morphy2k/broadcast-notification-system/releases/latest) and extract or clone the repo
3.  Open the bash or command prompt and switch to BNS directory *(as admin on Windows)*

Install it with
```bash
$ npm install --only=production
```
Configure the app via `config.js` in the root directory

Start the app with
```bash
$ npm start --production
```

### Use

1.  Open the dashboard via `http://localhost:8080` or what you have configured *(for best experience please use a chromium based browser)*
2.  Make your settings
3.  Take the default template as example and build your own
4.  Put `http://localhost:8080/notification[/endpoint]` in your OBS browser source *(if authentication on, with token at the end)*

If you have questions or find a bug, please [open an issue](https://github.com/Morphy2k/broadcast-notification-system/issues/new)

**A better guide and wiki will follow later!**
