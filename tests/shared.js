const { unlock } = require("hardhat");


const deployForTests = async () => {
  await unlock.deployProtocol()
  const expirationDuration = 60 * 60 * 24 * 7
  const maxNumberOfKeys = 100
  const keyPrice = 0

  const { lock: avatarLock } = await unlock.createLock({
    expirationDuration,
    maxNumberOfKeys,
    keyPrice,
    name: 'Avatar'
  })
  await (await avatarLock.setMaxKeysPerAddress(10)).wait()

  const { lock: buntaiLock } = await unlock.createLock({
    expirationDuration,
    maxNumberOfKeys,
    keyPrice,
    name: 'Buntai Weapons'
  })
  await (await buntaiLock.setMaxKeysPerAddress(10)).wait()

  const { lock: gundanLock } = await unlock.createLock({
    expirationDuration,
    maxNumberOfKeys,
    keyPrice,
    name: 'Gundan Weapons'
  })
  await (await gundanLock.setMaxKeysPerAddress(10)).wait()

  return {
    avatarLock,
    buntaiLock,
    gundanLock,
  }
}

module.exports = {
  deployForTests
}