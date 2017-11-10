"use strict";

const { MoleculerClientError } = require("moleculer").Errors;

const _ = require("lodash");
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
					fields: ["_id", "username", "bio", "image"]
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

		create: {
			auth: "required",
			params: {
				article: { type: "string" },
				comment: { type: "object" }
			},
			handler(ctx) {
				let entity = ctx.params.comment;

				entity.article = ctx.params.article;
				entity.author = ctx.meta.user._id;
				entity.createdAt = new Date();
				entity.updatedAt = new Date();

				// TODO: check that author is same as ctx.meta.user

				return this.create(ctx, entity, { populate: ["author"]})
					.then(entity => this.transformResult(ctx, entity, ctx.meta.user));
			}
		},

		update: {
			auth: "required",
			params: {
				id: { type: "string" },
				comment: { type: "object" }
			},
			handler(ctx) {
				let newData = ctx.params.comment;
				newData.updatedAt = new Date();
				
				// TODO: check that author is same as ctx.meta.user
				
				return this.Promise.resolve(ctx.params.id)
					.then(id => {
						const update = {
							"$set": newData
						};

						return this.updateById(ctx, {
							id,
							update,
							populate: ["author"]
						});
					})
					.then(entity => this.transformResult(ctx, entity, ctx.meta.user));
			}
		},

		list: {
			params: {
				article: { type: "string" },
				limit: { type: "number", optional: true, convert: true },
				offset: { type: "number", optional: true, convert: true },
			},
			handler(ctx) {
				const limit = ctx.params.limit ? Number(ctx.params.limit) : 20;
				const offset = ctx.params.offset ? Number(ctx.params.offset) : 0;

				let params = {
					limit,
					offset,
					sort: ["-createdAt"],
					populate: ["author"],
					query: {
						article: ctx.params.article
					}
				};

				return this.Promise.resolve()
					.then(() => this.Promise.all([
						// Get rows
						this.find(ctx, params),

						// Get count of all rows
						this.count(ctx, params)

					])).then(res => this.transformResult(ctx, res[0], ctx.meta.user)
						.then(r => {
							r.commentsCount = res[1];
							return r;
						}));
			}
		},

		remove: {
			params: {
				id: { type: "any" }
			},
			handler(ctx) {
				// TODO: check that author is same as ctx.meta.user
				
				return this.removeById(ctx, { id: ctx.params.id });
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

		transformResult(ctx, entities, user) {
			if (Array.isArray(entities)) {
				return this.Promise.map(entities, item => this.transformEntity(ctx, item, user))
					.then(comments => ({ comments }));
			} else {
				return this.transformEntity(ctx, entities, user)
					.then(comment => ({ comment }));
			}
		},

		transformEntity(ctx, entity, loggedInUser) {
			if (!entity) return this.Promise.resolve();

			return this.Promise.resolve(entity)
				.then(entity => {
					entity.id = entity._id;

					if (loggedInUser) {
						return ctx.call("follows.has", { user: loggedInUser._id, follow: entity.author._id })
							.then(res => {
								entity.author.following = res;
								return entity;
							});
					}

					entity.author.following = false;					

					return entity;
				});

		}
	}
};