/* eslint-disable node/no-unsupported-features/es-syntax */
const { unlock, ethers, run, network } = require("hardhat");

const avatarIpfsHash = "QmNxQ71De6NHyyjhP9toaBXPGDCQEPM7Ua4ppQZBMPA9sC";
const buntaiWeaponIpfsHash = "QmYY8FAnpWUHmrhs7ofjXPdkPRiT1oQPfKiXsoV8sg8iJQ";
const gundanWeaponIpfsHash = "QmUfMgRBiwhDEWCaWP2m5jNfrp8HmN2abuEoA5Z6Ncw8gn";
const totalBuntaiWeapons = 45;
const totalGundanWeapons = 40;

const avatarLockAddress = "0x851f310949e02c791d4f5120c9d319bba4e0157e"

async function main() {

  if (network.config.chainId === 31337) {
    console.log('deploying protocol')
    await unlock.deployProtocol()
  }

  const { lock: avatarLock } = await unlock.createLock({
    expirationDuration: ethers.constants.MaxUint256,
    maxNumberOfKeys: 4200,
    keyPrice: ethers.utils.parseUnits("0.07"),
    name: 'Avatar'
  })
  console.log(`avatar lock deployed at ${avatarLock.address}`)
  await (await avatarLock.setMaxKeysPerAddress(20)).wait()
  console.log(`avatar lock max keys set to 20`)
  await (await avatarLock.addLockManager("0x83CE088FF9A2491163a95449362DA0628307d339")).wait()
  console.log(`avatar lock manager added 0x83CE088FF9A2491163a95449362DA0628307d339`)

  const { lock: buntaiLock } = await unlock.createLock({
    expirationDuration: ethers.constants.MaxUint256,
    maxNumberOfKeys: 0,
    keyPrice: ethers.utils.parseUnits("0"),
    name: 'Buntai Weapons'
  })
  console.log(`buntai weapon lock deployed at ${buntaiLock.address}`)
  await (await buntaiLock.setMaxKeysPerAddress(20)).wait()
  console.log(`buntai weapon lock max keys set to 20`)
  await (await buntaiLock.addLockManager("0x83CE088FF9A2491163a95449362DA0628307d339")).wait()
  console.log(`buntai weapon manager added 0x83CE088FF9A2491163a95449362DA0628307d339`)

  const { lock: gundanLock } = await unlock.createLock({
    expirationDuration: ethers.constants.MaxUint256,
    maxNumberOfKeys: 0,
    keyPrice: ethers.utils.parseUnits("0"),
    name: 'Gundan Weapons'
  })
  console.log(`gundan weapon lock deployed at ${gundanLock.address}`)
  await (await gundanLock.setMaxKeysPerAddress(20)).wait()
  console.log(`gundan weapon lock max keys set to 20`)
  await (await gundanLock.addLockManager("0x83CE088FF9A2491163a95449362DA0628307d339")).wait()
  console.log(`gundan weapon manager added 0x83CE088FF9A2491163a95449362DA0628307d339`)

  // Deploy mapping
  const Mapping = await ethers.getContractFactory("Mapping");
  const mapping = await Mapping.deploy(avatarLock.address, buntaiLock.address, gundanLock.address);
  await mapping.deployed()
  console.log(`mapping deployed to ${mapping.address}`)

  // Deploy hook
  const Hook = await ethers.getContractFactory("Hook");
  const hook = await Hook.deploy(avatarLock.address, buntaiLock.address, gundanLock.address, mapping.address, avatarIpfsHash, buntaiWeaponIpfsHash, gundanWeaponIpfsHash, totalBuntaiWeapons, totalGundanWeapons);


  await hook.deployed()
  console.log(`hook deployed to ${hook.address}`)

  // Set the hook on avatar
  await (await avatarLock.setEventHooks(
    hook.address, // onKeyPurchaseHook,
    ethers.constants.AddressZero, // onKeyCancelHook,
    ethers.constants.AddressZero, // onValidKeyHook,
    hook.address, // onTokenURIHook
  )).wait()
  console.log('avatarLock hook setup')

  // Set the hook on butai weapon
  await (await buntaiLock.setEventHooks(
    ethers.constants.AddressZero,
    ethers.constants.AddressZero, // onKeyCancelHook,
    ethers.constants.AddressZero, // onValidKeyHook,
    hook.address, // onTokenURIHook
  )).wait()
  console.log('buntaiLock hook setup')

  // Set the hook on gundan weapon
  await (await gundanLock.setEventHooks(
    ethers.constants.AddressZero,
    ethers.constants.AddressZero, // onKeyCancelHook,
    ethers.constants.AddressZero, // onValidKeyHook,
    hook.address, // onTokenURIHook
  )).wait()
  console.log('gundanLock hook setup')

  // Make sure hook is key granter on both weapon locks
  await (await buntaiLock.addKeyGranter(
    hook.address
  )).wait()
  console.log('buntaiLock key granter setup')

  await (await gundanLock.addKeyGranter(
    hook.address
  )).wait()
  console.log('gundanLock key granter setup')

  // And then we're ready!
  console.log({
    'avatar': avatarLock.address,
    'buntai weapon': buntaiLock.address,
    'gundan weapon': gundanLock.address,
    'mapping': mapping.address,
    'hook': hook.address,
  })

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
