const express = require("express");
const fs = require("fs");
const { PythonShell } = require("python-shell");

function getFilePath() {
  let path = process.argv[2];

  // Default to json data format
  if (path != undefined) {
    if (!path.includes(".")) {
      path = path + ".json";
    }
    if (!path.includes("data/")) {
      path = "./data/" + path;
    }
  }
  return path;
}

function fileExists(file) {
  return fs.promises
    .access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

function convertToJSON(path) {
  if (path == undefined) {
    return;
  }
  let extension = path.split(".").slice(-1)[0];
  if (extension == "json") {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) {
        console.log(`Error reading file from disk: ${err}`);
      } else {
        fs.writeFile("data/temp/temp.json", data, "utf8", (err) => {
          if (err) {
            console.log(`Error writing file: ${err}`);
          }
        });
      }
    });
  } else if (extension == "npy") {
    // Run script to load target .npy file and save it in json format
    PythonShell.run('scripts/load.py', {args: [path]}, function(err, results) {
      if (err) {
        console.log(err, results);
      }
    });
  } else {
    throw "File type not supported.";
  }
}

function fileExists(filepath) {
  let flag = true;
  try {
    fs.accessSync(filepath, fs.constants.F_OK);
  } catch (e) {
    flag = false;
  }
  return flag;
}

function run(gui) {
  const app = express();
  const port = process.env.PORT || 8080;

  app.use(express.static(__dirname + "/public"));

  app.get("/", function (req, res) {
    res.render("index.html");
  });

  // To return whether GUI version enabled
  app.get("/gui", function (req, res) {
    res.send(gui);
  });

  if (!gui) {
    // To return array data read from file
    app.get("/data", function (req, res) {
      let readable = fs.createReadStream("data/temp/temp.json");
      readable.pipe(res);
    });
  }

  app.listen(port);
  console.log("Server started at: http://localhost:" + port);
}

let gui = process.argv.length != 3;

if (gui) {
  run(gui);
} else {
  let path = getFilePath();
   
  if (fileExists(path)) {
    convertToJSON(path); // Save target data into data/temp.json
    run(gui);
  } else {
    console.log("Data file not found.");
  }
}