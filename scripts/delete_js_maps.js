const fs = require("fs");
const path = require("path");

const directory = path.join(__dirname, "../dist");

fs.readdir(directory, (err, files) => {
  if (err) throw err;

  files
    .filter(f => f.endsWith(".js.map"))
    .forEach(file =>
      fs.unlink(path.join(directory, file), err => {
        if (err) throw err;
      })
    );
});
