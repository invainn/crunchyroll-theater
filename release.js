const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

const dir = "./dist";

if (fs.existsSync(dir)) {
  fs.rmdirSync(dir, { recursive: true });
}
fs.mkdirSync(dir);

const output = fs.createWriteStream(path.join(__dirname + "/dist/release.zip"));
const archive = archiver("zip", {
  zlib: { level: 9 },
});

output.on("close", () => {
  console.log(archive.pointer() + " total bytes written");
});

archive.on("warning", (err) => {
  if (err.code === "ENOENT") {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on("error", (err) => {
  throw err;
});

archive.pipe(output);
archive.directory("./public", false);
archive.finalize();
