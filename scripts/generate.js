/* eslint-disable node/no-unsupported-features/es-syntax */
const { resolve } = require("path");
// eslint-disable-next-line node/no-unsupported-features/node-builtins
const { readdir, readFile, mkdir, rm, writeFile } = require("fs").promises;

// eslint-disable-next-line node/no-unsupported-features/es-syntax
async function* getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      if (res.endsWith(".svg")) {
        yield res;
      }
    }
  }
}

// Then, we will randomly pick some values and build outputs!

async function main() {
  // Import all SVG layers
  const svg = {};

  for await (const f of getFiles("scripts/svg/")) {
    const fullPath = f.split("/");
    const family = fullPath[fullPath.length - 5];
    if (fullPath[fullPath.length - 4] === "AVATAR") {
      const animal = fullPath[fullPath.length - 3];
      const type = fullPath[fullPath.length - 2];
      const name = fullPath[fullPath.length - 1];
      if (!svg[family]) {
        svg[family] = {};
      }
      if (!svg[family][animal]) {
        svg[family][animal] = {};
      }
      if (!svg[family][animal][type]) {
        svg[family][animal][type] = {};
      }
      const content = await readFile(f, { encoding: "utf8" });
      const x = content.match(/<svg .*>([\s\S]*)<\/svg>/m);
      if (x) {
        svg[family][animal][type][name.replace(".svg", "")] = x[1];
      } else {
        console.log("FILE COULD NOT BE PROCESSED!");
        console.log(f);
      }
    }
  }

  await rm("out", { recursive: true, force: true });
  await mkdir("out");

  const max = 6000;
  let index = 1;
  while (index <= max) {
    const families = Object.keys(svg);
    const family = families[Math.floor(Math.random() * families.length)];
    const animals = Object.keys(svg[family]);
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const bodies = Object.keys(svg[family][animal].BODY);
    const body = bodies[Math.floor(Math.random() * bodies.length)];
    const bodyContent = svg[family][animal].BODY[body];
    const outfits = Object.keys(svg[family][animal].OUTFIT);
    const outfit = outfits[Math.floor(Math.random() * outfits.length)];
    const outfitContent = svg[family][animal].OUTFIT[outfit];
    const jewelries = Object.keys(svg[family][animal].JEWELRY);
    const jewelry = jewelries[Math.floor(Math.random() * jewelries.length)];
    const jewelryContent = svg[family][animal].JEWELRY[jewelry];

    const filname = [
      index,
      family,
      animal,
      body.replace(animal, ""),
      outfit.replace(animal, ""),
      jewelry.replace(animal, ""),
    ].join("-");

    await writeFile(
      `out/${filname}.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg"  xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 432 432">
       ${bodyContent}\n
       ${outfitContent}\n
       ${jewelryContent}\n
       </svg>`
    );

    index += 1;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
