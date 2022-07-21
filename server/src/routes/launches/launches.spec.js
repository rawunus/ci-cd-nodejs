const request = require("supertest");
const app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");
const { loadPlanetsData } = require("../../models/planet.model");

describe("Launches apis", () => {
  beforeAll(async () => {
    await mongoConnect();
    await loadPlanetsData();
  });

  afterAll(async () => {
    await mongoDisconnect();
  });

  describe("get all launches", () => {
    test("should response with 200 status code", async () => {
      const response = await request(app)
        .get("/v1/launches")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });

  describe("Post new launch", () => {
    const completeLaunchData = {
      mission: "test mission",
      rocket: "test mission",
      target: "test mission planet",
      launchDate: "January 23, 2030",
    };
    const launchDataWithoutDate = {
      mission: "test mission",
      rocket: "test mission",
      target: "test mission planet",
    };
    const launchDataWithInvalidDate = {
      mission: "test mission",
      rocket: "test mission",
      target: "test mission planet",
      launchDate: "zoot",
    };

    test("should response with 201 status code created launch", async () => {
      const res = await request(app)
        .post("/v1/launches")
        .send(completeLaunchData)
        .expect("Content-Type", /json/)
        .expect(201);

      const requestDate = new Date(completeLaunchData.launchDate).valueOf();
      const responseDate = new Date(res.body.launchDate).valueOf();

      expect(responseDate).toBe(requestDate);
      expect(res.body).toMatchObject(launchDataWithoutDate);
    });

    test("should catch missing required properties", async () => {
      const res = await request(app)
        .post("/v1/launches")
        .send(launchDataWithoutDate)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(res.body).toStrictEqual({
        error: "Missing Required Launch property",
      });
    });

    test("should catch invalidate the date of launch", async () => {
      const res = await request(app)
        .post("/v1/launches")
        .send(launchDataWithInvalidDate)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(res.body).toStrictEqual({ error: "Invalid launch date" });
    });
  });
});
