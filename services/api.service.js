"use strict";

const _ = require("lodash");
const ApiGateway = require("moleculer-web");
const { ForbiddenError, UnAuthorizedError } = ApiGateway.Errors;

module.exports = {
	name: "api",
	mixins: [ApiGateway],

	// More info about settings: http://moleculer.services/docs/moleculer-web.html
	settings: {
		port: process.env.PORT || 3000,

		routes: [{
			path: "/api",

			authorization: true,

			aliases: {
				// Login
				"POST users/login": "users.login",

				// Users
				"REST users": "users",

				// Current user
				"GET /user": "users.me",
				"PUT /user": "users.updateMyself",

				// Articles
				"REST articles": "articles",
				"GET tags": "articles.tags",

				// Favorites
				"POST articles/:slug/favorite": "articles.favorite",
				"DELETE articles/:slug/favorite": "articles.unfavorite",

				// Profile
				"GET profiles/:username": "users.profile",
				"POST profiles/:username/follow": "users.follow",
				"DELETE profiles/:username/follow": "users.unfollow",
			},

			mappingPolicy: "restrict",

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

	},

	methods: {
		/**
		 * Authorize the request
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
		authorize(ctx, route, req) {
			let token;
			if (req.headers.authorization) {
				let type = req.headers.authorization.split(" ")[0];
				if (type === "Token" || type === "Bearer")
					token = req.headers.authorization.split(" ")[1];
			}

			return this.Promise.resolve(token)
				.then(token => {
					if (token) {
						// Verify JWT token
						return ctx.call("users.resolveToken", { token })
							.then(user => {
								if (user) {
									this.logger.info("Authenticated via JWT: ", user.username);
									// Reduce user fields (it would be transferred to other nodes)
									ctx.meta.user = _.pick(user, ["_id", "username", "email", "image"]);
								}
								return user;
							});
					}
				})
				.then(user => {
					if (req.$endpoint.action.auth == "required" && !user)
						return this.Promise.reject(new UnAuthorizedError());
				});
		},
	}
};
