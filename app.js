const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

const publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));

app.use(function(req, res) {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Invalid Request.");
});

// Address for running the code
app.listen(3000, () =>{
  console.log("Server started on port 3000");
});
