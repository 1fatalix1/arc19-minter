let fs = require("fs");
let path = require("path");
const conf = require("./config.js");
var FormData = require("form-data");
const algosdk = require("algosdk");
const axios = require("axios");
const multihash = require("multihashes");
const cid = require("cids");
let encoder = new TextEncoder();
let mainPath = path.resolve(__dirname);
let assetsPath = path.join(mainPath, "assetsImages");
let Web3Storage = require("web3.storage");
require("dotenv").config();

//select the correct algorand network to use
let network = "mainnet";

let algodClient = new algosdk.Algodv2(
  network === "testnet" ? conf.NODE_TOKEN_TESTNET : conf.NODE_TOKEN,
  network === "testnet" ? conf.NODE_ENDPOINT_TESTNET : conf.NODE_ENDPOINT,
  network === "testnet"
    ? conf.NODE_ENDPOINT_PORT_TESTNET
    : conf.NODE_ENDPOINT_PORT
);

const MAIN_ACCOUNT_MNEMONIC = process.env.MAIN_ACCOUNT_MNEMONIC; // edit this or create .env file
const MAIN_ACCOUNT_ADDRESS = process.env.MAIN_ACCOUNT_ADDRESS; // edit this or create .env file
const PINATA_TOKEN = process.env.PINATA_TOKEN; // edit this or create .env file
const WEB3STORAGE_TOKEN = process.env.WEB3STORAGE_TOKEN; // edit this or create .env file
const COMPANY = "Studio SEV3N"; // edit this

//pinning service
const pinningServices = {
  PINATA: "pinata",
  WEB3STORAGE: "web3.storage",
};
const pinningService = pinningServices.PINATA; // edit this

const UNREVEALED_COLLECTION = true; // edit this
const UNREVEALED_ARC3_CID = "QmVQubGnUDC8ErLpqjy2XBC1sDjUBKexiV6mtmzc5x8Aa5"; // edit this
const RESULTS_FILE_NAME = "results.json"; // edit this

// minter mode can be either combineMetadata, create, pinImage, pinArc3 or update
let minterMode = "pinArc3"; // edit this
// does not pin uses creators address as reserve
let noPinRun = true; // edit this
// does not mint just logs output
let dryRun = true; // edit this
// used to calculate unitname index and asset name index
let assetsCount = 999; // edit this
// quantity of each asset to mint
let assetQuantity = 1; // edit this
// asset offset to start processing
let assetStartOffset = 1; // edit this
// asset offset to end processing
let assetEndOffset = 999; // edit this

var start = async function () {
  // Add configuration validation
  if (!MAIN_ACCOUNT_MNEMONIC || !MAIN_ACCOUNT_ADDRESS) {
    console.log(
      "Configuration Error: MAIN_ACCOUNT_MNEMONIC and MAIN_ACCOUNT_ADDRESS are required. Please check your .env file."
    );
    process.exit(1);
  }

  if (pinningService === pinningServices.PINATA && !PINATA_TOKEN) {
    console.log(
      "Configuration Error: PINATA_TOKEN is required when using Pinata service. Please check your .env file."
    );
    process.exit(1);
  }

  if (pinningService === pinningServices.WEB3STORAGE && !WEB3STORAGE_TOKEN) {
    console.log(
      "Configuration Error: WEB3STORAGE_TOKEN is required when using Web3.Storage service. Please check your .env file."
    );
    process.exit(1);
  }

  let template = "";
  if (pinningService === pinningServices.PINATA)
    template = conf.ARC19_TEMPLATE_PINATA;
  if (pinningService === pinningServices.WEB3STORAGE)
    template = conf.ARC19_TEMPLATE_WEB3STORAGE;
  let mainAccountMnemonic = algosdk.mnemonicToSecretKey(MAIN_ACCOUNT_MNEMONIC);

  if (minterMode === "combineMetadata") {
    console.log("Minter running in combine metadata mode.");
    console.log(
      "This mode will load all json metadata files, combine them into a single array and save it as a single json file."
    );
    let results = [];
    let files = fs.readdirSync(assetsPath);
    let jsons = files
      .filter((x) => x.endsWith(".json"))
      .sort((one, two) => (one < two ? -1 : 1));
    for (let indexFile = 1; indexFile <= assetsCount; indexFile++) {
      let filePathJson = path.join(assetsPath, jsons[indexFile - 1]);
      let arc69 = require(filePathJson);
      results.push(arc69);
    }
    fs.writeFileSync(
      path.join(mainPath, "combinedMetadata.json"),
      JSON.stringify(results, null, 2)
    );

    process.exit();
  } else if (minterMode === "create") {
    console.log("Minter running in create mode.");
    console.log(
      `Minter running with assetStartOffset: ${assetStartOffset} and assetEndOffset ${assetEndOffset} meaning it will start processing from asset number ${assetStartOffset} to ${assetEndOffset}.`
    );
    if (noPinRun) {
      console.log(
        `Minter running with noPinRun: true, meaning it won't pin any images and will use the creator's ${MAIN_ACCOUNT_ADDRESS} address as reserve.`
      );
    } else {
      console.log(
        `Minter running with noPinRun: false, meaning it will pin images and use the pinned IPFS hash as reserve. It will use the ${pinningService} service for pinning.`
      );
    }
    if (dryRun) {
      console.log(
        `Minter running with dryRun: true, meaning it will simulate sending transactions and will only log the output.`
      );
    } else {
      console.log(
        `Minter running with dryRun: false, meaning it will send transactions to update the assets.`
      );
    }

    let results = [];

    let files = fs.readdirSync(assetsPath);
    let images = files
      .filter((x) => x.endsWith(".png"))
      .sort((one, two) => (one < two ? -1 : 1));
    let jsons = files
      .filter((x) => x.endsWith(".json"))
      .sort((one, two) => (one < two ? -1 : 1));
    for (
      let indexFile = assetStartOffset;
      indexFile <= assetEndOffset;
      indexFile++
    ) {
      let result = {};
      results.push(result);
      let filePathImage = path.join(assetsPath, images[indexFile - 1]);
      let filePathJson = path.join(assetsPath, jsons[indexFile - 1]);

      let assetSeq = "#";
      assetSeq += addZeros(
        assetsCount.toString().length - indexFile.toString().length
      );
      assetSeq += indexFile;

      let assetUnitName = `${conf.ASSET_UNIT_NAME}${assetSeq}`;
      let assetName = `${conf.ASSET_NAME} ${assetSeq}`;

      console.log("File Path Image: " + filePathImage);
      console.log("File Path Json: " + filePathJson);
      console.log("Asset Unit Name: " + assetUnitName);
      console.log("Asset Name: " + assetName);
      console.log("Quantity: " + assetQuantity);
      console.log("Asset Unit Name Length: " + assetUnitName.length);
      console.log("Asset Name Length: " + assetName.length);

      if (UNREVEALED_COLLECTION === true) {
        if (UNREVEALED_ARC3_CID === undefined) {
          console.log(
            "Configuration Error: UNREVEALED_IMAGE_CID is required when UNREVEALED_COLLECTION is set to true. Please set a valid CID in the configuration."
          );
          process.exit(1);
        }
      }

      let reserve = noPinRun === true ? MAIN_ACCOUNT_ADDRESS : undefined;
      result.ipfsHashImage = undefined;
      result.reserveImage = undefined;
      result.ipfsHashArc3 = undefined;
      result.reserveArc3 = reserve;
      if (UNREVEALED_COLLECTION === true) {
        reserve = algosdk.encodeAddress(
          multihash.decode(new cid(UNREVEALED_ARC3_CID).multihash).digest
        );
        result.ipfsHashArc3 = UNREVEALED_ARC3_CID;
        result.reserveArc3 = reserve;
        console.log("Unrevealed reserve address: " + reserve);
      } else {
        let arc3Json = require(filePathJson);
        console.log("ARC3 data: " + JSON.stringify(arc3Json, null, 2));
        if (noPinRun === false) {
          let ipfsHashImage = await pin(assetUnitName, filePathImage, "png");
          if (ipfsHashImage === undefined) {
            console.log(
              "Error pinning image! Saving current work and stopping..."
            );
            fs.writeFileSync(
              path.join(mainPath, RESULTS_FILE_NAME),
              JSON.stringify(results, null, 2)
            );
            process.exit(1);
          }
          reserve = algosdk.encodeAddress(
            multihash.decode(new cid(ipfsHashImage).multihash).digest
          );
          result.ipfsHashImage = ipfsHashImage;
          result.reserveImage = reserve;

          arc3Json.image = `ipfs://${result.ipfsHashImage}`;

          fs.writeFileSync(
            filePathJson,
            JSON.stringify(arc3Json, null, 2)
          );

          let ipfsHashArc3 = await pin(assetUnitName, filePathJson, "json");
          if (ipfsHashArc3 === undefined) {
            console.log(
              "Error pinning arc3! Saving current work and stopping..."
            );
            fs.writeFileSync(
              path.join(mainPath, RESULTS_FILE_NAME),
              JSON.stringify(results, null, 2)
            );
            process.exit(1);
          }
          reserve = algosdk.encodeAddress(
            multihash.decode(new cid(ipfsHashArc3).multihash).digest
          );
          result.ipfsHashArc3 = ipfsHashArc3;
          result.reserveArc3 = reserve;
        }
      }
      let tx = await createAssetCreateTransaction(
        MAIN_ACCOUNT_ADDRESS,
        undefined,//TODO add option to save arc69
        assetName,
        assetUnitName,
        template,
        assetQuantity,
        MAIN_ACCOUNT_ADDRESS,
        reserve
      );

      let txSigned = tx.signTxn(mainAccountMnemonic.sk);
      try {
        if (dryRun === true) {
          const txRes = await algodClient
            .simulateRawTransactions(txSigned)
            .do();
          console.log("sending tx: ", txRes);
          result.assetIndex =
            txRes.txnGroups[0].txnResults[0].txnResult.assetIndex.toString();
          result.filePathImage = filePathImage;
          result.filePathJson = filePathJson;
        } else {
          let txRes = await algodClient.sendRawTransaction(txSigned).do();
          // Wait for transaction to be confirmed
          let confirmedTxn = await algosdk.waitForConfirmation(
            algodClient,
            txRes.txid,
            6
          );
          console.log("confirmed tx: ", confirmedTxn);
          result.assetIndex = confirmedTxn.assetIndex.toString();
          result.filePathImage = filePathImage;
          result.filePathJson = filePathJson;
        }
      } catch (err) {
        console.log(err.message);
        console.log(
          "Error sending transaction! Saving current work and stopping..."
        );
        fs.writeFileSync(
          path.join(mainPath, RESULTS_FILE_NAME),
          JSON.stringify(results, null, 2)
        );
        process.exit(1);
      }
    }
    fs.writeFileSync(
      path.join(mainPath, RESULTS_FILE_NAME),
      JSON.stringify(results, null, 2)
    );

    process.exit();
  } else if (minterMode === "pinImage") {
    console.log("Minter running in pin image mode");
    console.log(
      `It will use ${RESULTS_FILE_NAME} created in create mode to update it with IPFS hash and reserve address for each asset's image data.`
    );
    console.log(
      `Minter running with assetStartOffset: ${assetStartOffset} and assetEndOffset ${assetEndOffset} meaning it will start processing from asset number ${assetStartOffset} to ${assetEndOffset}.`
    );
    if (noPinRun) {
      console.log(
        `Minter running with noPinRun: true, meaning it won't pin any images and will use the creator's ${MAIN_ACCOUNT_ADDRESS} address as reserve.`
      );
    } else {
      console.log(
        `Minter running with noPinRun: false, meaning it will pin images and use the pinned IPFS hash as reserve. It will use the ${pinningService} service for pinning. It will save both the IPFS hash and reserve address in ${RESULTS_FILE_NAME}.`
      );
    }

    let results = require(path.join(mainPath, RESULTS_FILE_NAME));
    for (
      let indexFile = assetStartOffset;
      indexFile <= assetEndOffset;
      indexFile++
    ) {
      let result = results[indexFile - 1];
      let filePathImage = result.filePathImage;

      let reserve = noPinRun === true ? MAIN_ACCOUNT_ADDRESS : undefined;
      result.ipfsHashImage = undefined;
      result.reserveImage = reserve;
      if (noPinRun === false) {
        let assetUnitName = path.basename(filePathImage, ".png");
        let ipfsHash = await pin(assetUnitName, filePathImage, "png");
        if (ipfsHash === undefined) {
          console.log(
            "Error pinning image! Saving current work and stopping..."
          );
          fs.writeFileSync(
            path.join(mainPath, RESULTS_FILE_NAME),
            JSON.stringify(results, null, 2)
          );
          process.exit(1);
        }
        reserve = algosdk.encodeAddress(
          multihash.decode(new cid(ipfsHash).multihash).digest
        );
        result.ipfsHashImage = ipfsHash;
        result.reserveImage = reserve;
      }
    }

    fs.writeFileSync(
      path.join(mainPath, RESULTS_FILE_NAME),
      JSON.stringify(results, null, 2)
    );

    process.exit();
  } else if (minterMode === "pinArc3") {
    console.log("Minter running in pin arc3 mode");
    console.log(
      `It will use ${RESULTS_FILE_NAME} created in create mode to update it with IPFS hash and reserve address for each asset's arc3 data.`
    );
    console.log(
      `Minter running with assetStartOffset: ${assetStartOffset} and assetEndOffset ${assetEndOffset} meaning it will start processing from asset number ${assetStartOffset} to ${assetEndOffset}.`
    );
    if (noPinRun) {
      console.log(
        `Minter running with noPinRun: true, meaning it won't pin any images and will use the creator's ${MAIN_ACCOUNT_ADDRESS} address as reserve.`
      );
    } else {
      console.log(
        `Minter running with noPinRun: false, meaning it will pin images and use the pinned IPFS hash as reserve. It will use the ${pinningService} service for pinning. It will save both the IPFS hash and reserve address in ${RESULTS_FILE_NAME}.`
      );
    }

    let results = require(path.join(mainPath, RESULTS_FILE_NAME));
    for (
      let indexFile = assetStartOffset;
      indexFile <= assetEndOffset;
      indexFile++
    ) {
      let result = results[indexFile - 1];
      let filePathJson = result.filePathJson;

      let reserve = noPinRun === true ? MAIN_ACCOUNT_ADDRESS : undefined;
      result.ipfsHashArc3 = undefined;
      result.reserveArc3 = reserve;
      if (noPinRun === false) {
        let assetUnitName = path.basename(filePathJson, ".json");
        let ipfsHash = await pin(assetUnitName, filePathJson, "json");
        if (ipfsHash === undefined) {
          console.log(
            "Error pinning image! Saving current work and stopping..."
          );
          fs.writeFileSync(
            path.join(mainPath, RESULTS_FILE_NAME),
            JSON.stringify(results, null, 2)
          );
          process.exit(1);
        }
        reserve = algosdk.encodeAddress(
          multihash.decode(new cid(ipfsHash).multihash).digest
        );
        result.ipfsHashArc3 = ipfsHash;
        result.reserveArc3 = reserve;
      }
    }

    fs.writeFileSync(
      path.join(mainPath, RESULTS_FILE_NAME),
      JSON.stringify(results, null, 2)
    );

    process.exit();
  } else if (minterMode === "update") {
    console.log("Minter running in update mode");
    console.log(
      `It will use ${RESULTS_FILE_NAME} created in create mode to update the assets.`
    );
    console.log(
      `Minter running with assetStartOffset: ${assetStartOffset} and assetEndOffset ${assetEndOffset} meaning it will start processing from asset number ${assetStartOffset} to ${assetEndOffset}.`
    );
    if (dryRun) {
      console.log(
        `Minter running with dryRun: true, meaning it will simulate sending transactions and will only log the output.`
      );
    } else {
      console.log(
        `Minter running with dryRun: false, meaning it will send transactions to update the assets.`
      );
    }

    let txs = [];
    let results = require(path.join(mainPath, RESULTS_FILE_NAME));
    for (
      let indexFile = assetStartOffset;
      indexFile <= assetEndOffset;
      indexFile++
    ) {
      let result = results[indexFile - 1];
      let assetIndex = BigInt(result.assetIndex);

      let tx = await createAssetConfigTransaction(
        assetIndex,
        undefined,//TODO add option to save arc69
        result.reserveArc3,
        MAIN_ACCOUNT_ADDRESS
      );

      txs.push(tx);

      if (txs.length === 16) {
        const res = await sendGroupTransactions(txs, mainAccountMnemonic);
        if (res === false) {
          console.log("Error sending transactions! Stopping...");
          process.exit(1);
        }
        txs = [];
      }
    }
    if (txs.length > 0) {
      const res = await sendGroupTransactions(txs, mainAccountMnemonic);
      if (res === false) {
        console.log("Error sending transactions! Stopping...");
        process.exit(1);
      }
      txs = [];
    }

    process.exit();
  }
};

async function sendGroupTransactions(txs, mainAccountMnemonic) {
  try {
    const groupedTransactions = algosdk.assignGroupID(txs);
    let txsSigned = groupedTransactions.map((tx) => {
      return tx.signTxn(mainAccountMnemonic.sk);
    });
    if (dryRun === true) {
      const txRes = await algodClient.simulateRawTransactions(txsSigned).do();
      console.log("sending txs: ", txRes);
      return true;
    } else {
      let txRes = await algodClient.sendRawTransaction(txsSigned).do();
      // Wait for transaction to be confirmed
      let confirmedTxn = await algosdk.waitForConfirmation(
        algodClient,
        txRes.txid,
        10
      );
      console.log("confirmed tx: ", confirmedTxn);
      return true;
    }
  } catch (err) {
    console.log("Transaction Error: Failed to send group transactions");
    console.log(`Error type: ${err.name}`);
    console.log(`Error details: ${err.message}`);
    if (err.response) {
      console.log("Response data:", err.response.data);
    }
    return false;
  }
}

function addZeros(length) {
  let string = "";
  while (string.length < length) {
    string = "0" + string;
  }
  return string;
}

async function createAssetCreateTransaction(
  from,
  arc69,
  assetName,
  unitName,
  assetURL,
  total,
  manager,
  reserve
) {
  let note = undefined;
  if (arc69 !== undefined) {
    note = encoder.encode(JSON.stringify(arc69));
  }

  const suggestedParams = await algodClient.getTransactionParams().do();
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    sender: from,
    note: note,
    suggestedParams: suggestedParams,
    assetName: assetName,
    unitName: unitName,
    assetURL: assetURL,
    total: total,
    decimals: 0,
    defaultFrozen: false,
    manager: manager,
    reserve: reserve,
  });

  return txn;
}

async function createAssetConfigTransaction(
  assetIndex,
  arc69,
  reserve,
  manager
) {
  let note = undefined;
  if (arc69 !== undefined) {
    note = encoder.encode(JSON.stringify(arc69));
  }

  const suggestedParams = await algodClient.getTransactionParams().do();
  const txn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
    sender: manager,
    note: note,
    suggestedParams: suggestedParams,
    assetIndex: assetIndex,
    manager: manager,
    reserve: reserve === undefined ? manager : reserve,
    strictEmptyAddressChecking: false,
  });

  return txn;
}

async function pin(filename, path, extension) {
  if (!fs.existsSync(path)) {
    console.log(`File Error: Image file not found at path: ${path}`);
    return undefined;
  }

  if (pinningService === pinningServices.PINATA) {
    var data = new FormData();
    data.append("file", fs.createReadStream(path), {
      filename: `${filename}.${extension}`,
    });
    data.append("pinataOptions", '{"cidVersion": 0}');
    data.append(
      "pinataMetadata",
      `{"name": "${filename}.${extension}", "keyvalues": {"company": "${COMPANY}"}}`
    );

    var config = {
      method: "post",
      url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
      headers: {
        Authorization: "Bearer " + PINATA_TOKEN,
        ...data.getHeaders(),
      },
      data: data,
    };
    try {
      const resPost = await axios(config);
      console.log(`Successfully pinned ${filename} to Pinata`);
      console.log("Content added with CID:", resPost.data.IpfsHash);
      return resPost.data.IpfsHash;
    } catch (err) {
      console.log(`Pinata Error: Failed to pin file ${filename}`);
      console.log(
        `Error details: ${err.response?.data?.message || err.message}`
      );
      return undefined;
    }
  } else if (pinningService === pinningServices.WEB3STORAGE) {
    const storage = new Web3Storage.Web3Storage({ token: WEB3STORAGE_TOKEN });
    const pathFiles = await Web3Storage.getFilesFromPath(path);
    try {
      const cid = await storage.put(pathFiles, {
        wrapWithDirectory: false,
        name: filename,
      });
      console.log(`Successfully pinned ${filename} to Web3.Storage`);
      console.log("Content added with CID:", cid);
      return cid;
    } catch (err) {
      console.log(`Web3.Storage Error: Failed to pin file ${filename}`);
      console.log(`Error details: ${err.message}`);
      return undefined;
    }
  } else {
    throw new Error(
      "Configuration Error: Invalid IPFS provider selected. Please choose either 'pinata' or 'web3.storage'"
    );
  }
}

start();
