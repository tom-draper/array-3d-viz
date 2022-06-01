const express = require("express");
const fs = require("fs");

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
  let extension = path.split(".").slice(-1)[0];
  if (extension == "json") {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) {
        console.log(`Error reading file from disk: ${err}`);
      } else {
        fs.writeFile("data/temp.json", data, "utf8", (err) => {
          if (err) {
            console.log(`Error writing file: ${err}`);
          }
        });
      }
    });
  } else if (extension == "npy") {
  } else {
    throw "File type not supported.";
  }
}

function run(path) {
  convertToJSON(path); // Save target data into data/temp.json

  const app = express();
  const port = process.env.PORT || 8080;

  app.use(express.static(__dirname + "/public"));

  app.get("/", function (req, res) {
    res.render("index.html");
  });

  // To pass through array data
  app.get("/data", function (req, res) {
    let readable = fs.createReadStream("data/temp.json");
    readable.pipe(res);
  });

  app.listen(port);
  console.log("Server started at: http://localhost:" + port);
}

let path = getFilePath();

// let n = new npyjs();

// n.load("my-array.npy", (array, shape) => {
//   // `array` is a one-dimensional array of the raw data
//   // `shape` is a one-dimensional array that holds a numpy-style shape.
//   console.log(
//     `You loaded an array with ${array.length} elements and ${shape.length} dimensions.`
//   );
// });

fs.promises
  .access(path, fs.constants.F_OK)
  .then(run(path))
  .catch(() => console.log("File path not found."));
