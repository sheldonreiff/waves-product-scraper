const Apify = require('apify');
const crawler = require('./crawler');

Apify.main(async () => {
    const products = await crawler.getData();
    await crawler.saveData(products);
});