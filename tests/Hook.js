const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { deployForTests } = require("./shared")

const operator = "0xDD8e2548da5A992A63aE5520C6bC92c37a2Bcc44";
const keyOwner = "0xDD8e2548da5A992A63aE5520C6bC92c37a2Bcc44";
const ipfsHash = "IPFS_HASH";

const parseJsonDataUri = (uri) => {
  const regex = /^data:.+\/(.+);base64,(.*)$/;

  const matches = uri.match(regex);
  const ext = matches[1];
  if (ext !== "json") {
    throw new Error("not json");
  }
  const data = matches[2];
  const buffer = Buffer.from(data, "base64");
  return JSON.parse(buffer.toString());
};

const setup = async () => {
  const {
    avatarLock,
    buntaiLock,
    gundanLock,
  } = await deployForTests()

  // Deploy the mapping
  const Mapping = await ethers.getContractFactory("Mapping");
  const mapping = await Mapping.deploy(avatarLock.address, buntaiLock.address, gundanLock.address);

  // Deploy the hook!
  const Hook = await ethers.getContractFactory("Hook");
  const hook = await Hook.deploy(avatarLock.address, buntaiLock.address, gundanLock.address, mapping.address, ipfsHash);

  // Set the hook
  await (await avatarLock.setEventHooks(
    hook.address, // onKeyPurchaseHook,
    ethers.constants.AddressZero, // onKeyCancelHook,
    ethers.constants.AddressZero, // onValidKeyHook,
    hook.address, // onTokenURIHook
  )).wait()

  // Make sure hook is key granter on both locks
  await (await buntaiLock.addKeyGranter(
    hook.address
  )).wait()
  await (await gundanLock.addKeyGranter(
    hook.address
  )).wait()

  return {
    avatarLock,
    buntaiLock,
    gundanLock,
    mapping,
    hook,
  }
}

describe("onKeyPurchase", () => {
  it("should add a weapon to every avatar", async () => {
    const [purchaser] = await ethers.getSigners();
    const {
      avatarLock,
      buntaiLock,
      gundanLock,
    } = await setup()

    // Now we're ready!
    // Let's buy a avatar and see what happens!
    const txAvatar = await avatarLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])
    const receiptAvatar = await txAvatar.wait()
    const { tokenId: avatarId } = avatarLock.interface.parseLog(receiptAvatar.logs[1]).args;

    // User should have a weapon too!
    const balanceBuntai = await buntaiLock.balanceOf(purchaser.address);
    expect(balanceBuntai).to.equal(0)
    const balanceGundan = await gundanLock.balanceOf(purchaser.address);
    expect(balanceGundan).to.equal(1)

    // Buy another avatar
    const txAvatar2 = await avatarLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])
    const receiptAvatar2 = await txAvatar2.wait()
    const { tokenId: avatarId2 } = avatarLock.interface.parseLog(receiptAvatar2.logs[1]).args;

    // User should have one of each now!
    const balanceBuntai2 = await buntaiLock.balanceOf(purchaser.address);
    expect(balanceBuntai2).to.equal(1)
    const balanceGundan2 = await gundanLock.balanceOf(purchaser.address);
    expect(balanceGundan2).to.equal(1)
  })
})

describe("onTokenUri", () => {
  it("should return the placeholder image", async function () {
    const [purchaser] = await ethers.getSigners();
    const {
      avatarLock,
      buntaiLock,
      gundanLock,
    } = await setup()

    const tokenId = 1;

    const metadata = parseJsonDataUri(
      await avatarLock.tokenURI(tokenId)
    );
    expect(metadata.image).to.equal(`QmYkkshevBxHg7XwdP1pw6A4T82xzD8G2RpLDFo6KDy3zm`);
  });

  it.skip("should return the time timeOfDay if the contract is avatar", async function () {
    const [purchaser] = await ethers.getSigners();
    const {
      avatarLock,
      buntaiLock,
      gundanLock,
    } = await setup()

    const tokenId = 1;

    const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

    // Move to 1 AM (night!)
    tomorrow.setUTCHours(1, 0, 0, 0);
    await network.provider.send("evm_setNextBlockTimestamp", [
      tomorrow.getTime() / 1000,
    ]);
    await network.provider.send("evm_mine");
    let metadata = parseJsonDataUri(
      await avatarLock.tokenURI(tokenId)
    );
    expect(metadata.image).to.equal(`${ipfsHash}/avatars/${tokenId}-0-0`);


    // Move to 9 AM (day!)
    tomorrow.setUTCHours(9, 0, 0, 0);
    await network.provider.send("evm_setNextBlockTimestamp", [
      tomorrow.getTime() / 1000,
    ]);
    await network.provider.send("evm_mine");
    metadata = parseJsonDataUri(
      await hook.tokenURI(avatarLock, operator, keyOwner, tokenId, 0)
    );
    expect(metadata.image).to.equal(`${ipfsHash}/avatars/${tokenId}-0-1`);


    // // Move to 7 PM (evening!)
    tomorrow.setUTCHours(19, 0, 0, 0);
    await network.provider.send("evm_setNextBlockTimestamp", [
      tomorrow.getTime() / 1000,
    ]);
    await network.provider.send("evm_mine");
    metadata = parseJsonDataUri(
      await hook.tokenURI(avatarLock, operator, keyOwner, tokenId, 0)
    );
    expect(metadata.image).to.equal(`${ipfsHash}/avatars/${tokenId}-0-2`);
  });

  it.skip("should not return the time timeOfDay if the contract is weapon", async function () {
    const [purchaser] = await ethers.getSigners();
    const {
      avatarLock,
      buntaiLock,
      gundanLock,
    } = await setup()

    const tokenId = 1;

    const metadata = parseJsonDataUri(
      await avatarLock.tokenURI(tokenId)
    );
    expect(metadata.image).to.equal(`${ipfsHash}/weapons/${tokenId}`);
  });
});
