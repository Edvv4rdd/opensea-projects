require('dotenv').config({
    path: './.env.punks'
});

const { getAssets } = require('./fetch-assets');

const fs = require('fs');
const opensea = require("opensea-js");
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;

const MnemonicWalletSubprovider = require("@0x/subproviders")
    .MnemonicWalletSubprovider;
const RPCSubprovider = require("web3-provider-engine/subproviders/infura");
const Web3ProviderEngine = require("web3-provider-engine");
const { WyvernSchemaName } = require("opensea-js/lib/types");

const MNEMONIC = ""
const NODE_API_KEY = '382562e47d6844b5b350a61048e98bcc'
const OWNER_ADDRESS = '0xc7eb703A8d4e58f55aB174697aebA577596A6937'
const TOKEN_ADDRESS = '0x495f947276749ce646f68ac8c248420045cb7b5e'

const BASE_DERIVATION_PATH = `44'/60'/0'/0`;

const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({
    mnemonic: MNEMONIC,
    baseDerivationPath: BASE_DERIVATION_PATH,
});

const infuraRpcSubprovider = new RPCSubprovider({
    projectId: NODE_API_KEY,
});

const providerEngine = new Web3ProviderEngine();
providerEngine.addProvider(mnemonicWalletSubprovider);
providerEngine.addProvider(infuraRpcSubprovider);
providerEngine.start();

const seaport = new OpenSeaPort(
    providerEngine,
    {
        networkName: Network.Main,
    },
    (arg) => console.log(arg)
);

async function start(twinPunkIdToStartListingFrom, useCachedAssets) {
    try {
        let assets;

        if (useCachedAssets) {
            assets = JSON.parse(fs.readFileSync('./cached-assets.json').toString());
        } else {
            assets = (await getAssets(TOKEN_ADDRESS))
                .filter(({ last_sale }) => !last_sale);

            fs.writeFileSync('./cached-assets.json', JSON.stringify(assets))
        }

        let tempAssets;

        if (twinPunkIdToStartListingFrom !== -1) {
            const startFromIdx = assets.findIndex(({ name }) => {
                if (name.split(' ').length !== 2) {
                    return false;
                }

                return +name.split(' ')[1].slice(1) === +twinPunkIdToStartListingFrom
            });

            if (startFromIdx !== -1) {
                tempAssets = [...assets.slice(startFromIdx)];
            }
        }

        if (!tempAssets) {
            tempAssets = [...assets];
        }

        while (true) {
            if (!tempAssets.length) {
                tempAssets = [...assets];
            }

            const { token_id } = tempAssets.shift();

            const price = generateRandomPrice();

            try {
                console.log('Before reateSellOrder ' + token_id)
                await seaport.createSellOrder({
                    asset: {
                        tokenId: token_id,
                        schemaName: WyvernSchemaName.ERC1155,
                        tokenAddress: TOKEN_ADDRESS,
                    },
                    accountAddress: OWNER_ADDRESS,
                    startAmount: price,
                    endAmount: price,
                    expirationTime: (() => {
                        const d1 = new Date();
                        const d2 = new Date(d1);

                        d2.setMinutes(d1.getMinutes() + 3700);

                        return Math.floor(d2.getTime() / 1000);
                    })(),
                });
                console.log('Done createSellOrder ' + token_id)
            } catch (e) {
                console.log(e);
            }
            await new Promise(res => setTimeout(() => res(), 60000));
        }
    } catch (e) {
        console.log(e)
    }
}

const probabilities = {
    low: {
        range: [0.03, 0.5],
        chance: 70
    },
    mid: {
        range: [.5, 1],
    },
    high: {
        range: [1, 5],
        chance: 10
    }
};

function generateRandomPrice(fromETH = .03, toETH = 2) {
    const random = Math.random() * 100;

    let ceil;
    let floor;

    switch (true) {
        case random > 0 && random <= 80:
            [floor, ceil] = probabilities.low.range;
            break;
        case random > 80 && random <= 90:
            [floor, ceil] = probabilities.mid.range;
            break;
        case random > 90 && random <= 100:
            [floor, ceil] = probabilities.high.range;
            break;
    }

    return +((Math.random() * ceil) + floor).toFixed(2);
}

const tokenIdToStartFrom = process.argv[2] || -1;
const useCachedAssets = JSON.parse(process.argv[3] || 'false');

start(tokenIdToStartFrom, useCachedAssets);
