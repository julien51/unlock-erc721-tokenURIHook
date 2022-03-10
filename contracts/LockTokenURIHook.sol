// SPDX-License-Identifier: MIT
pragma solidity >=0.5.17 <0.9.0;

import "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV9.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "hardhat/console.sol";
import "./Layer.sol";

/**
 * @notice Functions to be implemented by a tokenURIHook.
 * @dev Lock hooks are configured by calling `setEventHooks` on the lock.
 */
contract LockTokenURIHook {
    address _avatarContract;
    address _weaponContract;
    address _outfitContract;
    address _avatarLayerContract;
    address _weaponLayerContract;
    address _outfitLayerContract;

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
        address, // operator,
        address owner, // owner,
        uint256 keyId,
        uint256 //expirationTimestamp
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

        if (lockAddress == _avatarContract) {
            bool hasAvatar = avatarContract.getHasValidKey(owner);
            if (hasAvatar) {
                avatarLayer = avatarLayerContract.getLayer(
                    keyId % avatarLayerContract.getLayerCount()
                );
            }
        }

        if (lockAddress == _weaponContract || lockAddress == _avatarContract) {
            bool hasWeapon = weaponContract.getHasValidKey(owner);
            if (hasWeapon) {
                weaponLayer = weaponLayerContract.getLayer(
                    keyId % weaponLayerContract.getLayerCount()
                );
            }
        }

        if (lockAddress == _outfitContract || lockAddress == _avatarContract) {
            bool hasOutfit = outfit.getHasValidKey(owner);
            if (hasOutfit) {
                outfitLayer = outfitLayerContract.getLayer(
                    keyId % outfitLayerContract.getLayerCount()
                );
            }
        }

        // draw svg
        string memory svg = string(
            abi.encodePacked(
                '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">',
                avatarLayer,
                outfitLayer,
                weaponLayer,
                "</svg>"
            )
        );

        string memory image = string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(bytes(abi.encodePacked(svg)))
            )
        );

        string memory json = string(
            abi.encodePacked('{"image":"', image, '"}')
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(abi.encodePacked(json)))
                )
            );
    }
}
