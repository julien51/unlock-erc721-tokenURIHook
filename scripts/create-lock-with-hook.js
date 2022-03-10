/* eslint-disable node/no-unsupported-features/es-syntax */
const { unlock, ethers, run } = require("hardhat");

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
  const svgs = {};

  for await (const f of getFiles("scripts/svg/")) {
    const fullPath = f.split("/");
    const type = fullPath[fullPath.length - 2];
    if (!svgs[type]) {
      svgs[type] = [];
    }
    const content = await readFile(f, { encoding: "utf8" });
    svgs[type].push(content);
  }

  // make sure we compile the latest versions
  run("compile");

  // start workflow
  console.log("Unlock TokenURI Hook example:");

  // deploy Layers
  const Layer = await ethers.getContractFactory("Layer");
  const avatars = Layer.attach('0x4B340c9799D832F909Cb92d2802984ef413CF36b')
  // const avatars = await Layer.deploy(svgs.avatar);
  // await avatars.deployed();
  console.log("> avatars deployed to:", avatars.address);

  const outfits = await Layer.attach('0xfe52ACb66Ef2F9E10E4809AcBDEfDB2b5712d445');
  // const outfits = await Layer.deploy(svgs.outfit);
  // await outfits.deployed();
  console.log("> outfits deployed to:", outfits.address);

  const weapons = await Layer.attach('0x443D0Bf400949FbF50D641Ab7F7546177d562a73');
  // const weapons = await Layer.deploy(svgs.weapon);
  // await weapons.deployed();
  console.log("> weapons deployed to:", weapons.address);

  // deploy Unlock
  // await unlock.deployProtocol();


  // create a Lock for avatar
  // const avatarLockArgs = {
  //   name: "Avatar Lock",
  //   keyPrice: 0,
  //   expirationDuration: 3600 * 24, // (24h)
  //   currencyContractAddress: AddressZero, // no ERC20 specified
  //   maxNumberOfKeys: 10,
  // };
  // const { lock: avatarLock } = await unlock.createLock(avatarLockArgs);
  const avatarLock = await unlock.getLock('0x6c4374cB699F30aE6013eb0d67e5A8aFD3BE1773')
  console.log(
    `> Lock '${await avatarLock.name()}' deployed to:`,
    avatarLock.address
  );

  // create a Lock for weapon
  // const weaponLockArgs = {
  //   name: "Weapon Lock",
  //   keyPrice: 0,
  //   expirationDuration: 3600 * 24, // (24h)
  //   currencyContractAddress: AddressZero, // no ERC20 specified
  //   maxNumberOfKeys: 10,
  // };
  // const { lock: weaponLock } = await unlock.createLock(weaponLockArgs);
  const weaponLock = await unlock.getLock('0x84793bd014eBB3F84003904c43Ba23903aE7122C')
  console.log(
    `> Lock '${await weaponLock.name()}' deployed to:`,
    weaponLock.address
  );


  // create a Lock for outfit
  // const outfitLockArgs = {
  //   name: "Outfit Lock",
  //   keyPrice: 0,
  //   expirationDuration: 3600 * 24, // (24h)
  //   currencyContractAddress: AddressZero, // no ERC20 specified
  //   maxNumberOfKeys: 10,
  // };
  // const { lock: outfitLock } = await unlock.createLock(outfitLockArgs);
  const outfitLock = await unlock.getLock('0xe51cA1832Bf2a219c3df0561E571670f30dC5028')
  console.log(
    `> Lock '${await outfitLock.name()}' deployed to:`,
    outfitLock.address
  );

  // deploy the hook
  const LockTokenURIHook = await ethers.getContractFactory("LockTokenURIHook");
  // const hook = await LockTokenURIHook.deploy(
  //   avatarLock.address,
  //   weaponLock.address,
  //   outfitLock.address,
  //   avatars.address,
  //   weapons.address,
  //   outfits.address
  // );
  // await hook.deployed();
  const hook = await LockTokenURIHook.attach('0x4e4B1F4bcb2A6c2C9f36cD91d3921625b502eB31')
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
    .purchase(0, signer.address, AddressZero, AddressZero, [], {
      value: 0,
    });
  const weaponKeyId = await weaponLock.getTokenIdFor(signer.address);
  console.log(
    `> Signer ${signer.address} bought the key ${weaponKeyId} on avatar lock`
  );
  const weaponTokenURI = await weaponLock.tokenURI(weaponKeyId);
  console.log(weaponTokenURI);

  await outfitLock
    .connect(signer)
    .purchase(0, signer.address, AddressZero, AddressZero, [], {
      value: 0,
    });
  const outfitKeyId = await outfitLock.getTokenIdFor(signer.address);
  console.log(
    `> Signer ${signer.address} bought the key ${outfitKeyId} on avatar lock`
  );
  const outfitTokenURI = await outfitLock.tokenURI(outfitKeyId);
  console.log(outfitTokenURI);

  await avatarLock
    .connect(signer)
    .purchase(0, signer.address, AddressZero, AddressZero, [], {
      value: 0,
    });
  const avatarKeyId = await avatarLock.getTokenIdFor(signer.address);
  console.log(
    `> Signer ${signer.address} bought the key ${avatarKeyId} on avatar lock`
  );
  const avatarTokenURI = await avatarLock.tokenURI(avatarKeyId);
  console.log(avatarTokenURI);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
