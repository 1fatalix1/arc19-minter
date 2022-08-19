# arc19-minter
Algorand Mass Arc19 Asset Minter

## Disclaimer
* This tool is provided as is. It is your's responsibility to check everything before minting.
* I strongly suggest to mint initial test batch on testnet to make sure the tool is working properly.
* The tool only works with Pinata and therefore uses `template-ipfs://{ipfscid:0:dag-pb:reserve:sha2-256}` ARC19 template that is compatibile with CID0 Pinata provides.

## You will need
* Node
* Visual Studio Code 

## Installation
Once Node and VS Code is installed, simply run below command:
```bash
$ npm install
```
Open the solution in VS Code.

There are several things to configure:
* config.js
  * ASSET_NAME - Common name of all assets
  * ASSET_UNIT_NAME - Common unit name of all assets
  
* index.js
  * MAIN_ACCOUNT_MNEMONIC - your account mnemonic (each word is space separated).
  * MAIN_ACCOUNT_ADDRESS - your account address.
  * PINATA_TOKEN - your Pinata JWT token. You can get it from [Pinata API Keys page](https://app.pinata.cloud/keys).
  * noPinRun - set to true to mint all assets by using creators address as reserve address.
  * dryRun - only outputs to console. Handy to check of everything is working fine.
  * assetsCount - total assets count to be minted. Used to generate sequence numbers of equal length (000001, 000002, 010000, etc.).
  * assetQuantity - normally set to 1 to allow mintin 1/1 assets.
