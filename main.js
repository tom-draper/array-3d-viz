import express from "express";
import { promises, constants, readFile, writeFile, createReadStream } from "fs";
import { PythonShell } from "python-shell";

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

async function fileExists(file) {
  try {
    await promises.access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function convertToJSON(path) {
  if (path == undefined) {
    return;
  }
  let extension = path.split(".").slice(-1)[0];
  if (extension == "json") {
    readFile(path, "utf8", (err, data) => {
      if (err) {
        console.log(`Error reading file from disk: ${err}`);
      } else {
        writeFile("data/temp/temp.json", data, "utf8", (err) => {
          if (err) {
            console.log(`Error writing file: ${err}`);
          }
        });
      }
    });
  } else if (extension == "npy" || extension == "npz") {
    // Run script to load target .npy file and save it in json format
    PythonShell.run(
      "scripts/load.py",
      { args: [path] },
      function (err, results) {
        if (err) {
          console.log(err, results);
        }
      }
    );
  } else {
    throw "File type not supported.";
  }
}

function run(gui) {
  const app = express();
  const port = process.env.PORT || 8080;

  app.use(express.static("public"));

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
      let readable = createReadStream("data/temp/temp.json");
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
