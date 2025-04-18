const express = require("express");
let app = express();
const server = app.listen(process.env.PORT || 8080, () => {
  console.log(
    chalk.cyan(`Server listening on port ${process.env.PORT || 8080}`)
  );
});
const chalk = require("chalk");
const fs = require("fs");

const axios = require("axios");
axios.defaults.baseURL = `http://localhost:${process.env.PORT || 8080}`;

app.set("view engine", "ejs");
let bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//routes with config validation
if (fs.existsSync("config/config.json")) {
  require("./scouting/scouting-sync.js")(server);

  app.use("/config", require("./configRouter.js"));
  app.use("/", require("./scouting/scouting.js"));
  app.use("/analysis", require("./analysis/analysis.js"));
  app.use("/admin", require("./admin/admin.js"));
  app.use("/qrscanner", require("./qrscanner/qrscanner.js"));
  app.use("/edit", require("./edit/edit.js"));
  app.use("/setup", require("./setup/setup.js"));
  app.use("/schedule", require("./schedule/schedule").router);
  app.use("/editor", require("./editor/editor.js"));
} else {
  console.log(
    chalk.cyan.bold.underline(
      "config.json not detected! First time setup flow enabled on server."
    )
  );
  app.use("/", require("./setup/setup.js"));
}

function exampleMatches() {
  setTimeout(() =>
  fetch(`http://localhost:${process.env.PORT || 8080}/schedule/api/matches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(Array(10).fill(0).map((v, i) => ({
      number: i,
      match_string: `2023temp_q${i}`,
      robots: {
        red: [Math.floor(Math.random() * 10000).toString(), Math.floor(Math.random() * 10000).toString(), Math.floor(Math.random() * 10000).toString()],
        blue: [Math.floor(Math.random() * 10000).toString(), Math.floor(Math.random() * 10000).toString(), Math.floor(Math.random() * 10000).toString()],
      },
    }))),
  }).then(() => console.log("Successfully applied example schedule"))
    .catch(e => console.error("Failed to apply example schedule", e)), 5000);
}
// exampleMatches();
