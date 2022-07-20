const express = require("express");

const planetRouter = require("./planets/planet.route");
const launchesRouter = require("./launches/launches.router");

const api = express();

api.use("/planets", planetRouter);
api.use("/launches", launchesRouter);

module.exports = api;