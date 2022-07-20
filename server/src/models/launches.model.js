const launchesDatabase = require("./launches.mongo");
const planets = require("./planets.mongo");
const axios = require('axios')

let DEFAULT_FLIGHT_NUMBER = 100;
const SPACEX_API = "https://api.spacexdata.com/v4/launches/query";

async function populateLaunches() {
  

  console.log("Downloading launch data...");
  const response = await axios.post(SPACEX_API, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("Error downloading launch data");
    throw new Error('launch data download failed!');
  }

  const launchDocs = response.data.docs;

  for (const launchdoc of launchDocs) {
    const payloads = launchdoc["payloads"];
    const customers = payloads.flatMap((payload) => payload["customers"]);
    const launch = {
      flightNumber: launchdoc["flight_number"],
      mission: launchdoc["name"],
      rocket: launchdoc["rocket"]["name"],
      launchDate: launchdoc["date_local"],
      upcoming: launchdoc["upcoming"],
      success: launchdoc["success"],
      customers,
    };

    //console.log(`${launch.flightNumber}, ${launch.mission}`);
    await saveLaunch(launch);
  }
}

async function loadLaunchData() {
  
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    mission: "FalconSat",
    rocket: "Falcon 1",
  });

  if (firstLaunch) {
    console.log("data is already populated in database..");
  } else {
    await populateLaunches();
  }

}

//launches.set(launch.flightNumber, launch);

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}
// checking the launch data existsLaunchWithId
async function existsLaunchWithId(launchId) {
  return await findLaunch({ flightNumber: launchId });
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDatabase.findOne().sort("-flightNumber");
  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLaunch.flightNumber;
}

// get all the launches data from mongodb cluster
async function getAllLaunches(skip, limit) {
  return await launchesDatabase.find({}, { __V: 0 }).sort("flightNumber").skip(skip).limit(limit);
}

// save and update the launch data to mongodb cluster
async function saveLaunch(launch) {

  // save the launch data in the mongodb cluster
  try {
    await launchesDatabase.findOneAndUpdate(
      {
        flightNumber: launch.flightNumber,
      },
      launch,
      {
        upsert: true,
      }
    );
  } catch (err) {
    console.error(`Unable to save launches data: ${err}`);
  }
}

// add new launch mission to the mongodb cluster database
async function scheduleNewLaunch(launch) {
  // finding the existing planet in mongodb cluster list
  const planet = await planets.findOne({ kepler_name: launch.target });

  // validate the launch planet list
  if (!planet) {
    throw new Error("Planet not found in mongodb cluster");
  }
  const newLaunchNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    flightNumber: newLaunchNumber,
    customers: ["NTY", "NASA"],
    upcoming: true,
    success: true,
  });
  return await saveLaunch(newLaunch);
}

// function addNewLaunch(launch) {
//   latestFlightNumber++
//   launches.set(
//     latestFlightNumber,
//     Object.assign(launch, {
//       flightNumber: latestFlightNumber,
//       customers: ["NTY", "NASA"],
//       upcoming: true,
//       succeeded: true,
//     })
//   );
// }

// launch mission abort
async function abortLaunchById(launchId) {
  const aborted = await launchesDatabase.updateOne(
    { flightNumber: launchId },
    { upcoming: false, success: false }
  );
  // const aborted = launches.get(launchId);
  // aborted.upcoming = false;
  // aborted.success = false;
  return aborted.modifiedCount === 1;
}

module.exports = {
  loadLaunchData,
  getAllLaunches,
  scheduleNewLaunch,
  existsLaunchWithId,
  abortLaunchById,
};
