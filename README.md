# arc19-minter

Algorand Mass Arc19 Asset Minter

## Disclaimer

- This tool is provided as is. It is your responsibility to check everything before minting.
- I strongly suggest to mint initial test batch on testnet to make sure the tool is working properly.
- The tool works with Pinata and therefore uses `template-ipfs://{ipfscid:0:dag-pb:reserve:sha2-256}` ARC19 template that is compatibile with CID0 Pinata provides.
- The tool works with web3.storage and therefore uses `template-ipfs://{ipfscid:1:raw:reserve:sha2-256}` ARC19 template that is compatibile with CID1 web3.storage provides.

## You will need

- Node
- Visual Studio Code

## Installation

Once Node and VS Code are installed, simply run below command:

```bash
$ npm install
```

Open the solution in VS Code.

<strong>All lines commented with `// edit this` are the only places you should change if needed.</strong>

There are several things to configure:

- config.js

  - ASSET_NAME - Common name of all assets
  - ASSET_UNIT_NAME - Common unit name of all assets

- you have two options to store your wallet address and mnemonic and pinning services tokens:

  - either create `.env` file (this file has no name only extension) in the root of the solution, then paste the below and fill the respective fields with your mnemonic, wallet address and pinnig services tokens.

  ```bash
  MAIN_ACCOUNT_MNEMONIC = ""
  MAIN_ACCOUNT_ADDRESS = ""
  PINATA_TOKEN = ""
  WEB3STORAGE_TOKEN = ""
  ```

  - follow the instructions below and put your secrets in the main `index.js` file.

- index.js
  - MAIN_ACCOUNT_MNEMONIC - your account mnemonic (each word is space separated).<br />
    <strong>By default it uses `.env` file to get the data. See instructions in previous section.</strong>
  - MAIN_ACCOUNT_ADDRESS - your account address.<br />
    <strong>By default it uses `.env` file to get the data. See instructions in previous section.</strong>
  - PINATA_TOKEN - your Pinata JWT token. You can get it from [Pinata API Keys page](https://app.pinata.cloud/keys). Set it only if you are using Pinata as pinning a service.<br />
    <strong>By default it uses `.env` file to get the data. See instructions in previous section.</strong>
  - WEB3STORAGE_TOKEN - your web3.storage JWT token. You can get it from [web3.storage API Keys page](https://web3.storage/tokens). Set it only if you are using web3.storage as pinning a service.<br />
    <strong>By default it uses `.env` file to get the data. See instructions in previous section.</strong>
  - COMPANY - Set your own company name that will be used when using pinata pinning service.
  - pinningService - set it to either `pinningServices.PINATA` or `pinningServices.WEB3STORAGE`. Default value is `pinningServices.PINATA`
  - minterMode - can be either `combineMetadata`, `create`, `pin` or `update`
  - noPinRun - set to true to mint all assets without pinning images, by using creator's address as reserve address.
  - dryRun - Simulates blockchain transactions and only outputs to console. Handy to check if everything is working fine.
  - assetsCount - total assets count to be minted. Used to generate sequence numbers of equal length (000001, 000002, 010000, etc.).
  - assetQuantity - normally set to 1 to allow minting 1/1 assets.
  - assetStartOffset - starting asset number to use in case you need to restart your process from specific number.
  - assetEndOffset - ending asset number to use in case you need to restart your process up to a specific number.

All your images will have to be copied to assetsImages folder and need to have associated arc69 json file.

```bash
assetsImages/
0001.png
0001.json
0002.png
0002.json
...
```

The tool will iterate through assetsImages files and attempt to pin each image to your selected pinning service.

Next after obtaining a valid CID it will attempt to mint an asset using that CID and json file arc69 metadata.

## Different modes by using `minterMode` variable

The minter supports four different modes of operation:

1. `combineMetadata`

   - Combines all JSON metadata files into a single file
   - Creates `combinedMetadata.json` in the root directory
   - Useful for archiving or checking all metadata in one place

2. `create`

   - Main mode for initial asset creation
   - Mints new assets using the provided PNG files and JSON metadata
   - Creates `results.json` containing asset details including:
     - Asset IDs
     - IPFS hashes
     - Reserve addresses
     - File paths

3. `pin`

   - Used to pin images to IPFS without minting
   - Updates `results.json` with IPFS hashes and reserve addresses
   - Helpful when separating pinning and minting into separate steps
   - Can recover from failed pinning attempts

4. `update`
   - Updates existing assets' metadata using `results.json`
   - Useful for revealing collections or updating metadata
   - Processes assets in groups of 16 transactions

If you have any problems, feel free to get in touch with me.

Pull requests are welcome.
