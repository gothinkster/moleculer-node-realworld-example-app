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
		add: {
			params: {
				user: { type: "string" },
				follow: { type: "string" },
			},
			handler(ctx) {
				const { follow, user } = ctx.params;
				return this.findOne({ follow, user })
					.then(item => {
						if (item)
							return this.Promise.reject(new MoleculerClientError("User has already followed"));

						return this.create(ctx, { follow, user, createdAt: new Date() }, {});
					});
			}
		},

		has: {
			params: {
				user: { type: "string" },
				follow: { type: "string" },
			},
			handler(ctx) {
				const { follow, user } = ctx.params;
				return this.findOne({ follow, user })
					.then(item => !!item);
			}
		},

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

				return this.count(ctx, { query });
			}
		},

		delete: {
			params: {
				user: { type: "string" },
				follow: { type: "string" },
			},
			handler(ctx) {
				const { follow, user } = ctx.params;
				return this.findOne({ follow, user })
					.then(item => {
						if (!item)
							return this.Promise.reject(new MoleculerClientError("User has not followed yet"));

						return this.removeById(ctx, { id: item._id }, {});
					});
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {
		findOne(query) {
			return this.adapter.find({ query })
				.then(res => {
					if (res && res.length > 0)
						return res[0];
				});
		},
	}	
};