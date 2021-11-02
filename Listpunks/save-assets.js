const fs = require('fs');
const { getAssets } = require('./fetch-assets');

(async () => {
        console.log('Caching assets');
        try {
            const assets = (await getAssets()).filter(({ last_sale }) => !last_sale)
            fs.writeFileSync('./cached-assets.json', JSON.stringify(assets));

            console.log('Assets cached');
        } catch (e) {
            console.log('Try again');
        }
    }
)();
