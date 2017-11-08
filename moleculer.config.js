"use strict";

const path = require("path");
const mkdir = require("mkdirp").sync;

// Create data folder
mkdir(path.resolve("data"));

module.exports = {
	logger: true,
	logLevel: "info"
};