const pipelineConfig = require("../../../../config/analysis-pipeline.json");
const config = require("../../../../config/config.json");
const fs = require("fs");
const { TeamMatchPerformance } = require("../../../lib/db");
const { Dataset } = require("./DataTransformer");
const chalk = require("chalk");
const { setPath } = require("../../../lib/util");

//enable debug logs
const debug = false;

/* load transformers */
const transformers = {
  tmp: {},
  team: {},
};

for (let executableFile of fs.readdirSync("../../transformers")) {
  if (debug)
    console.log(
      `attempting to load transformer from ${
        "../../transformers/" + executableFile
      }`
    );
  let transformer = require("../../transformers/" + executableFile);

  if ("tmp" in transformer) {
    //the transformer supports teamMatchPerformances
    if (debug) console.log(`${transformer.tmp.name}.tmp - detected`);
    if (transformer.tmp.name in transformers.tmp)
      throw new Error(
        chalk.whiteBright.bgRed.bold(
          `${
            transformers.tmp.name
          }.tmp - transformer name duplicated! Transformer names must be unique.\nOther transformers loaded: [${Object.keys(
            transformers.tmp
          )}]`
        )
      );
    transformers.tmp[transformer.tmp.name] = transformer.tmp;
  }

  if ("team" in transformer) {
    //the transformer supports teams
    if (debug) console.log(`${transformer.team.name}.team - detected`);
    if (transformer.team.name in transformers.team)
      throw new Error(
        `${
          transformers.team.name
        } - transformer name duplicated! Transformer names must be unique.\nOther transformers loaded: [${Object.keys(
          transformers.tmp
        )}]`
      );
    transformers.team[transformer.team.name] = transformer.team;
  }
}
if (debug) console.log("loaded all transformers!");

/* load manual data */
const manual = {
  teams: require("./manual/teams.json"),
  tmps: require("./manual/tmps.json"),
};
if (debug) console.log("loaded all manual data!");

async function execute(dataset) {
  /* get tmps from database */
  dataset = new Dataset(
    (await TeamMatchPerformance.find({ eventNumber: config.EVENT_NUMBER })).map(
      (o) => o.toObject()
    )
  );

  for (let tfConfig of pipelineConfig) {
    if (debug)
      console.log(
        `running ${tfConfig.name} - ${JSON.stringify(tfConfig.options)}`
      );
    dataset = transformers[tfConfig.type][tfConfig.name].execute(
      dataset,
      tfConfig.outputPath,
      tfConfig.options
    );
  }

  dataset.tmps = dataset.tmps.concat(
    manual.tmps.map((tmp) => ({
      ...tmp,
      manual: true,
    }))
  );
  for (const [path, teamData] of Object.entries(manual.teams)) {
    for (const [team, value] of Object.entries(teamData)) {
      if (team in dataset.teams) {
        setPath(dataset.teams[team], "manual." + path, value);
      } else {
        dataset.teams[team] = {};
        setPath(dataset.teams[team], "manual." + path, value);
      }
    }
  }

  if (debug) console.log("complete!");

  return dataset;
}
async function executePipeline() {
  // Get tmps from database (or cache if offline)
  let tmps = await fetch("./api/dataset").then((res) => res.json());

  // Get all tmps stored in the local storage (from qr code)
  const storage = localStorage.getItem("teamMatchPerformances");
  if (storage) {
    // Parse the QR code TMPs (for some reason the array is stored as a string, and each TMP is ALSO
    // stored as a string, so the array has to be parsed and each individual TMP has to be parsed)
    const qrcodeTmps = JSON.parse(storage).map((tmp) => JSON.parse(tmp));

    // Merge the TMPs into one
    tmps = [...tmps, ...qrcodeTmps];
  }

  // Find all the teams across the TMPs
  const teams = [];
  for (const tmp of tmps) {
    teams[tmp.robotNumber] = {};
  }

  let dataset = { tmps, teams };

  const manual = await fetch("./api/manual").then((res) => res.json());
  const pipelineConfig = await fetch(
    "../../../config/analysis-pipeline.json"
  ).then((res) => res.json());

  // This will show up as a method that doesn't exist since it is gotten from the server
  const transformers = await getTransformers();

  for (let tfConfig of pipelineConfig) {
    dataset = transformers[tfConfig.type][tfConfig.name].execute(
      dataset,
      tfConfig.outputPath,
      tfConfig.options
    );
  }

  dataset.tmps = dataset.tmps.concat(
    manual.tmps.map((tmp) => ({
      ...tmp,
      manual: true,
    }))
  );
  for (const [path, teamData] of Object.entries(manual.teams)) {
    for (const [team, value] of Object.entries(teamData)) {
      if (team in dataset.teams) {
        setPath(dataset.teams[team], "manual." + path, value);
      } else {
        dataset.teams[team] = {};
        setPath(dataset.teams[team], "manual." + path, value);
      }
    }
  }

  return dataset;
}

module.exports = executePipeline;

// (async () => console.log((await execute()).teams["3061"] ) )();
