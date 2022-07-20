const path = require('path')
const fs = require("fs");
const {parse} = require('csv-parse');

const planets = require('./planets.mongo');

// filtering the  habitable Planets
function isHabitablePlanets(planet) {
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.11 &&
    planet["koi_prad"] < 1.6
  );
}

// extract habitable planet from kepler_data.csv
function loadPlanetsData() {
  return new Promise((resolve, reject) => {
  fs.createReadStream(path.join(__dirname, "..", "..", "data", "kepler_data.csv"))
  .pipe(
    parse({
      comment: "#",
      columns: true,
    })
  )
  .on("data", async(data) => {
    if (isHabitablePlanets(data)) {
      // saving data to mongodb cluster database
      await savePlanets(data)
      //await planets.create({kepler_name: data.kepler_name});
    }
  })
  .on("error", (err) => {
    console.log(err);
    reject(err);
  })
  .on("end", async() => {
    const foundPlanets = (await getAllPlanets()).length
    // console.log(habitablePlanets.map((planet) => planet["kepler_name"]));
    console.log(`${foundPlanets} habbitable planet found!`);
    resolve();
  });
  }) 
}

// get All the habitable planet name from mongodb cluster database
async function getAllPlanets() {
  return await planets.find({});
}

// save the habitable planet to mongodb cluster
async function savePlanets(planet) {
  try {
    await planets.updateOne(
      { kepler_name: planet.kepler_name },
      { kepler_name: planet.kepler_name },
      { upsert: true }
    );
  } catch (err) {
    console.error(`Unable to save planet data ${err}`)
  }
}
 
module.exports = { loadPlanetsData, getAllPlanets };