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
				return this.findByArticleAndUser(article, user)
					.then(item => {
						if (item)
							return this.Promise.reject(new MoleculerClientError("Articles has already favorited"));

						return this.adapter.insert({ article, user, createdAt: new Date() });
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
				return this.findByArticleAndUser(article, user)
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

				return this.adapter.count({ query });
			}
		},

		delete: {
			params: {
				article: { type: "string" },
				user: { type: "string" },
			},
			handler(ctx) {
				const { article, user } = ctx.params;
				return this.findByArticleAndUser(article, user)
					.then(item => {
						if (!item)
							return this.Promise.reject(new MoleculerClientError("Articles has not favorited yet"));

						return this.adapter.removeById(item._id);
					});
			}
		},

		removeByArticle: {
			params: {
				article: { type: "string" }
			},
			handler(ctx) {
				return this.adapter.removeMany(ctx.params);
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {
		findByArticleAndUser(article, user) {
			return this.findOne({ query: { article, user } });
		},
	}
};