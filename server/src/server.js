const http = require('http');
const helmet = require("helmet");

const app = require('./app');
const {mongoConnect} = require('./services/mongo');
const { loadPlanetsData } = require("./models/planet.model");
const {loadLaunchData} = require("./models/launches.model");

app.use(helmet());

require("dotenv").config();
const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

async function startServer() {

  await mongoConnect();

  await loadPlanetsData();
  await loadLaunchData();
  server.listen(PORT, () => {
    console.log(`listening on port ${PORT} ...`);
  });
}

startServer();


// user: nasa_api
// password: HXM3AaxRO6hPWk0K