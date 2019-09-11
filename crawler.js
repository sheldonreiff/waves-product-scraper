const Apify = require('apify');

const crawlPage = () => {
    const products = [];
    $('div[data-type="price-box"]').each( function() {
        let note = null;
        if($(this).find('div.add-to-cart-list-note:contains("Get It Free")').length > 0){
            note = 'free';
        }else if($(this).find('div.add-to-cart-list-note:contains("Available in a bundle with the Dugan Speech plugin")').length > 0){
            note = 'dugan_bundle';
        }else if($(this).find('div.add-to-cart-list-note:contains("Available only in selected bundles")').length > 0){
            note = 'select_bundles';
        }
        
        let type = null;
        if($(this).attr('data-url').indexOf('/plugins/') === 0){
            type = 'plugin';
        }else if($(this).attr('data-url').indexOf('/bundles/') === 0){
            type = 'bundle';
        }

        const slug = $(this).siblings('div.jplist-item-target').find('a').attr('href');

        products.push({
            sku: $(this).attr('data-skunumber'),
            name: $(this).attr('data-name'),
            type: type,
            msrp: parseFloat($(this).attr('data-msrp')),
            salePrice: parseFloat($(this).attr('data-skuprice')),
            category: $(this).attr('data-gsf-category'),
            note: note,
            saleEnd: $(this).attr('data-saledate'),
            badge: $(this).parent('article').attr('data-badge'),
            thumbnailUrl: $(this).siblings('div.jplist-item-target').find('div.icon img').attr('data-original'),
            url: `https://www.waves.com${slug}`,
        });
    });
    console.log(`${products.length} products collected`);
    return products;
};

const getData = async () => {
    const browser = await Apify.launchPuppeteer({
        headless: true,
        args: ['--disable-web-security'],
    });

    const basePage = await browser.newPage();
    await basePage.goto('https://www.waves.com/plugins', {
        waitUntil:'networkidle0'
    });

    console.log('Base page loaded');

    const dataPage = await browser.newPage();
    dataPage.on('console', (log) => console[log._type](log._text));
    await dataPage.goto(
        'https://www.waves.com/plugins#sort:path~type~order=.default-order~number~asc|views:view=grid-view|paging:currentPage=0|paging:number=all',
        {
            waitUntil:'networkidle0',
            timeout: 60000,
        }
    );
    console.log('Data page loaded');

    await Apify.utils.puppeteer.injectJQuery(dataPage);
    const results = await dataPage.evaluate(crawlPage);
    await browser.close();
    return results;
}

const saveData = async products => {
    console.log(`Saving ${products.length} results`);
    await Apify.pushData({ products });
    return true;
};

module.exports = {
    crawlPage,
    getData,
    saveData,
};