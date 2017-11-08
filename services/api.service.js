"use strict";

const ApiGateway = require("moleculer-web");

module.exports = {
	name: "api",
	mixins: [ApiGateway],

	// More info about settings: http://moleculer.services/docs/moleculer-web.html
	settings: {
		port: process.env.PORT || 3000,

		routes: [{
			path: "/api",

			whitelist: [
				// Access to any actions in all services
				"*"
			],

			aliases: {
				"REST users": "users"
			},

			cors: true,
			bodyParsers: {
				json: true,
				urlencoded: {
					extended: false
				}
			}
		}],

		assets: {
			folder: "./public"
		}

	}
};
