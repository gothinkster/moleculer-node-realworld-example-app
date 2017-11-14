"use strict";

const os = require("os");
const path = require("path");
const mkdir = require("mkdirp").sync;

// Create data folder
mkdir(path.resolve("data"));

process.env.DB_TYPE = "mongo";

module.exports = {
	// Append hostname to nodeID. It will be unique when scale up instances in Docker
	nodeID: (process.env.NODEID ? process.env.NODEID + "-" : "") + os.hostname().toLowerCase() + "-" + process.pid,

	logger: true,
	logLevel: "info",

	//transporter: "nats://localhost:4222",

	cacher: "memory",

	metrics: true
};