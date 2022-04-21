const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { deployForTests } = require("./shared")

describe("Mapping", () => {

  it("should map", async function () {
    const [purchaser] = await ethers.getSigners();
    const {
      avatarLock,
      buntaiLock,
      gundanLock,
    } = await deployForTests()

    const Mapping = await ethers.getContractFactory("Mapping");
    const mapping = await Mapping.deploy(avatarLock.address, buntaiLock.address, gundanLock.address);

    const txAvatar = await avatarLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])
    const receiptAvatar = await txAvatar.wait()
    const { tokenId: avatarId } = avatarLock.interface.parseLog(receiptAvatar.logs[1]).args;

    // No mapping
    expect(await mapping.avatarsWeapons(avatarId)).to.equal(0);
    expect(await mapping.avatarsWeapons(avatarId + 1)).to.equal(0);


    const txBuntaiLock = await buntaiLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])
    const receiptBuntaiLock = await txBuntaiLock.wait()
    const { tokenId: buntaiLockId } = buntaiLock.interface.parseLog(receiptBuntaiLock.logs[1]).args;

    // Bad Mapping now (buntai is for even numbers!)
    await expect(
      mapping.addMapping(avatarId, buntaiLockId)
    ).to.be.revertedWith("Must own gundan weapon");
    expect(await mapping.avatarsWeapons(avatarId)).to.equal(0);

    // Deploy Gundan
    const txGundanLock = await gundanLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])
    const receiptGundanLock = await txGundanLock.wait()
    const { tokenId: gundanLockId } = gundanLock.interface.parseLog(receiptGundanLock.logs[1]).args;

    // Mapping now!
    const buntaiMappingTx = await mapping.addMapping(avatarId, gundanLockId)
    await buntaiMappingTx.wait()
    expect(await mapping.avatarsWeapons(avatarId)).to.equal(1);
    expect(await mapping.avatarsWeapons(avatarId + 1)).to.equal(0);

    // Delete mapping
    const deleteMappingTx = await mapping.removeMapping(avatarId)
    await deleteMappingTx.wait()
    expect(await mapping.avatarsWeapons(avatarId)).to.equal(0);
    expect(await mapping.avatarsWeapons(avatarId + 1)).to.equal(0);
  });
});