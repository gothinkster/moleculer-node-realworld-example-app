"use strict";

const { MoleculerClientError } = require("moleculer").Errors;

const DbService 	= require("moleculer-db");
const bcrypt 		= require("bcrypt");
const jwt 			= require("jsonwebtoken");

module.exports = {
	name: "users",
	mixins: [DbService],
	adapter: new DbService.MemoryAdapter({ filename: "./data/users.db" }),

	/**
	 * Default settings
	 */
	settings: {
		/** Secret for JWT */
		JWT_SECRET: process.env.JWT_SECRET || "jwt-conduit-secret",

		/** Public fields */
		fields: ["_id", "username", "email", "bio", "image"],

		/** Validator schema for entity */
		entityValidator: {
			username: { type: "string", min: 2, pattern: /^[a-zA-Z0-9]+$/ },
			password: { type: "string", min: 6 },
			email: { type: "email" },
			bio: { type: "string", optional: true },
			image: { type: "string", optional: true },
		}
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Register a new user
		 */
		create: {
			params: {
				user: { type: "object" }
			},			
			handler(ctx) {
				let entity = ctx.params.user;
				return this.validateEntity(entity)
					.then(() => {
						entity.password = bcrypt.hashSync(entity.password, 10);
						entity.bio = entity.bio || "";
						entity.image = entity.image || null;
						entity.createdAt = new Date();

						return this.adapter.insert(entity)
							.then(doc => this.transformDocuments(ctx, {}, doc))
							.then(user => this.transformEntity(user, true, ctx.meta.token))
							.then(json => this.entityChanged("created", json, ctx).then(() => json));					
					});
			}
		},

		/**
		 * Login with username & password
		 */
		login: {
			params: {
				user: { type: "object", props: {
					email: { type: "email" },
					password: { type: "string", min: 1 }
				}}
			},
			handler(ctx) {
				const { email, password } = ctx.params.user;

				return this.Promise.resolve()
					.then(() => this.findOne({ email }))
					.then(user => {
						if (!user)
							return this.Promise.reject(new MoleculerClientError("Email or password is invalid!", 422, "", [{ field: "email", message: "is not found"}]));

						return bcrypt.compare(password, user.password).then(res => {
							if (!res)
								return Promise.reject(new MoleculerClientError("Wrong password!", 422, "", [{ field: "email", message: "is not found"}]));
							
							// Transform user entity (remove password and all protected fields)
							return this.transformDocuments(ctx, {}, user);
						});
					})
					.then(user => this.transformEntity(user, true, ctx.meta.token));
			}
		},

		/**
		 * Get user by JWT token (for API GW authentication)
		 */
		resolveToken: {
			params: {
				token: "string"
			},
			handler(ctx) {
				return new this.Promise((resolve, reject) => {
					jwt.verify(ctx.params.token, this.settings.JWT_SECRET, (err, decoded) => {
						if (err)
							return reject(err);

						resolve(decoded);
					});

				})
					.then(decoded => {
						if (decoded.id)
							return this.getById(decoded.id);
					});
			}
		},

		/**
		 * Get current user entity
		 */
		me: {
			auth: "required",
			handler(ctx) {
				return this.getById(ctx.meta.user._id)
					.then(user => {
						if (!user)
							return this.Promise.reject(new MoleculerClientError("User not found!", 400));

						return this.transformDocuments(ctx, {}, user);
					})
					.then(user => this.transformEntity(user, true, ctx.meta.token));
			}
		},

		/**
		 * Update current user entity
		 */
		updateMyself: {
			auth: "required",
			params: {
				user: { type: "object", props: {
					username: { type: "string", min: 2, optional: true, pattern: /^[a-zA-Z0-9]+$/ },
					password: { type: "string", min: 6, optional: true },
					email: { type: "email", optional: true },
					bio: { type: "string", optional: true },
					image: { type: "string", optional: true },
				}}
			},
			handler(ctx) {
				const newData = ctx.params.user;
				return this.Promise.resolve()
					.then(() => {
						if (newData.username)
							return this.findOne({ username: newData.username })
								.then(found => {
									if (found && found._id !== ctx.meta.user._id)
										return Promise.reject(new MoleculerClientError("Usernam is exist!", 422, "", [{ field: "username", message: "is exist"}]));
									
								});
					})
					.then(() => {
						if (newData.email)
							return this.findOne({ email: newData.email })
								.then(found => {
									if (found && found._id !== ctx.meta.user._id)
										return Promise.reject(new MoleculerClientError("Email is exist!", 422, "", [{ field: "email", message: "is exist"}]));
								});
							
					})
					.then(() => {
						newData.updatedAt = new Date();
						const update = {
							"$set": newData
						};
						return this.adapter.updateById(ctx.meta.user._id, update);
					})
					.then(doc => this.transformDocuments(ctx, {}, doc))
					.then(user => this.transformEntity(user, true, ctx.meta.token))
					.then(json => this.entityChanged("updated", json, ctx).then(() => json));

			}
		},

		/**
		 * Get current user entity
		 */
		profile: {
			params: {
				username: { type: "string" }
			},
			handler(ctx) {
				return this.findOne({ username: ctx.params.username })
					.then(user => {
						if (!user)
							return this.Promise.reject(new MoleculerClientError("User not found!", 404));

						return this.transformDocuments(ctx, {}, user);
					})
					.then(user => this.transformProfile(ctx, user, ctx.meta.user));
			}
		},

		follow: {
			auth: "required",
			params: {
				username: { type: "string" }
			},
			handler(ctx) {
				return this.findOne({ username: ctx.params.username })
					.then(user => {
						if (!user)
							return this.Promise.reject(new MoleculerClientError("User not found!", 404));

						return ctx.call("follows.add", { user: ctx.meta.user._id, follow: user._id })
							.then(() => this.transformDocuments(ctx, {}, user));
					})
					.then(user => this.transformProfile(ctx, user, ctx.meta.user));
			}
		},	

		unfollow: {
			auth: "required",
			params: {
				username: { type: "string" }
			},
			handler(ctx) {
				return this.findOne({ username: ctx.params.username })
					.then(user => {
						if (!user)
							return this.Promise.reject(new MoleculerClientError("User not found!", 404));

						return ctx.call("follows.delete", { user: ctx.meta.user._id, follow: user._id })
							.then(() => this.transformDocuments(ctx, {}, user));
					})
					.then(user => this.transformProfile(ctx, user, ctx.meta.user));
			}
		}		
	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Generate a JWT token from user entity
		 * 
		 * @param {Object} user 
		 */
		generateJWT(user) {
			const today = new Date();
			const exp = new Date(today);
			exp.setDate(today.getDate() + 60);

			return jwt.sign({
				id: user._id,
				username: user.username,
				exp: Math.floor(exp.getTime() / 1000)
			}, this.settings.JWT_SECRET);
		},

		/**
		 * Find the first result item
		 * 
		 * @param {*} query 
		 */
		findOne(query) {
			return this.adapter.find({ query })
				.then(res => {
					if (res && res.length > 0)
						return res[0];
				});
		},

		/**
		 * Transform returned user entity. Generate JWT token if neccessary.
		 * 
		 * @param {Object} user 
		 * @param {Boolean} withToken 
		 */
		transformEntity(user, withToken, token) {
			if (user) {
				user.image = user.image || "";
				if (withToken)
					user.token = token || this.generateJWT(user);
			}

			return { user };
		},

		/**
		 * Transform returned user entity as profile.
		 * 
		 * @param {Context} ctx
		 * @param {Object} user 
		 * @param {Object?} loggedInUser 
		 */
		transformProfile(ctx, user, loggedInUser) {
			user.image = user.image || "https://static.productionready.io/images/smiley-cyrus.jpg";

			if (loggedInUser) {
				return ctx.call("follows.has", { user: loggedInUser._id, follow: user._id })
					.then(res => {
						user.following = res;
						return { profile: user };
					});
			}

			user.following = false;

			return { profile: user };
		}
	}
};