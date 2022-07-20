const mongoose = require("mongoose");

require("dotenv").config();

const MONGODB_URL = process.env.MONGO_URL;

mongoose.connection.once("open", () =>
  console.log("mongodb connection is ready!")
);

mongoose.connection.on("error", (err) => console.error(err.message));

async function mongoConnect() {
  await mongoose.connect(MONGODB_URL);
}

async function mongoDisconnect() {
  await mongoose.disconnect();
}

module.exports = { mongoConnect, mongoDisconnect };