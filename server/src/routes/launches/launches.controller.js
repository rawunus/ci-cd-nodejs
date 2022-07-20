const {
  getAllLaunches,
  scheduleNewLaunch,
  existsLaunchWithId,
  abortLaunchById,
} = require("../../models/launches.model");
const { getPagination } = require("../../services/query");

// get all launches data from mongodb collection
async function httpGetAllLaunches(req, res) {
  const { skip, limit } = getPagination(req.query);
  const allLaunches = await getAllLaunches(skip, limit);
  return res.status(200).json(allLaunches);
}

// validate launch data and add it to the mongodb collection
function httpAddNewLaunch(req, res) {
  const launch = req.body;

  if (!launch.mission || !launch.launchDate || !launch.rocket || !launch.target) {
    return res.status(400).json({error: 'Missing Required Launch property'})
  }

  launch.launchDate = new Date(launch.launchDate);
  if (isNaN(launch.launchDate)) {
    return res.status(400).json({
      error: "Invalid launch date",
    });
  }

  scheduleNewLaunch(launch);
  return res.status(201).json(launch)
}

async function httpAbortLaunch(req, res) {
  const launchId = +req.params.id

  // if the launch does not exist
  const existLaunch = await existsLaunchWithId(launchId)
  if (!existLaunch) {
    return res.status(404).json({
      error: "Launch not found",
    });
  }
    
  // if the launch exists
  const aborted = await abortLaunchById(launchId);
  if (!aborted) {
    return res.status(404).json({error: "Launch not aborted"})
  }
  return res.status(200).json({Ok: true});
}

module.exports = { httpGetAllLaunches, httpAddNewLaunch, httpAbortLaunch };