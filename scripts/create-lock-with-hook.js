const path = require('path');

/* eslint-disable node/no-unsupported-features/es-syntax */
const { unlock, ethers, run, network } = require("hardhat");

const { resolve } = require("path");
// eslint-disable-next-line node/no-unsupported-features/node-builtins
const { readdir, readFile } = require("fs").promises;

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

const { AddressZero } = ethers.constants;

async function main() {

  // Import all SVG layers
  const svgs = {};
  for await (const f of getFiles("scripts/svg/")) {
    const fullPath = f.split(path.sep);
    const type = fullPath[fullPath.length - 2];
    if (!svgs[type]) {
      svgs[type] = [];
    }
    const content = await readFile(f, { encoding: "utf8" });
    svgs[type].push(content);
  }

  // make sure we compile the latest versions
  run("compile");

  if (network.name === "hardhat") {
    await unlock.deployProtocol();
  }

  // deploy Layers
  const Layer = await ethers.getContractFactory("Layer");
  const avatars = await Layer.deploy(svgs.avatar);
  await avatars.deployed();
  console.log("> avatars deployed to:", avatars.address);

  const outfits = await Layer.deploy(svgs.outfit);
  await outfits.deployed();
  console.log("> outfits deployed to:", outfits.address);

  const weapons = await Layer.deploy(svgs.weapon);
  await weapons.deployed();
  console.log("> weapons deployed to:", weapons.address);



  // create a Lock for avatar
  const avatarLockArgs = {
    name: "Avatar Lock",
    keyPrice: 0,
    expirationDuration: 3600 * 24, // (24h)
    currencyContractAddress: AddressZero, // no ERC20 specified
    maxNumberOfKeys: 1000,
  };
  const { lock: avatarLock } = await unlock.createLock(avatarLockArgs);
  console.log(
    `> Lock '${await avatarLock.name()}' deployed to:`,
    avatarLock.address
  );

  // create a Lock for weapon
  const weaponLockArgs = {
    name: "Weapon Lock",
    keyPrice: 0,
    expirationDuration: 3600 * 24, // (24h)
    currencyContractAddress: AddressZero, // no ERC20 specified
    maxNumberOfKeys: 1000,
  };
  const { lock: weaponLock } = await unlock.createLock(weaponLockArgs);
  console.log(
    `> Lock '${await weaponLock.name()}' deployed to:`,
    weaponLock.address
  );

  // create a Lock for outfit
  const outfitLockArgs = {
    name: "Outfit Lock",
    keyPrice: 0,
    expirationDuration: 3600 * 24, // (24h)
    currencyContractAddress: AddressZero, // no ERC20 specified
    maxNumberOfKeys: 1000,
  };
  const { lock: outfitLock } = await unlock.createLock(outfitLockArgs);
  console.log(
    `> Lock '${await outfitLock.name()}' deployed to:`,
    outfitLock.address
  );

  // deploy the hook
  const LockTokenURIHook = await ethers.getContractFactory("LockTokenURIHook");
  const hook = await LockTokenURIHook.deploy(
    avatarLock.address,
    weaponLock.address,
    outfitLock.address,
    avatars.address,
    weapons.address,
    outfits.address
  );
  await hook.deployed();
  console.log("> Hook deployed to:", hook.address);

  // set events hook
  await avatarLock.setEventHooks(
    AddressZero,
    AddressZero,
    AddressZero,
    hook.address
  );

  await weaponLock.setEventHooks(
    AddressZero,
    AddressZero,
    AddressZero,
    hook.address
  );

  await outfitLock.setEventHooks(
    AddressZero,
    AddressZero,
    AddressZero,
    hook.address
  );

  // buy a key on each
  const [signer] = await ethers.getSigners();

  await weaponLock
    .connect(signer)
    .addLockManager("0xdd8e2548da5a992a63ae5520c6bc92c37a2bcc44");

  await outfitLock
    .connect(signer)
    .addLockManager("0xdd8e2548da5a992a63ae5520c6bc92c37a2bcc44");

  await avatarLock
    .connect(signer)
    .addLockManager("0xdd8e2548da5a992a63ae5520c6bc92c37a2bcc44");

  console.log("Ready!")

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
