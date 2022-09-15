const fs = require("fs");
const { dialog } = require("@electron/remote");
const { PNG } = require("pngjs");
const pixelmatch = require("pixelmatch");

async function init() {
  const sourceImagePath = await getJson("sourceImageLocation");
  const actualImagePath = await getJson("actualImageLocation");
  const savePath = await getJson("saveLocation");
  const threshold = parseFloat(await getJson("threshold"));

  if (threshold === null) {
    await updateJson("threshold", "0.1");
  }

  document.getElementById("threshold-input").value = threshold;
  document.getElementById("threshold-input-label").innerText =
    String(threshold);

  if (sourceImagePath !== "") {
    fs.access(sourceImagePath, (err, res) => {
      if (err) return;
      document.getElementById("source-image-path-label").innerHTML =
        sourceImagePath;
      document.getElementById("source-image-thumbnail").src = sourceImagePath;
    });
  }

  if (actualImagePath !== "") {
    fs.access(actualImagePath, (err, res) => {
      if (err) return;
      document.getElementById("actual-image-path-label").innerHTML =
        actualImagePath;
      document.getElementById("actual-image-thumbnail").src = actualImagePath;
    });
  }

  if (savePath !== "") {
    fs.access(savePath, (err, res) => {
      if (err) return;
      document.getElementById("save-path-label").innerHTML = savePath;
    });
  }
}

init();

document
  .querySelector("#source-image-path-button")
  .addEventListener("click", (event) => {
    dialog
      .showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Images", extensions: ["png"] }],
      })
      .then(async (result) => {
        if (result.canceled) return;
        await updateJson("sourceImageLocation", result.filePaths[0]);
        document.getElementById("source-image-path-label").innerHTML =
          result.filePaths[0];
        document.getElementById("source-image-thumbnail").src =
          result.filePaths[0];
      })
      .catch((err) => {
        console.log(err);
      });
  });

document
  .querySelector("#actual-image-path-button")
  .addEventListener("click", (event) => {
    dialog
      .showOpenDialog({
        properties: ["openFile"],
      })
      .then(async (result) => {
        if (result.canceled) return;
        await updateJson("actualImageLocation", result.filePaths[0]);
        document.getElementById("actual-image-path-label").innerHTML =
          result.filePaths[0];
        document.getElementById("actual-image-thumbnail").src =
          result.filePaths[0];
      })
      .catch((err) => {
        console.log(err);
      });
  });

document
  .querySelector("#save-path-button")
  .addEventListener("click", (event) => {
    dialog
      .showOpenDialog({
        properties: ["openDirectory"],
      })
      .then(async (result) => {
        if (result.canceled) return;
        await updateJson("saveLocation", result.filePaths[0]);
        document.getElementById("save-path-label").innerHTML =
          result.filePaths[0];
      })
      .catch((err) => {
        console.log(err);
      });
  });

document.getElementById("threshold-input").addEventListener("input", () => {
  const { value } = document.getElementById("threshold-input");
  document.getElementById("threshold-input-label").innerText = String(value);
});

document.getElementById("threshold-input").addEventListener("change", () => {
  const { value } = document.getElementById("threshold-input");
  updateJson("threshold", value);
});

document
  .querySelector("#compare-button")
  .addEventListener("click", async () => {
    const sourceImagePath = await getJson("sourceImageLocation");
    const actualImagePath = await getJson("actualImageLocation");
    const savePath = await getJson("saveLocation");
    const threshold = parseFloat(await getJson("threshold"));

    compare(threshold / 100, sourceImagePath, actualImagePath, savePath);
  });

async function getJson(key) {
  return new Promise((resolve, reject) => {
    try {
      fs.readFile(`${__dirname}\\data.json`, (err, res) => {
        if (err) return;
        const data = JSON.parse(res);

        resolve(data[key]);
      });
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}

async function updateJson(key, value) {
  new Promise((resolve, reject) => {
    try {
      fs.readFile(`${__dirname}\\data.json`, (err, res) => {
        if (err) return;
        const data = JSON.parse(res);

        data[key] = value;

        try {
          fs.writeFile(`${__dirname}\\data.json`, JSON.stringify(data), () => {
            console.log(
              `"${key}" has been updated with "${value}" in "${__dirname}\\data.json"`
            );
          });
          resolve(
            `"${key}" has been updated with "${value}" in "${__dirname}\\data.json"`
          );
        } catch (error) {
          console.log(error);
          reject(error);
        }
      });
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}

function compare(
  threshold = 0.1,
  sourceImagePath,
  actualImagePath,
  outputImagePath
) {
  const sourceImage = PNG.sync.read(fs.readFileSync(sourceImagePath));
  const actualImage = PNG.sync.read(fs.readFileSync(actualImagePath));

  const { width, height } = sourceImage;
  const outputImage = new PNG({ width, height });

  const index = String(sourceImagePath).lastIndexOf("\\");
  const outputImageName = String(sourceImagePath)
    .slice(index)
    .slice(1)
    .replace(/\.png/g, "_generated.png");

  pixelmatch(
    sourceImage.data,
    actualImage.data,
    outputImage.data,
    width,
    height,
    { threshold }
  );

  fs.writeFileSync(
    `${outputImagePath}\\${outputImageName}`,
    PNG.sync.write(outputImage)
  );
}
