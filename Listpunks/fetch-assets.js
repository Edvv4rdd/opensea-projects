require('dotenv').config({
    path: './.env.punks'
});

const fetch = require('node-fetch');

const OWNER_ADDRESS = '0xc7eb703A8d4e58f55aB174697aebA577596A6937'
const TOKEN_ADDRESS = '0x495f947276749ce646f68ac8c248420045cb7b5e'

async function getAssets() {
    const fetchedAssets = []
    const MAX_NUMBER_OF_ASSETS_PER_FETCH = 20

    let offset = 0;
    let hasNext = true

    while (hasNext) {
        try {
            await fetch(`https://api.opensea.io/api/v1/assets?owner=${OWNER_ADDRESS}&asset_contract_address=${TOKEN_ADDRESS}&offset=${offset}`)
                .then(res => res.json())
                .then(({ assets }) => {
                    fetchedAssets.push(...assets.map(asset => {
                        if (asset.last_sale) {
                            return asset;
                        }

                        asset.last_sale = false;

                        return asset;
                    }))

                    hasNext = assets.length === MAX_NUMBER_OF_ASSETS_PER_FETCH
                    offset += MAX_NUMBER_OF_ASSETS_PER_FETCH

                    console.log('Current offset', offset)
                })
        } catch (e) {

        }

        await new Promise(res => setTimeout(() => res(), 1100))
    }

    return fetchedAssets;
}

module.exports = {
    getAssets
};
