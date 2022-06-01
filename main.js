
const express = require("express");
const fs = require('fs');

function getFilePath() {
  let path = process.argv[2];

  // Check for no input
  if (path == undefined) {
    console.log(
      'File path required.'
    );
    return null;
  }

  return path;
}

let path = getFilePath();
if (path != null) {  
  const app = express();
  const port = process.env.PORT || 8080;
  
  app.use(express.static(__dirname + "/public"));
  
  app.get("/", function (req, res) {
    res.render("index.html");
  });

  // To pass through array data
  app.get('/data', function(req, res) {
    let readable = fs.createReadStream(path);
    readable.pipe(res);
  });
  
  app.listen(port);
  console.log("Server started at: http://localhost:" + port);
}

