"use strict";

const { MoleculerClientError } = require("moleculer").Errors;

const _ = require("lodash");
const slug = require("slug");
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
		},
		entityValidator: {
			title: { type: "string" },
			description: { type: "string", optional: true },
			body: { type: "string", optional: true },
			tagList: { type: "array", items: "string" },
		}
	},

	/**
	 * Actions
	 */
	actions: {
		create: {
			auth: "required",
			params: {
				article: { type: "object" }
			},
			handler(ctx) {
				let entity = ctx.params.article;

				entity.slug = slug(entity.title.toLowerCase()) + "-" + (Math.random() * Math.pow(36, 6) | 0).toString(36);
				entity.author = ctx.meta.user._id;
				entity.createdAt = new Date();
				entity.updatedAt = new Date();

				return this.create(ctx, entity, { populate: ["author"]})
					.then(entity => this.transformResult(ctx, entity, ctx.meta.user));
			}
		},

		update: {
			auth: "required",
			params: {
				id: { type: "string" },
				article: { type: "object" }
			},
			handler(ctx) {
				let newData = ctx.params.article;
				newData.updatedAt = new Date();
				// the 'id' is the slug
				return this.Promise.resolve(ctx.params.id)
					.then(slug => this.findOne({ slug }))
					.then(article => {
						if (!article)
							return this.Promise.reject(new MoleculerClientError("Article not found"));

						const update = {
							"$set": newData
						};

						return this.updateById(ctx, {
							id: article._id,
							update
						});
					})
					.then(entity => this.transformResult(ctx, entity, ctx.meta.user));
			}
		},

		list: {
			params: {
				tag: { type: "string", optional: true },
				author: { type: "string", optional: true },
				favorited: { type: "string", optional: true },
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
					query: {}
				};

				if (ctx.params.tag)
					params.query.tagList = {"$in" : [ctx.params.tag]};

				return this.Promise.resolve()
					.then(() => {
						if (ctx.params.author) {
							return ctx.call("users.find", { query: { username: ctx.params.author } })
								.then(users => {
									if (users.length == 0)
										return this.Promise.reject(new MoleculerClientError("Author not found"));

									params.query.author = users[0]._id;
								});
						}
						if (ctx.params.favorited) {
							return ctx.call("users.find", { query: { username: ctx.params.favorited } })
								.then(users => {
									if (users.length == 0)
										return this.Promise.reject(new MoleculerClientError("Author not found"));

									return users[0]._id;
								})
								.then(user => {
									return ctx.call("favorites.find", { fields: ["article"], query: { user }})
										.then(list => {
											params.query._id = { $in: list.map(o => o.article) };
										});
								});
						}
					})
					.then(() => this.Promise.all([
						// Get rows
						this.find(ctx, params),

						// Get count of all rows
						this.count(ctx, params)

					])).then(res => this.transformResult(ctx, res[0], ctx.meta.user)
						.then(r => {
							r.articlesCount = res[1];
							return r;
						}));
			}
		},

		feed: {
			auth: "required",
			params: {
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
					query: {}
				};

				return this.Promise.resolve()
					.then(() => {
						return ctx.call("follows.find", { fields: ["follow"], query: { user: ctx.meta.user._id } })
							.then(list => {
								const authors = _.uniq(_.compact(_.flattenDeep(list.map(o => o.follow))));
								params.query.author = {"$in" : authors};
							});						
					})
					.then(() => this.Promise.all([
						// Get rows
						this.find(ctx, params),

						// Get count of all rows
						this.count(ctx, params)

					])).then(res => this.transformResult(ctx, res[0], ctx.meta.user)
						.then(r => {
							r.articlesCount = res[1];
							return r;
						}));
			}
		},

		get: {
			params: {
				id: { type: "string" }
			},
			handler(ctx) {
				return this.findOne({slug: ctx.params.id})
					.then(entity => this.transformResult(ctx, entity, ctx.meta.user));
			}
		},	

		remove: {
			params: {
				id: { type: "any" }
			},
			handler(ctx) {
				return this.findOne({slug: ctx.params.id})
					.then(entity => {
						return this.removeById(ctx, { id: entity._id })
							.then(() => ctx.call("favorites.removeByArticle", { article: entity._id }));
					});
			}
		},

		favorite: {
			auth: "required",
			params: {
				slug: { type: "string" }
			},
			handler(ctx) {
				return this.Promise.resolve(ctx.params.slug)
					.then(slug => this.findOne({ slug }))
					.then(article => {
						if (!article)
							return this.Promise.reject(new MoleculerClientError("Article not found"));
							
						return ctx.call("favorites.add", { article: article._id, user: ctx.meta.user._id }).then(() => article);
					})
					.then(entity => this.transformResult(ctx, entity, ctx.meta.user));
			}
		},

		unfavorite: {
			auth: "required",
			params: {
				slug: { type: "string" }
			},
			handler(ctx) {
				return this.Promise.resolve(ctx.params.slug)
					.then(slug => this.findOne({ slug }))
					.then(article => {
						if (!article)
							return this.Promise.reject(new MoleculerClientError("Article not found"));

						return ctx.call("favorites.delete", { article: article._id, user: ctx.meta.user._id }).then(() => article);
					})
					.then(entity => this.transformResult(ctx, entity, ctx.meta.user));
			}
		},

		tags: {
			handler(ctx) {
				return this.Promise.resolve()
					.then(() => ctx.call("articles.find", { fields: ["tagList"]}))
					.then(list => {
						return _.uniq(_.compact(_.flattenDeep(list.map(o => o.tagList))));
					})
					.then(tags => ({ tags }));
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
					.then(articles => ({ articles }));
			} else {
				return this.transformEntity(ctx, entities, user)
					.then(article => ({ article }));
			}
		},

		transformEntity(ctx, entity, user) {
			if (!entity) return this.Promise.resolve();

			return this.Promise.resolve(entity)
				.then(entity => {
					if (user) {
						return ctx.call("favorites.has", { article: entity._id, user: user._id })
							.then(favorited => {
								entity.favorited = favorited;
								return entity;
							});
					} else 
						entity.favorited = false;

					return entity;
				})
				.then(entity => {
					return ctx.call("favorites.count", { article: entity._id })
						.then(favoritesCount => {
							entity.favoritesCount = favoritesCount;
							return entity;
						});
				});

		}
	}
};