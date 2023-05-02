# arc19-minter
Algorand Mass Arc19 Asset Minter

## Disclaimer
* This tool is provided as is. It is your responsibility to check everything before minting.
* I strongly suggest to mint initial test batch on testnet to make sure the tool is working properly.
* The tool works with Pinata and therefore uses `template-ipfs://{ipfscid:0:dag-pb:reserve:sha2-256}` ARC19 template that is compatibile with CID0 Pinata provides.
* The tool works with web3.storage and therefore uses `template-ipfs://{ipfscid:1:raw:reserve:sha2-256}` ARC19 template that is compatibile with CID1 web3.storage provides.

## You will need
* Node
* Visual Studio Code 

## Installation
Once Node and VS Code are installed, simply run below command:
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
  * PINATA_TOKEN - your Pinata JWT token. You can get it from [Pinata API Keys page](https://app.pinata.cloud/keys). Set it only if you are using Pinata as pinning a service.
  * WEB3STORAGE_TOKEN - your web3.storage JWT token. You can get it from [web3.storage API Keys page](https://web3.storage/tokens). Set it only if you are using web3.storage as pinning a service.
  * pinningService - set it to either `pinningServices.PINATA` or `pinningServices.WEB3STORAGE`. Default value is `pinningServices.PINATA`
  * noPinRun - set to true to mint all assets by using creator's address as reserve address.
  * dryRun - only outputs to console. Handy to check if everything is working fine.
  * assetsCount - total assets count to be minted. Used to generate sequence numbers of equal length (000001, 000002, 010000, etc.).
  * assetQuantity - normally set to 1 to allow minting 1/1 assets.
  
All your images will have to be copied to assetsImages folder and need to have associated arc69 json file (check the sample attached).

The tool will iterate through assetsImages files and attempt to pin each image to Pinata.

Next after obtaining a valid CID it will attempt to mint an asset using that CID and json file arc69 metadata.

If you have any problems, feel free to get in touch with me.

Pull requests are welcome.

