"use strict";

const DbService = require("moleculer-db");

module.exports = {
	name: "articles",
	mixins: [DbService],
	adapter: new DbService.MemoryAdapter({ filename: "./data/articles.db" }),

	/**
	 * Default settings
	 */
	settings: {
		fields: ["_id", "title", "slug", "description", "body", "tagList", "createdAt", "updatedAt", "favoritesCount", "author", "comments"],
		populates: {
			"author": {
				action: "users.get",
				params: {
					fields: ["username", "bio", "image"]
				}
			},
			"comments": {
				action: "comments.get",
				params: {
					fields: ["_id", "body", "author"],
					populates: ["author"]
				}
			}
		}
	},

	/**
	 * Actions
	 */
	actions: {
		list: {
			params: {

			},
			handler(ctx) {

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
		}
	}
};