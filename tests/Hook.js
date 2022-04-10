const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const avatarLock = "0xB2b7fD74a0B3724D8D6e423bf86Dfc368E118818";
const weaponLock = "0xc5d5B57CAE6Fedb0d1fA629062f80c8026cCbe57";
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

describe("onTokenUri", () => {
  it("should return the time timeOfDay if the contract is avatar", async function () {
    const Hook = await ethers.getContractFactory("Hook");

    const hook = await Hook.deploy(avatarLock, weaponLock, ipfsHash);

    const tokenId = 1;
    const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

    // Move to 1 AM (night!)
    tomorrow.setUTCHours(1, 0, 0, 0);
    await network.provider.send("evm_setNextBlockTimestamp", [
      tomorrow.getTime() / 1000,
    ]);
    await network.provider.send("evm_mine");
    let metadata = parseJsonDataUri(
      await hook.tokenURI(avatarLock, operator, keyOwner, tokenId, 0)
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

  it("should not return the time timeOfDay if the contract is weapon", async function () {
    const Hook = await ethers.getContractFactory("Hook");

    const hook = await Hook.deploy(avatarLock, weaponLock, ipfsHash);

    const tokenId = 1;

    const metadata = parseJsonDataUri(
      await hook.tokenURI(weaponLock, operator, keyOwner, tokenId, 0)
    );
    expect(metadata.image).to.equal(`${ipfsHash}/weapons/${tokenId}`);
  });
});
