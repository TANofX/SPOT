const express = require("express");
const fs = require("fs");
const path = require("path");

let router = express.Router();

router.use(express.static(__dirname + "/public"));

router.get("/build/qrcode.js", (req,res) => {
    // res.sendFile(path.resolve(__dirname, "../../node_modules/qrcode/build/qrcode.js"));
    res.sendFile(path.resolve(__dirname, "../../node_modules/qrcode/lib/core/qrcode.js"));
})

router.get("/", (req,res) => {
    res.render(__dirname + "/views/index.ejs", {
        pages: fs.readdirSync(__dirname + "/views/pages"), //include all of the pages in the pages folder
        landingPage: "landing" //the landing page of your app, the first thing a user sees when they open it
    });
})

var executablesOutput;
router.get("/executables.js", (req,res) => {
    if (executablesOutput) {
        res.send(executablesOutput) //there might be a better way to do this
    } else {
        let output = `/* autogenerated output of all executables in the /scouting/executables folder */\nvar executables = {}\n`;
        for (let executableFile of fs.readdirSync(__dirname + "/executables")) {
            output += `\n\n//${executableFile}\n`
            output += fs.readFileSync(__dirname + "/executables/" + executableFile).toString()
        }
        executablesOutput = output;
        res.send(output);
    }
})

router.use("/auth", require("./routes/auth.js"));

module.exports = router;