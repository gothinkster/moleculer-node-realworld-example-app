"use strict";

const { MoleculerClientError } = require("moleculer").Errors;
const DbService = require("moleculer-db");

module.exports = {
	name: "favorites",
	mixins: [DbService],
	adapter: new DbService.MemoryAdapter({ filename: "./data/favorites.db" }),

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
				article: { type: "string" },
				user: { type: "string" },
			},
			handler(ctx) {
				const { article, user } = ctx.params;
				return this.findOne({ article, user })
					.then(item => {
						if (item)
							return this.Promise.reject(new MoleculerClientError("Articles has already favorited"));

						return this.create(ctx, { article, user }, {});
					});
			}
		},

		has: {
			params: {
				article: { type: "string" },
				user: { type: "string" },
			},
			handler(ctx) {
				const { article, user } = ctx.params;
				return this.findOne({ article, user })
					.then(item => !!item);
			}
		},

		count: {
			params: {
				article: { type: "string", optional: true },
				user: { type: "string", optional: true },
			},
			handler(ctx) {
				let query = {};
				if (ctx.params.article) 
					query = { article: ctx.params.article };
				
				if (ctx.params.user) 
					query = { user: ctx.params.user };

				return this.count(ctx, { query });
			}
		},

		delete: {
			params: {
				article: { type: "string" },
				user: { type: "string" },
			},
			handler(ctx) {
				const { article, user } = ctx.params;
				return this.findOne({ article, user })
					.then(item => {
						if (!item)
							return this.Promise.reject(new MoleculerClientError("Articles has not favorited yet"));

						return this.removeById(ctx, { id: item._id }, {});
					});
			}
		},

		removeByArticle: {
			params: {
				article: { type: "string" }
			},
			handler(ctx) {
				return this.removeMany(ctx, { query: ctx.params });
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