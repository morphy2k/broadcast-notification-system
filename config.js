"use strict";

// # main configuration

module.exports = {
	server: {
		url: 'http://localhost:8083', // if you use a special port like 'http://example.com:8080', please add it!
		port: '8083',
		type: 0, // '0' = normal, '1' = proxy
		host: 'localhost' // only for 'proxy' type
	}
};
