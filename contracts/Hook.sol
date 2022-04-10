// SPDX-License-Identifier: MIT
pragma solidity >=0.5.17 <0.9.0;

// TODO change me to v10!
import "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV9.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "hardhat/console.sol";
import "./Layer.sol";
import { BokkyPooBahsDateTimeLibrary } from "./BokkyPooBahsDateTimeLibrary.sol";

/**
 * @notice Functions to be implemented by a tokenURIHook.
 * @dev Lock hooks are configured on the lock contract by calling `setEventHooks` on the lock.
 */
contract Hook {
    address public _avatarLock;
    address public _weaponLock;
    string public _ipfsHash;
    mapping(uint => uint) public avatarsWeapons;

    /**
     * The hook is initialized with each lock contract as well as each layer contract
     */
    constructor(
        address avatarLock,
        address weaponLock,
        string memory ipfsHash
    ) {
        _avatarLock = avatarLock;
        _weaponLock = weaponLock;
        _ipfsHash = ipfsHash;
    }

    /**
     * Not altering the price by default
     */
    function keyPurchasePrice(
        address, /* from */
        address recipient, /* recipient */
        address, /* referrer */
        bytes calldata /* data */
    ) external view returns (uint256 minKeyPrice) {
        return IPublicLockV9(recipient).keyPrice();
    }

    /**
     *
     */
    function onKeyPurchase(
        address, /*from*/
        address recipient,
        address, /*referrer*/
        bytes calldata, /*data*/
        uint256, /*minKeyPrice*/
        uint256 /*pricePaid*/
    ) external {
        IPublicLockV9 weapon = IPublicLockV9(_weaponLock);
        uint expirationDuration = weapon.expirationDuration();
        address[] memory recipients;
        recipients[0] = recipient;
        uint[] memory expirations;
        expirations[0] = expirationDuration;
        address[] memory managers;
        managers[0] = recipient;
        weapon.grantKeys(recipients, expirations, managers);

        uint numberOfKeys = weapon.balanceOf(recipient); 
        uint keyId = weapon.tokenOfOwnerByIndex(recipient, numberOfKeys);
        // Let's get the tokenId


        // This should grant a weapon to the recipient!
        // and set the 
//         function grantKeys(
//     address[] calldata _recipients,
//     uint[] calldata _expirationTimestamps,
//     address[] calldata _keyManagers
//   )
    }


    // see https://github.com/unlock-protocol/unlock/blob/master/smart-contracts/contracts/interfaces/hooks/IHook.sol
    function tokenURI(
        address lockAddress,
        address, // operator, // We could alter the rendering based on _who_ is viewing!
        address owner,
        uint256 keyId,
        uint256 //expirationTimestamp //  a cool trick could be to render based on how far the expiration of the key is!
    ) external view returns (string memory) {
        uint timeOfDay = 0;
        string memory kind = "";
        string memory image = "";

        (, , , uint hour, , ) = BokkyPooBahsDateTimeLibrary.timestampToDateTime(block.timestamp);
        if (hour <= 8) {
            timeOfDay = 0; // 0 => night
        } else if (hour <= 17) {
            timeOfDay = 1; // 1 => day
        } else if (hour <= 21) {
            timeOfDay = 2; // 2 => sunset
        } else {
            timeOfDay = 0; // 0 => night
        }

        // If the calling contract is the avatar contract
        if (lockAddress == _avatarLock) {
            kind = "avatars";
            uint weapon = 0;
            // Check if there is a mapping!
            if (avatarsWeapons[keyId] > 0) {
                // If there is one, let's check the owner and make sure it's the correct one
                IPublicLockV9 weaponLock = IPublicLockV9(_weaponLock);
                // TODO change me in v10!
                uint weaponExpiration = weaponLock.keyExpirationTimestampFor(owner);
                address weaponOwner = weaponLock.ownerOf(keyId);
                if (weaponExpiration > block.timestamp && weaponOwner == owner) {
                    weapon = avatarsWeapons[keyId];
                }
            }

            image = string(
                abi.encodePacked(
                    _ipfsHash,
                    "/",
                    kind,
                    "/",
                    Strings.toString(keyId),
                    "-",
                    Strings.toString(weapon),
                    "-",
                    Strings.toString(timeOfDay)
                )
            );
        }
        else if (lockAddress == _weaponLock) {
            kind = "weapons";

            image = string(
                abi.encodePacked(
                    _ipfsHash,
                    "/",
                    kind,
                    "/",
                    Strings.toString(keyId)
                )
            );

        }


        // create the json that includes the image
        // We need to include more properties!
        string memory json = string(
            abi.encodePacked('{"image":"', image, '"}')
        );

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
