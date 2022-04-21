// SPDX-License-Identifier: MIT
pragma solidity >=0.5.17 <0.9.0;

import "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV10.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "hardhat/console.sol";
import "./Mapping.sol";
import {BokkyPooBahsDateTimeLibrary} from "./BokkyPooBahsDateTimeLibrary.sol";

/**
 * @notice Functions to be implemented by a tokenURIHook.
 * @dev Lock hooks are configured on the lock contract by calling `setEventHooks` on the lock.
 */
contract Hook {
    address public _avatarLock;
    address public _buntaiLock;
    address public _gundanLock;
    address public _mappingContract;
    string public _avatarIpfsHash;
    string public _buntaiWeaponIpfsHash;
    string public _gundanWeaponIpfsHash;
    uint256 public _totalBuntaiWeapons;
    uint256 public _totalGundanWeapons;

    /**
     * The hook is initialized with each lock contract as well as each layer contract
     */
    constructor(
        address avatarLock,
        address buntaiLock,
        address gundanLock,
        address mappingContract,
        string memory avatarIpfsHash,
        string memory buntaiWeaponIpfsHash,
        string memory gundanWeaponIpfsHash,
        uint256 totalBuntaiWeapons,
        uint256 totalGundanWeapons
    ) {
        _avatarLock = avatarLock;
        _buntaiLock = buntaiLock;
        _gundanLock = gundanLock;
        _mappingContract = mappingContract;
        _avatarIpfsHash = avatarIpfsHash;
        _buntaiWeaponIpfsHash = buntaiWeaponIpfsHash;
        _gundanWeaponIpfsHash = gundanWeaponIpfsHash;
        _totalBuntaiWeapons = totalBuntaiWeapons;
        _totalGundanWeapons = totalGundanWeapons;
    }

    /**
     * Not altering the price by default
     */
    function keyPurchasePrice(
        address, /* from */
        address, /* recipient */
        address, /* referrer */
        bytes calldata /* data */
    ) external view returns (uint256 minKeyPrice) {
        // TODO Let's look at the list?
        return IPublicLock(msg.sender).keyPrice();
    }

    /**
     * When a new key is purchased, we need to grant a weapon
     * Challenge: we
     */
    function onKeyPurchase(
        address, /*from*/
        address recipient,
        address, /*referrer*/
        bytes calldata, /*data*/
        uint256, /*minKeyPrice*/
        uint256 /*pricePaid*/
    ) external {
        if (msg.sender == _avatarLock) {
            // If the sender is the avatar lock
            IPublicLock avatar = IPublicLock(_avatarLock);
            uint256 id = avatar.totalSupply();

            address[] memory recipients = new address[](1);
            recipients[0] = recipient;

            uint256[] memory expirations = new uint256[](1);
            expirations[0] = type(uint256).max; // Not expiring!

            address[] memory managers = new address[](1);
            managers[0] = recipient;

            if (id % 2 == 0) {
                IPublicLock(_buntaiLock).grantKeys(
                    recipients,
                    expirations,
                    managers
                );
            } else {
                IPublicLock(_gundanLock).grantKeys(
                    recipients,
                    expirations,
                    managers
                );
            }
        }
    }

    struct NFTInfo {
        string image;
        string kind;
        string moment;
        uint256 weapon;
        string class;
    }

    function getClassMapping(string memory faction, uint256 weapon)
        internal
        pure
        returns (string memory class)
    {
        bool foundWeapon = false;
        if (weapon == 0) return "Class-less";
        if (compareStrings(faction, "buntai")) {
            uint8[8] memory buntaiRogue = [5, 8, 12, 17, 31, 37, 38, 40];
            uint8[8] memory buntaiHunter = [1, 13, 21, 23, 25, 30, 33, 36];
            uint8[16] memory buntaiWarrior = [
                2,
                3,
                4,
                7,
                9,
                10,
                11,
                14,
                15,
                27,
                32,
                34,
                35,
                39,
                41,
                43
            ];
            uint8[13] memory buntaiEvoker = [
                6,
                16,
                18,
                19,
                20,
                22,
                24,
                26,
                28,
                29,
                42,
                44,
                45
            ];
            for (uint8 i = 0; i < buntaiRogue.length; i++) {
                if (weapon == buntaiRogue[i]) {
                    class = "Rogue";
                    foundWeapon = true;
                }
            }
            if (foundWeapon == false) {
                for (uint8 i = 0; i < buntaiHunter.length; i++) {
                    if (weapon == buntaiHunter[i]) {
                        class = "Hunter";
                        foundWeapon = true;
                    }
                }

                if (foundWeapon == false) {
                    for (uint8 i = 0; i < buntaiEvoker.length; i++) {
                        if (weapon == buntaiEvoker[i]) {
                            class = "Evoker";
                            foundWeapon = true;
                        }
                    }

                    if (foundWeapon == false) {
                        for (uint8 i = 0; i < buntaiWarrior.length; i++) {
                            if (weapon == buntaiWarrior[i]) {
                                class = "Warrior";
                                foundWeapon = true;
                            }
                        }

                        if (foundWeapon == false) {
                            class = "Class-less";
                        }
                    }
                }
            }
        } else {
            uint8[9] memory gundanRogue = [1, 2, 3, 4, 9, 11, 15, 23, 34];
            uint8[6] memory gundanHunter = [5, 8, 12, 18, 30, 38];
            uint8[18] memory gundanWarrior = [
                6,
                7,
                10,
                14,
                17,
                19,
                20,
                22,
                24,
                26,
                27,
                28,
                29,
                33,
                36,
                37,
                39,
                40
            ];
            uint8[5] memory gundanMachnimer = [13, 16, 21, 31, 35];
            
            for (uint8 i = 0; i < gundanRogue.length; i++) {
                if (weapon == gundanRogue[i]) {
                    class = "Rogue";
                    foundWeapon = true;
                }
            }
            if (foundWeapon == false) {
                for (uint8 i = 0; i < gundanHunter.length; i++) {
                    if (weapon == gundanHunter[i]) {
                        class = "Hunter";
                        foundWeapon = true;
                    }
                }

                if (foundWeapon == false) {
                    for (uint8 i = 0; i < gundanMachnimer.length; i++) {
                        if (weapon == gundanMachnimer[i]) {
                            class = "Machnimer";
                            foundWeapon = true;
                        }
                    }

                    if (foundWeapon == false) {
                        for (uint8 i = 0; i < gundanWarrior.length; i++) {
                            if (weapon == gundanWarrior[i]) {
                                class = "Warrior";
                                foundWeapon = true;
                            }
                        }

                        if (foundWeapon == false) {
                            class = "Class-less";
                        }
                    }
                }
            }
        }
        return class;
    }

    function compareStrings(string memory a, string memory b)
        internal
        pure
        returns (bool)
    {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }

    // see https://github.com/unlock-protocol/unlock/blob/master/smart-contracts/contracts/interfaces/hooks/IHook.sol
    function tokenURI(
        address lockAddress,
        address, // operator, // We could alter the rendering based on _who_ is viewing!
        address owner,
        uint256 keyId,
        uint256 //expirationTimestamp //  a cool trick could be to render based on how far the expiration of the key is!
    ) external view returns (string memory) {
        require(owner != address(0), "Not owned...");
        NFTInfo memory nftInfo;
        nftInfo.image = "";
        nftInfo.kind = "";
        nftInfo.moment = "night";
        nftInfo.weapon = 0;
        nftInfo.class = "Class-less";

        string memory json = "";
        if (lockAddress == _buntaiLock) {
            nftInfo.kind = "buntai";
            nftInfo.weapon = keyId % _totalBuntaiWeapons;
            // Loop back when modulo is 0!
            if (nftInfo.weapon == 0) {
                nftInfo.weapon = _totalBuntaiWeapons;
            }
            nftInfo.image = string(
                abi.encodePacked(
                    _buntaiWeaponIpfsHash,
                    "/",
                    Strings.toString(nftInfo.weapon),
                    ".svg"
                )
            );
            nftInfo.class = getClassMapping("buntai", nftInfo.weapon);
            json = string(
                abi.encodePacked(
                    '{ "image": "',
                    nftInfo.image,
                    '", "attributes": [ {"trait_type": "faction", "value": "',
                    nftInfo.kind,
                    '"}, {"trait_type": "class", "value": "',
                    nftInfo.class,
                    '"}], "description": "Tales of Elatora is a community-driven fantasy world, written novel and an RPG. This ToE NFT grants access to the story, the game, the community and gives the holder voting rights. https://talesofelatora.com/", "external_url":"https://talesofelatora.com/", "name": "Tales of Elatora Weapon',
                    Strings.toString(nftInfo.weapon),
                    '"}'
                )
            );
        } else if (lockAddress == _gundanLock) {
            nftInfo.kind = "gundan";
            nftInfo.weapon = keyId % _totalGundanWeapons;
            // Loop back when modulo is 0!
            if (nftInfo.weapon == 0) {
                nftInfo.weapon = _totalGundanWeapons;
            }
            nftInfo.image = string(
                abi.encodePacked(
                    _gundanWeaponIpfsHash,
                    "/",
                    Strings.toString(nftInfo.weapon),
                    ".svg"
                )
            );
            nftInfo.class = getClassMapping("gundan", nftInfo.weapon);
            json = string(
                abi.encodePacked(
                    '{ "image": "',
                    nftInfo.image,
                    '", "attributes": [ {"trait_type": "faction", "value": "',
                    nftInfo.kind,
                    '"}, {"trait_type": "class", "value": "',
                    nftInfo.class,
                    '"}], "description": "Tales of Elatora is a community-driven fantasy world, written novel and an RPG. This ToE NFT grants access to the story, the game, the community and gives the holder voting rights. https://talesofelatora.com/", "external_url":"https://talesofelatora.com/", "name": "Tales of Elatora Weapon ',
                    Strings.toString(nftInfo.weapon),
                    '"}'
                )
            );
        } else if (lockAddress == _avatarLock) {
            uint256 timeOfDay = 0;
            (, , , uint256 hour, , ) = BokkyPooBahsDateTimeLibrary
                .timestampToDateTime(block.timestamp);
            if (hour <= 8) {
                timeOfDay = 0; // 0 => night
            } else if (hour <= 17) {
                timeOfDay = 1; // 1 => day
                nftInfo.moment = "day";
            } else if (hour <= 21) {
                timeOfDay = 2; // 2 => sunset
                nftInfo.moment = "sunset";
            } else {
                timeOfDay = 0; // 0 => night
            }

            Mapping m = Mapping(_mappingContract);
            uint256 weaponId = m.avatarsWeapons(keyId);

            if (keyId % 2 == 0) {
                nftInfo.kind = "buntai";
                IPublicLock buntaiContract = IPublicLock(_buntaiLock);
                    
                if (weaponId == 0) {
                    weaponId = keyId / 2;
                }
                if (buntaiContract.ownerOf(weaponId) == owner) {
                    nftInfo.weapon = weaponId % _totalBuntaiWeapons;                 
                    // Loop back when modulo is 0!
                    if (nftInfo.weapon == 0) {
                        nftInfo.weapon = _totalBuntaiWeapons;
                    }
                    nftInfo.class = getClassMapping("buntai", nftInfo.weapon);
                }
            } else {
                nftInfo.kind = "gundan";
                IPublicLock gundanContract = IPublicLock(_gundanLock);
                if (weaponId == 0) {
                    weaponId = (keyId + 1) / 2;
                }
                if (gundanContract.ownerOf(weaponId) == owner) {
                    nftInfo.weapon = weaponId % _totalGundanWeapons;
                    // Loop back when modulo is 0!
                    if (nftInfo.weapon == 0) {
                        nftInfo.weapon = _totalGundanWeapons;
                    }
                    nftInfo.class = getClassMapping("gundan", nftInfo.weapon);
                }
            }

            nftInfo.image = string(
                abi.encodePacked(
                    _avatarIpfsHash,
                    "/",
                    Strings.toString(keyId),
                    "-",
                    Strings.toString(nftInfo.weapon),
                    "-",
                    Strings.toString(timeOfDay),
                    ".svg"
                )
            );
            json = string(
                abi.encodePacked(
                    '{ "image": "',
                    nftInfo.image,
                    '", "attributes": [ {"trait_type": "faction", "value": "',
                    nftInfo.kind,
                    '"},  {"trait_type": "momentOfDay", "value": "',
                    nftInfo.moment,
                    '"},  {"trait_type": "class", "value": "',
                    nftInfo.class,
                    '"}], "description": "Tales of Elatora is a community-driven fantasy world, written novel and an RPG. This ToE NFT grants access to the story, the game, the community and gives the holder voting rights. https://talesofelatora.com/", "external_url":"https://talesofelatora.com/", "name": "Tales of Elatora Avatar ',
                    Strings.toString(keyId),
                    '"}'
                )
            );
        }

        // render the base64 encoded json metadata
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(abi.encodePacked(json)))
                )
            );
    }
}
