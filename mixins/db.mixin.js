"use strict";

const DbService 	= require("moleculer-db");

module.exports = function(type, collection) {
	if (type == "mongo") {
		// Mongo adapter
		const MongoAdapter 	= require("moleculer-db-adapter-mongo");

		return {
			mixins: [DbService],
			adapter: new MongoAdapter("mongodb://localhost/conduit"),
			collection
		};
	}
	
	// NeDB adapter
	return {
		mixins: [DbService],
		adapter: new DbService.MemoryAdapter({ filename: `./data/${collection}.db` })
	};
};