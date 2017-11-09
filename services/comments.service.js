"use strict";

const DbService = require("moleculer-db");

module.exports = {
	name: "comments",
	mixins: [DbService],
	adapter: new DbService.MemoryAdapter({ filename: "./data/comments.db" }),

	/**
	 * Default settings
	 */
	settings: {
		fields: ["_id", "author", "article", "body", "createdAt", "updatedAt"],
		populates: {
			"author": {
				action: "users.get",
				params: {
					fields: ["username", "bio", "image"]
				}
			}
		},
		entityValidator: {
			author: { type: "string" },
			article: { type: "string" },
			body: { type: "string" },
		}
	},

	/**
	 * Actions
	 */
	actions: {

	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {

	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {

	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {

	}	
};