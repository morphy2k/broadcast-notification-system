# Broadcast Notification System
The Broadcast Notification System (BNS) is an open, simple and highly customisable notification/alert system for live streams on Twitch and YouTube.

**Project is still in development!**
**[Roadmap]()**

### Notes

#### Notification type support
-   Follows
-   Subscriptions
-   Donations
-   Hosts

#### API support
-   [x] Twitch
-   [x] Streamlabs
-   [ ] TipeeeStream
-   [ ] Twitch Event Tracker *(my own project)*
-   [ ] YouTube

#### Current restrictions
-   Only **new** subscriptions will show up, no resubs! *(This will change with a future API implementation like TipeeeStream)*

### Requirements
-   HTML + CSS skills
-   Technical know-how
-   NodeJS
-   Server (optional)
-   Git (optional)

***

## Get started

### Install

1.  Download and install the current [NodeJS](https://nodejs.org) version
-   [Download]() and extract or clone the repo
-   Open the bash or command prompt and switch to BNS directory

4.
Install it with

`$ npm install --only=production`

5.
Configure the app via `config.js` in the root directory

6.
Start the app with

`$ npm start`


### Use

1.  Open the dashboard via `http//:localhost:8080` or what you have configured
-   Make your settings
-   Take the default template in the as example and build your own
-   Put `http//:localhost:8080/notification[/endpoint]` in your OBS browser source *(if authentication on, with token at the end)*

*I will create a better manual later*

***

## Story behind the project
...
