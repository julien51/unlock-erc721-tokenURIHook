// SPDX-License-Identifier: MIT
pragma solidity >=0.5.17 <0.9.0;

import "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV9.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "hardhat/console.sol";
import "./Layer.sol";

/**
 * @notice Functions to be implemented by a tokenURIHook.
 * @dev Lock hooks are configured on the lock contract by calling `setEventHooks` on the lock.
 */
contract LockTokenURIHook {
    address _avatarContract;
    address _weaponContract;
    address _outfitContract;
    address _avatarLayerContract;
    address _weaponLayerContract;
    address _outfitLayerContract;

    /**
     * The hook is initialized with each lock contract as well as each layer contract
     */
    constructor(
        address avatarContract,
        address weaponContract,
        address outfitContract,
        address avatarLayerContract,
        address weaponLayerContract,
        address outfitLayerContract
    ) public {
        _avatarContract = avatarContract;
        _weaponContract = weaponContract;
        _outfitContract = outfitContract;
        _avatarLayerContract = avatarLayerContract;
        _weaponLayerContract = weaponLayerContract;
        _outfitLayerContract = outfitLayerContract;
    }

    // see https://github.com/unlock-protocol/unlock/blob/master/smart-contracts/contracts/interfaces/hooks/ILockTokenURIHook.sol
    function tokenURI(
        address lockAddress,
        address, // operator, // We could alter the rendering based on _who_ is viewing!
        address owner, // owner,
        uint256 keyId,
        uint256 //expirationTimestamp //  a cool trick could be to render based on how far the expiration of the key is!
    ) external view returns (string memory) {
        string memory avatarLayer;
        string memory weaponLayer;
        string memory outfitLayer;

        IPublicLockV9 avatarContract = IPublicLockV9(_avatarContract);
        IPublicLockV9 weaponContract = IPublicLockV9(_weaponContract);
        IPublicLockV9 outfit = IPublicLockV9(_outfitContract);
        Layer avatarLayerContract = Layer(_avatarLayerContract);
        Layer weaponLayerContract = Layer(_weaponLayerContract);
        Layer outfitLayerContract = Layer(_outfitLayerContract);

        // If the calling contract is the avatar contract
        // and if the caller has a valid avatar, we render it!
        if (lockAddress == _avatarContract) {
            bool hasAvatar = avatarContract.getHasValidKey(owner);
            if (hasAvatar) {
                avatarLayer = avatarLayerContract.getLayer(
                    keyId % avatarLayerContract.getLayerCount()
                );
            }
        }

        // If the calling contract is the weapon contract or the avatar contract
        // and if the caller has a valid avatar, we render it!
        if (lockAddress == _weaponContract || lockAddress == _avatarContract) {
            bool hasWeapon = weaponContract.getHasValidKey(owner);
            if (hasWeapon) {
                weaponLayer = weaponLayerContract.getLayer(
                    keyId % weaponLayerContract.getLayerCount()
                );
            }
        }

        // If the calling contract is the outfit contract or the avatar contract
        // and if the caller has a valid avatar, we render it!
        if (lockAddress == _outfitContract || lockAddress == _avatarContract) {
            bool hasOutfit = outfit.getHasValidKey(owner);
            if (hasOutfit) {
                outfitLayer = outfitLayerContract.getLayer(
                    keyId % outfitLayerContract.getLayerCount()
                );
            }
        }

        // draw svg by combining all layers
        string memory svg = string(
            abi.encodePacked(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">',
                avatarLayer,
                outfitLayer,
                weaponLayer,
                "</svg>"
            )
        );

        // create the data uri for the image itself
        string memory image = string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(bytes(abi.encodePacked(svg)))
            )
        );

        // create the json that includes the image
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
