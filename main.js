import express from "express";
import fs, { write } from 'fs';
import npyjs from "npyjs";
import path from 'path';
import { fileURLToPath } from 'url';
import ndarray from "ndarray";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFilePath() {
  const path = process.argv[2];

  // Default to json data format
  if (path === undefined) {
    return undefined
  }
  if (!path.includes(".")) {
    path = path + ".json";
  }
  if (!path.includes("data/")) {
    path = "./data/" + path;
  }
  // Default to json data format
  if (!path.slice(1).includes(".")) {
    path = path + ".json";
  }

  return path;
}

async function fileExists(file) {
  try {
    await fs.promises.access(file, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function convertToJSON(path) {
  if (path === undefined) {
    return;
  }
  
  const extension = path.split(".").slice(-1)[0];
  switch (extension) {
    case "json":
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
      break;
    case "npy", "npz":
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
      break;
    default:
      throw "File type not supported.";
  }
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
      const readable = fs.createReadStream("data/temp/temp.json");
      readable.pipe(res);
    });
  }

  app.listen(port);
  console.log("Server started at: http://localhost:" + port);
}

const gui = process.argv.length != 3;

if (gui) {
  run(gui);
} else {
  const path = getFilePath();

  fileExists(path).then(exists => {
    if (exists) {
      convertToJSON(path); // Save target data into data/temp.json
      run(gui);
    } else {
      console.log("Data file not found.");
    }
  })
}
