const express = require("express");
const fs = require("fs");

function getFilePath() {
  let path = process.argv[2];

  // Default to json data format
  if (path != undefined) {
    if (!path.includes('.')) {
      path = path + '.json';
    }
    if (!path.includes("data/")) {
      path = "./data/" + path;
    }
  }
  return path;
}

async function fileExists(file) {
  try {
    await fs.promises.access(file, fs.constants.F_OK);
    console.log('Loaded data from', file);
    return true;
  } catch {
    return false;
  }
}


let path = getFilePath();

if (fileExists(path)) {
  const app = express();
  const port = process.env.PORT || 8080;

  app.use(express.static(__dirname + "/public"));

  app.get("/", function (req, res) {
    res.render("index.html");
  });

  // To pass through array data
  app.get("/data", function (req, res) {
    let readable = fs.createReadStream(path);
    readable.pipe(res);
  });

  app.listen(port);
  console.log("Server started at: http://localhost:" + port);
} else {
  console.log("File path required");
}
