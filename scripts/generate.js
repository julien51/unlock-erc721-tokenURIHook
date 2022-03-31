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

async function print(arr, cb) {
  // Number of arrays
  const n = arr.length;

  // To keep track of next element in
  // each of the n arrays
  const indices = new Array(n);

  // Initialize with first element's index
  for (let i = 0; i < n; i++) indices[i] = 0;

  while (true) {
    // Print current combination
    let combo = [];
    for (let i = 0; i < n; i++) {
      combo.push(arr[i][indices[i]]);
    }
    console.log('x')
    await cb(combo);
    combo = []; // reset

    // Find the rightmost array that has more
    // elements left after the current element
    // in that array
    let next = n - 1;
    while (next >= 0 && indices[next] + 1 >= arr[next].length) next--;

    // No such array is found so no more
    // combinations left
    if (next < 0) return;

    // If found move to next element in that
    // array
    indices[next]++;

    // For all arrays to the right of this
    // array current index again points to
    // first element
    for (let i = next + 1; i < n; i++) indices[i] = 0;
  }
}

async function main() {
  // Import all SVG layers
  const svgs = {};
  for await (const f of getFiles("scripts/svg/")) {
    const fullPath = f.split("/");
    const type = fullPath[fullPath.length - 2];
    if (!svgs[type]) {
      svgs[type] = [];
    }
    const content = await readFile(f, { encoding: "utf8" });
    const x = content.match(/<svg .*>([\s\S]*)<\/svg>/m)
    svgs[type].push(x[1]);
  }

  await rm("out", { recursive: true, force: true });
  await mkdir("out");

  let index = 1;
  await print(Object.values(svgs), async (combo) => {
    console.log('Start', index)
    await writeFile(`out/${index}.svg`, `<svg xmlns="http://www.w3.org/2000/svg"  xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 432 432">
    ${combo.join("\n")}</svg>`);
    console.log(combo);
    console.log("___");
    index = index + 1;
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
