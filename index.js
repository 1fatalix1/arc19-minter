let fs = require('fs');
let path = require('path');
const conf = require("./config.js");
var FormData = require('form-data');
const algosdk = require('algosdk');
const axios = require('axios');
const multihash = require('multihashes');
const cid = require('cids');
let encoder = new TextEncoder();
let mainPath = path.resolve(__dirname);
let assetsPath = path.join(mainPath, 'assetsImages');

//select the correct algorand network to use
let network = 'testnet';

let algodClient = new algosdk.Algodv2(
    network === 'testnet' ? conf.NODE_TOKEN_TESTNET : conf.NODE_TOKEN,
    network === 'testnet' ? conf.NODE_ENDPOINT_TESTNET : conf.NODE_ENDPOINT,
    network === 'testnet' ? conf.NODE_ENDPOINT_PORT_TESTNET : conf.NODE_ENDPOINT_PORT
);

const MAIN_ACCOUNT_MNEMONIC = ""
const MAIN_ACCOUNT_ADDRESS = ""
const PINATA_TOKEN = ""

// does not pin uses creators address as reserve
let noPinRun = true;
// does not mint just logs output
let dryRun = true;

let assetsCount = 9000;
let assetQuantity = 1;

var start = async function () {
    let mainAccountMnemonic = algosdk.mnemonicToSecretKey(
        MAIN_ACCOUNT_MNEMONIC
    );

    let files = fs.readdirSync(assetsPath);
    let images = files.filter(x=>x.endsWith('.png'));
    let jsons = files.filter(x=>x.endsWith('.json'));
    for (let indexFile = 1; indexFile <= images.length; indexFile++) {
        let filePathImage = path.join(assetsPath, images[indexFile - 1]);
        let filePathJson = path.join(assetsPath, jsons[indexFile - 1]);
        let arc69 = require(filePathJson);

        let assetSeq = '#';
        assetSeq += addZeros(assetsCount.toString().length - indexFile.toString().length);
        assetSeq += indexFile;

        let assetUnitName = conf.ASSET_UNIT_NAME + assetSeq;
        let assetName = conf.ASSET_NAME + assetSeq;

        console.log('File Path Image: ' + filePathImage);
        console.log('File Path Json: ' + filePathJson);
        console.log('Asset Unit Name: ' + assetUnitName);
        console.log('Asset Name: ' + assetName);
        console.log('Quantity: ' + assetQuantity);
        console.log('Asset Unit Name Length: ' + assetUnitName.length);
        console.log('Asset Name Length: ' + assetName.length);

        let reserve = (noPinRun === true ? MAIN_ACCOUNT_ADDRESS : undefined);
        if (dryRun === false) {
            if (noPinRun === false) {
                let ipfsHash = await pin(assetUnitName, filePathImage);
                reserve = algosdk.encodeAddress(
                    multihash.decode(
                        new cid(ipfsHash).multihash
                    ).digest
                );
            }
            let tx = await mintAsset(MAIN_ACCOUNT_ADDRESS, arc69,
                assetName, assetUnitName,
                conf.ARC19_TEMPLATE, assetQuantity, MAIN_ACCOUNT_ADDRESS, reserve);

            let txSigned = tx.signTxn(mainAccountMnemonic.sk);
            try {
                let txRes = await algodClient.sendRawTransaction(txSigned).do();
                // Wait for transaction to be confirmed
                let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txRes.txId, 6);
                console.log(confirmedTxn);
                let assetIndex = confirmedTxn['asset-index'];
                fs.renameSync(filePathImage, path.join(assetsPath, assetIndex + '.png'));
                fs.renameSync(filePathJson, path.join(assetsPath, assetIndex + '.json'));
            } catch (err) {
                console.log(err.message);
            }
        }
    }
    process.exit();
}

function addZeros(length) {
    let string = '';
    while (string.length < length) {
        string = '0' + string;
    }
    return string;
}

async function mintAsset(from, arc69, assetName, unitName, assetURL, total, manager, reserve) {
    let note = undefined;
    if (arc69 !== undefined) {
        note = encoder.encode(JSON.stringify(arc69));
    }

    const suggestedParams = await algodClient.getTransactionParams().do();
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: from,
        note: note,
        suggestedParams: suggestedParams,
        assetName: assetName,
        unitName: unitName,
        assetURL: assetURL,
        total: total,
        decimals: 0,
        defaultFrozen: false,
        manager: manager,
        reserve: reserve
    });

    return txn;
}

async function pin(filename, path) {
    var data = new FormData();
    data.append('file', fs.createReadStream(path), { filename: `${filename}.png` });
    data.append('pinataOptions', '{"cidVersion": 0}');
    data.append('pinataMetadata', `{"name": "${filename}.png"}`);

    var config = {
        method: 'post',
        url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
        headers: {
            'Authorization': 'Bearer ' + PINATA_TOKEN,
            ...data.getHeaders()
        },
        data: data
    };
    try {
        const resPost = await axios(config);
        console.log(resPost.data);
        return resPost.data.IpfsHash;
    } catch (err) {
        console.log(err)
    }
}

start();
