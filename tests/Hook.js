const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { deployForTests } = require("./shared")

const operator = "0xDD8e2548da5A992A63aE5520C6bC92c37a2Bcc44";
const keyOwner = "0xDD8e2548da5A992A63aE5520C6bC92c37a2Bcc44";
const avatarIpfsHash = "AVATAR_IPFS_HASH";
const butaiWeaponIpfsHash = "BUNTAI_IPFS_HASH";
const gundanWeaponIpfsHash = "GUNDAN_IPFS_HASH";
const totalBuntaiWeapons = 3;
const totalGundanWeapons = 2;

const parseJsonDataUri = (uri) => {
  const regex = /^data:.+\/(.+);base64,(.*)$/;

  const matches = uri.match(regex);
  const ext = matches[1];
  if (ext !== "json") {
    throw new Error("not json");
  }
  const data = matches[2];
  const buffer = Buffer.from(data, "base64");
  const asString = buffer.toString()
  return JSON.parse(asString);
};

/**
 * Move in time! (next day at hours:min)
 * @param {*} hours 
 * @param {*} min 
 */
const moveTo = async (hours, min) => {
  const provider = new ethers.providers.Web3Provider(network.provider)
  const blockNumber = await provider.getBlockNumber()
  const block = await provider.getBlock(blockNumber)
  const nextDay = new Date(block.timestamp * 1000 + 24 * 60 * 60 * 1000);

  nextDay.setUTCHours(hours, min, 0, 0);
  await provider.send("evm_setNextBlockTimestamp", [
    nextDay.getTime() / 1000,
  ]);
  await network.provider.send("evm_mine");
  const blockNumber2 = await provider.getBlockNumber()
  const block2 = await provider.getBlock(blockNumber2)

}

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
  const hook = await Hook.deploy(avatarLock.address, buntaiLock.address, gundanLock.address, mapping.address, avatarIpfsHash, butaiWeaponIpfsHash, gundanWeaponIpfsHash, totalBuntaiWeapons, totalGundanWeapons);

  // Set the hook on avatar
  await (await avatarLock.setEventHooks(
    hook.address, // onKeyPurchaseHook,
    ethers.constants.AddressZero, // onKeyCancelHook,
    ethers.constants.AddressZero, // onValidKeyHook,
    hook.address, // onTokenURIHook
  )).wait()

  // Set the hook on buntai 
  await (await buntaiLock.setEventHooks(
    ethers.constants.AddressZero, // onKeyPurchaseHook,
    ethers.constants.AddressZero, // onKeyCancelHook,
    ethers.constants.AddressZero, // onValidKeyHook,
    hook.address, // onTokenURIHook
  )).wait()

  // Set the hook on gundan
  await (await gundanLock.setEventHooks(
    ethers.constants.AddressZero, // onKeyPurchaseHook,
    ethers.constants.AddressZero, // onKeyCancelHook,
    ethers.constants.AddressZero, // onValidKeyHook,
    hook.address, // onTokenURIHook
  )).wait()

  // Make sure hook is key granter on both weapon locks
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
  beforeEach(async () => {
    // Move to 1 AM (night!) on next day
    await moveTo(1, 0);
  })


  describe('When querying for weapons', () => {
    it('should return the right metadata', async () => {
      const [purchaser] = await ethers.getSigners();
      const {
        avatarLock,
        buntaiLock,
        gundanLock,
      } = await setup()


      // First weapon is a gundan!
      await (await avatarLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])).wait()

      metadata = parseJsonDataUri(
        await gundanLock.tokenURI(1)
      );

      expect(metadata.attributes[0].trait_type).to.eq('faction')
      expect(metadata.attributes[0].value).to.eq('gundan')
      expect(metadata.attributes[1].value).to.equal('night')
      expect(metadata.attributes[2].value).to.equal('1')
      expect(metadata.image).to.eq("GUNDAN_IPFS_HASH/1.svg")


      // Buy 2nd one! Will be a buntai!
      await (await avatarLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])).wait()

      metadata = parseJsonDataUri(
        await buntaiLock.tokenURI(1)
      );

      expect(metadata.attributes[0].trait_type).to.eq('faction')
      expect(metadata.attributes[0].value).to.eq('buntai')
      expect(metadata.attributes[1].value).to.equal('night')
      expect(metadata.attributes[2].value).to.equal('1')
      expect(metadata.image).to.eq("BUNTAI_IPFS_HASH/1.svg")

      // Third weapon is a gundan!
      await (await avatarLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])).wait()

      metadata = parseJsonDataUri(
        await gundanLock.tokenURI(2)
      );

      expect(metadata.attributes[0].trait_type).to.eq('faction')
      expect(metadata.attributes[0].value).to.eq('gundan')
      expect(metadata.attributes[1].value).to.equal('night')
      expect(metadata.attributes[2].value).to.equal('2')
      expect(metadata.image).to.eq("GUNDAN_IPFS_HASH/2.svg")

      // Fourth weapon is a buntai, but we don't care
      await (await avatarLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])).wait()

      // Fifth weapon is a gundan, but the first one!
      await (await avatarLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])).wait()

      metadata = parseJsonDataUri(
        await gundanLock.tokenURI(3)
      );

      expect(metadata.attributes[0].trait_type).to.eq('faction')
      expect(metadata.attributes[0].value).to.eq('gundan')
      expect(metadata.attributes[1].value).to.equal('night')
      expect(metadata.attributes[2].value).to.equal('1')
      expect(metadata.image).to.eq("GUNDAN_IPFS_HASH/1.svg")


    })
  })

  describe('when querying for the avatar', () => {
    it('should return the whole thing', async () => {
      const [purchaser] = await ethers.getSigners();
      const {
        avatarLock,
        buntaiLock,
        gundanLock,
      } = await setup()


      // First avatar is a gundan!
      await (await avatarLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])).wait()

      metadata = parseJsonDataUri(
        await avatarLock.tokenURI(1)
      );
      expect(metadata.image).to.equal('AVATAR_IPFS_HASH/1-1-0.svg')
      expect(metadata.attributes[0].value).to.eq('gundan')
      expect(metadata.attributes[1].value).to.equal('night')
      expect(metadata.attributes[2].value).to.equal('1')

      // Second avatar is a buntai!
      await (await avatarLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])).wait()

      metadata = parseJsonDataUri(
        await avatarLock.tokenURI(2)
      );
      expect(metadata.image).to.equal('AVATAR_IPFS_HASH/2-1-0.svg')
      expect(metadata.attributes[0].value).to.eq('buntai')
      expect(metadata.attributes[1].value).to.equal('night')
      expect(metadata.attributes[2].value).to.equal('1')

    })

    it('should return the whole thing without the weapon when it was transfered!', async () => {
      const [purchaser] = await ethers.getSigners();
      const {
        avatarLock,
        buntaiLock,
        gundanLock,
      } = await setup()


      // First avatar is a gundan!
      await (await avatarLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])).wait()

      // Let's transfer the weapon away!
      await (await gundanLock.transferFrom(purchaser.address, '0xdd8e2548da5a992a63ae5520c6bc92c37a2bcc44', 1)).wait()

      metadata = parseJsonDataUri(
        await avatarLock.tokenURI(1)
      );
      expect(metadata.image).to.equal('AVATAR_IPFS_HASH/1-0-0.svg')
      expect(metadata.attributes[2].value).to.equal('0')
    })

    it('should return the whole thing with the weapon when it was transfered and the mapping matches', async () => {
      const [purchaser] = await ethers.getSigners();
      const {
        avatarLock,
        buntaiLock,
        gundanLock,
        mapping,
      } = await setup()

      // First avatar is a gundan!
      await (await avatarLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])).wait()

      // Let's transfer the weapon away!
      await (await gundanLock.transferFrom(purchaser.address, '0xdd8e2548da5a992a63ae5520c6bc92c37a2bcc44', 1)).wait()

      // Let's create weapon and give it to the user
      const grantTx = await (await gundanLock.grantKeys([purchaser.address], [ethers.constants.MaxUint256], [purchaser.address])).wait()
      const grantedWeaponId = grantTx.events[1].args.tokenId

      // Add to mapping
      await (await mapping.addMapping(1, grantedWeaponId)).wait()

      // Check that we now have the new weapon!
      metadata = parseJsonDataUri(
        await avatarLock.tokenURI(1)
      );
      expect(metadata.image).to.equal('AVATAR_IPFS_HASH/1-2-0.svg')
      expect(metadata.attributes[2].value).to.equal('2')
    })

    it('should return the whole thing without the weapon when it was transfered and the mapping does not match', async () => {
      const [purchaser] = await ethers.getSigners();
      const {
        avatarLock,
        buntaiLock,
        gundanLock,
        mapping,
      } = await setup()

      // First avatar is a gundan!
      await (await avatarLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])).wait()

      // Let's transfer the weapon away!
      await (await gundanLock.transferFrom(purchaser.address, '0xdd8e2548da5a992a63ae5520c6bc92c37a2bcc44', 1)).wait()

      // Let's create weapon and give it to the user
      const grantTx = await (await gundanLock.grantKeys([purchaser.address], [ethers.constants.MaxUint256], [purchaser.address])).wait()
      const grantedWeaponId = grantTx.events[1].args.tokenId

      // Add to mapping
      await (await mapping.addMapping(1, grantedWeaponId)).wait()

      // Let's transfer the weapon away!
      await (await gundanLock.transferFrom(purchaser.address, '0xdd8e2548da5a992a63ae5520c6bc92c37a2bcc44', 2)).wait()

      // Check that we now have the new weapon!
      metadata = parseJsonDataUri(
        await avatarLock.tokenURI(1)
      );
      expect(metadata.image).to.equal('AVATAR_IPFS_HASH/1-0-0.svg')
      expect(metadata.attributes[2].value).to.equal('0')
    })
  })

  it("should return the right time of day", async function () {
    const [purchaser] = await ethers.getSigners();
    const {
      avatarLock,
      buntaiLock,
      gundanLock,
    } = await setup()


    // First avatar is a gundan!
    await (await avatarLock.purchase([0], [purchaser.address], [purchaser.address], [purchaser.address], [0])).wait()

    // Move to 1AM (night)
    await moveTo(1, 0);
    metadata = parseJsonDataUri(
      await avatarLock.tokenURI(1)
    );
    expect(metadata.image).to.equal('AVATAR_IPFS_HASH/1-1-0.svg')
    expect(metadata.attributes[1].trait_type).to.equal('momentOfDay')
    expect(metadata.attributes[1].value).to.equal('night')

    // Move to 9AM (day!)
    await moveTo(9, 0);
    metadata = parseJsonDataUri(
      await avatarLock.tokenURI(1)
    );
    expect(metadata.image).to.equal('AVATAR_IPFS_HASH/1-1-1.svg')
    expect(metadata.attributes[1].trait_type).to.equal('momentOfDay')
    expect(metadata.attributes[1].value).to.equal('day')

    // Move to 7 PM (evening!)
    await moveTo(19, 0);
    metadata = parseJsonDataUri(
      await avatarLock.tokenURI(1)
    );
    expect(metadata.image).to.equal('AVATAR_IPFS_HASH/1-1-2.svg')
    expect(metadata.attributes[1].trait_type).to.equal('momentOfDay')
    expect(metadata.attributes[1].value).to.equal('sunset')

  });

});
