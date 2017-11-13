"use strict";

const { MoleculerClientError } = require("moleculer").Errors;
const DbService = require("moleculer-db");

module.exports = {
	name: "follows",
	mixins: [DbService],
	adapter: new DbService.MemoryAdapter({ filename: "./data/follows.db" }),

	/**
	 * Default settings
	 */
	settings: {

	},

	/**
	 * Actions
	 */
	actions: {

		/**
		 * Create a new following record
		 * 
		 * @actions
		 * 
		 * @param {String} user - Follower username
		 * @param {String} follow - Followee username
		 * @returns {Object} Created following record
		 */
		add: {
			params: {
				user: { type: "string" },
				follow: { type: "string" },
			},
			handler(ctx) {
				const { follow, user } = ctx.params;
				return this.findByFollowAndUser(follow, user)
					.then(item => {
						if (item)
							return this.Promise.reject(new MoleculerClientError("User has already followed"));

						return this.adapter.insert({ follow, user, createdAt: new Date() });
					});
			}
		},

		/**
		 * Check the given 'follow' user is followed by 'user' user.
		 * 
		 * @actions
		 * 
		 * @param {String} user - Follower username
		 * @param {String} follow - Followee username
		 * @returns {Boolean} 
		 */
		has: {
			params: {
				user: { type: "string" },
				follow: { type: "string" },
			},
			handler(ctx) {
				return this.findByFollowAndUser(ctx.params.follow, ctx.params.user)
					.then(item => !!item);
			}
		},

		/**
		 * Count of following.
		 * 
		 * @actions
		 * 
		 * @param {String?} user - Follower username
		 * @param {String?} follow - Followee username
		 * @returns {Number}
		 */
		count: {
			params: {
				follow: { type: "string", optional: true },
				user: { type: "string", optional: true },
			},
			handler(ctx) {
				let query = {};
				if (ctx.params.follow) 
					query = { follow: ctx.params.follow };
				
				if (ctx.params.user) 
					query = { user: ctx.params.user };

				return this.adapter.count({ query });
			}
		},

		/**
		 * Delete a following record
		 * 
		 * @actions
		 * 
		 * @param {String} user - Follower username
		 * @param {String} follow - Followee username
		 * @returns {Number} Count of removed records
		 */
		delete: {
			params: {
				user: { type: "string" },
				follow: { type: "string" },
			},
			handler(ctx) {
				const { follow, user } = ctx.params;
				return this.findByFollowAndUser(follow, user)
					.then(item => {
						if (!item)
							return this.Promise.reject(new MoleculerClientError("User has not followed yet"));

						return this.adapter.removeById(item._id);
					});
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Find the first following record by 'follow' or 'user' 
		 * @param {String} follow - Followee username
		 * @param {String} user - Follower username
		 */
		findByFollowAndUser(follow, user) {
			return this.adapter.findOne({ follow, user });
		},
	}	
};