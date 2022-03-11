# Dynamic NFT!

This is a sample project to show how [Unlock Protocol](https://unlock-protocol.com) `onTokenURIHook` can be used to return a custom SVG when `tokenURI` is fetched and create dynamic NFT (NFT whose visual aspect changes based on other NFTs that the user might own)

Here we start with 3 locks (NFT contracts):

- Avatar: 1000 NFT with 2 versions :
  - [version 1](https://testnets.opensea.io/assets/0x511db1691048a6b110f9050e2c98f7f13581ca5b/5): odd token ids
  - [version 2](https://testnets.opensea.io/assets/0x511db1691048a6b110f9050e2c98f7f13581ca5b/6): even token ids
- [Outfit](https://testnets.opensea.io/collection/outfit-lock-v3): 1000 NFT with 3 versions
  - [version 1](https://testnets.opensea.io/assets/0xd390fd23719e26e1596d45633654d5d81738ff5d/4):
  - [version 2](https://testnets.opensea.io/assets/0xd390fd23719e26e1596d45633654d5d81738ff5d/5):
  - [version 3](https://testnets.opensea.io/assets/0xd390fd23719e26e1596d45633654d5d81738ff5d/6):
- [Weapon](https://testnets.opensea.io/collection/weapon-lock-v3): 1000 NFT with 4 versions
  - [version 1](https://testnets.opensea.io/assets/0x095458d35ab742172a736cc5843f56a936baa935/1):
  - [version 2](https://testnets.opensea.io/assets/0x095458d35ab742172a736cc5843f56a936baa935/2):
  - [version 3](https://testnets.opensea.io/assets/0x095458d35ab742172a736cc5843f56a936baa935/3):
  - [version 4](https://testnets.opensea.io/assets/0x095458d35ab742172a736cc5843f56a936baa935/4):

That Outfirt and Weapon NFT are only "rendered" if they are not expired (by default they are valid 1 day). See for [example that one](https://testnets.opensea.io/assets/0x095458d35ab742172a736cc5843f56a936baa935/6). It's expired, so it is empty!

The avart NFT have one more special thing: if the owner of the avatar NFT owns any non-expired outfit NFT or any non-expired weapon NFT, then the avatar itself will includes these!

Here is an example: the owner of [this avatar](https://testnets.opensea.io/assets/0x511db1691048a6b110f9050e2c98f7f13581ca5b/3) owns a [this weapon](https://testnets.opensea.io/assets/0x095458d35ab742172a736cc5843f56a936baa935/1) and [this outfit](https://testnets.opensea.io/assets/0xd390fd23719e26e1596d45633654d5d81738ff5d/1). Please note that the colors don't match as they are combined to create the final rendering!

Want to try it on your own? It's all deployed on Rinkeby so it does not cost anything.
Start by [purchasing an avatar](https://app.unlock-protocol.com/checkout?paywallConfig=%7B%0A%20%20%22pessimistic%22%3A%20%22true%22%2C%0A%20%20%22locks%22%3A%20%7B%0A%20%20%20%20%220x511DB1691048A6B110f9050e2c98f7f13581CA5B%22%3A%20%7B%0A%20%20%20%20%20%20%22network%22%3A%204%2C%0A%20%20%20%20%20%20%22name%22%3A%20%22Avatar%22%0A%20%20%20%20%7D%0A%20%20%7D%2C%0A%20%20%22icon%22%3A%20%22%22%2C%0A%20%20%22messageToSign%22%3A%20%22%22%2C%0A%20%20%22callToAction%22%3A%20%7B%0A%20%20%20%20%22default%22%3A%20%22Get%20an%20avatar!%22%0A%20%20%7D%0A%7D), then, get [an outfit](https://app.unlock-protocol.com/checkout?paywallConfig=%7B%0A%20%20%22pessimistic%22%3A%20%22true%22%2C%0A%20%20%22locks%22%3A%20%7B%0A%20%20%20%20%220xd390fd23719e26e1596d45633654d5d81738ff5d%22%3A%20%7B%0A%20%20%20%20%20%20%22network%22%3A%204%2C%0A%20%20%20%20%20%20%22name%22%3A%20%22Outfit%22%0A%20%20%20%20%7D%0A%20%20%7D%2C%0A%20%20%22icon%22%3A%20%22%22%2C%0A%20%20%22messageToSign%22%3A%20%22%22%2C%0A%20%20%22callToAction%22%3A%20%7B%0A%20%20%20%20%22default%22%3A%20%22Get%20an%20outfit!%22%0A%20%20%7D%0A%7D) and/or [a weapon](https://app.unlock-protocol.com/checkout?paywallConfig=%7B%0A%20%20%22pessimistic%22%3A%20%22true%22%2C%0A%20%20%22locks%22%3A%20%7B%0A%20%20%20%20%220x095458d35ab742172a736cc5843f56a936baa935%22%3A%20%7B%0A%20%20%20%20%20%20%22network%22%3A%204%2C%0A%20%20%20%20%20%20%22name%22%3A%20%22Weapon%22%0A%20%20%20%20%7D%0A%20%20%7D%2C%0A%20%20%22icon%22%3A%20%22%22%2C%0A%20%20%22messageToSign%22%3A%20%22%22%2C%0A%20%20%22callToAction%22%3A%20%7B%0A%20%20%20%20%22default%22%3A%20%22Get%20an%20weapon!%22%0A%20%20%7D%0A%7D)!

### How it works

There are 3 elements to the project :

1. Unlock contracts (deployed using the [Unlock hardhat plugin](<[https://npmjs](https://www.npmjs.com/package/@unlock-protocol/hardhat-plugin)>))
2. Multiple "layer" contracts that define each of the layers: avatar, outfit and weapons. These layers are SVG files
3. The "hook" contract that's used to change the tokenUri being rendered on-chain.

### Customizing it

You can take that example and customize pretty easily.
The first step would be to define all the layers you need. Given the gas limit, you will probably need to make sure you have no more than a a half dozen.

Then you would need to create all the json layers and set them in the `scripts/svg` folder. Each layer needs to be in its own folder.

Finally, you would need to change the hook to map all the layer contracts and lock contracts.

Deploy!

### Run the project

```shell
# install deps
yarn # or npm install

# run the script
npx hardhat run scripts/create-lock-with-hook.js
```
