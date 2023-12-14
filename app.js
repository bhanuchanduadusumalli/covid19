const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const intializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`${e.message}`);
    process.exit(1);
  }
};
intializeDBandServer();

const convertStateDBObjToStateResponseDbObj = (stateObj) => {
  return {
    stateId: stateObj.state_id,
    stateName: stateObj.state_name,
    population: stateObj.population,
  };
};

const converconvertdistDBObjTodistResponseDbObj = (dObj) => {
  return {
    districtId: dObj.district_id,
    districtName: dObj.district_name,
    stateId: dObj.state_id,
    cases: dObj.cases,
    cured: dObj.cured,
    active: dObj.active,
    deaths: dObj.deaths,
  };
};

const convertstateNameDbObjToStatenameResponseObj = (name) => {
  return {
    stateName: name.state_name,
  };
};

//Get Request
app.get("/states/", async (request, response) => {
  const allStates = `select * from state`;
  const states = await db.all(allStates);
  response.send(
    states.map((eachState) => convertStateDBObjToStateResponseDbObj(eachState))
  );
});

//get request
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const state = `select * from state where state_id=${stateId}`;
  const singleState = await db.all(state);
  console.log(singleState[0]);
  response.send(convertStateDBObjToStateResponseDbObj(singleState[0]));
});

//Post request
app.post("/districts/", async (request, response) => {
  const dist = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = dist;
  const postDistrict = `insert into district(district_name,state_id,cases,cured,active,deaths)
    values('${districtName}',${stateId},${cases},${cured},${active},${deaths})`;
  await db.run(postDistrict);
  response.send("District Successfully Added");
});

//get request
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const district = `select * from district where district_id=${districtId}`;
  const singledistrict = await db.all(district);
  console.log(singledistrict);
  response.send(converconvertdistDBObjTodistResponseDbObj(singledistrict[0]));
});

//delete request
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const district = `delete from district where district_id=${districtId}`;
  await db.run(district);
  response.send("District Removed");
});

//Put request
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const dist = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = dist;
  const updateDist = `update district set 
     district_name='${districtName}',
     state_id=${stateId},
     cases=${cases},
     cured=${cured},
     active=${active},
     deaths=${deaths}`;
  await db.run(updateDist);
  response.send("District Details Updated");
});

//Get request
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stat = `select sum(cases) as totalCases,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths 
    from state join district 
    on state.state_id=district.state_id 
    where district.state_id=${stateId}
    group by state.state_id`;
  const covidStats = await db.all(stat);
  response.send(covidStats[0]);
});

//Get request
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateQuery = `select state_name from state join district
    on state.state_id=district.state_id 
    where district_id=${districtId}`;
  const sName = await db.get(stateQuery);
  console.log(sName);
  response.send(
    convertstateNameDbObjToStatenameResponseObj(sName)
    // sName.map((name) => convertstateNameDbObjToStatenameResponseObj(name))
  );
});

module.exports = app;
