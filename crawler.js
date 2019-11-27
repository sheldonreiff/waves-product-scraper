const Apify = require('apify');

const saveScreen = async (page, key = 'debug-screen') => {
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    await Apify.setValue(key, screenshotBuffer, { contentType: 'image/png' });
};

const crawlPage = () => {
    const getNote = product => {
        if(product.find('div.add-to-cart-list-note:contains("Get It Free")').length > 0){
            return 'free';
        }else if(product.find('div.add-to-cart-list-note:contains("Available in a bundle with the Dugan Speech plugin")').length > 0){
            return 'dugan_bundle';
        }else if(product.find('div.add-to-cart-list-note:contains("Available only in selected bundles")').length > 0){
            return 'select_bundles';
        }
        return null;
    }
    const getTypeFromSlug = slug => {
        const detectedType = slug.split('/')[1];
        switch(detectedType){
            case 'plugins':
                return 'plugin';
            case 'bundles':
                return 'bundle';
        }
        return null;
    }

    const products = $('div[data-type="price-box"]').map( function() {
        const slug = $(this).attr('data-url');
        return {
            sku: $(this).attr('data-skunumber'),
            name: $(this).attr('data-name'),
            type: getTypeFromSlug(slug),
            msrp: parseFloat($(this).attr('data-msrp')),
            salePrice: parseFloat($(this).attr('data-skuprice')),
            category: $(this).attr('data-gsf-category'),
            note: getNote($(this)),
            saleEnd: $(this).attr('data-saledate'),
            badge: $(this).parent('article').attr('data-badge'),
            thumbnailUrl: $(this).siblings('div.jplist-item-target').find('div.icon img').attr('data-original'),
            url: `https://www.waves.com${slug}`,
        }
    });
    console.log(`${products.length} products collected`);
    return products.get();
};

const getData = async () => {
    const browser = await Apify.launchPuppeteer({
        headless: true,
        args: ['--disable-web-security'],
    });

    const basePage = await browser.newPage();
    await basePage.goto('https://www.waves.com/plugins');

    console.log('Base page loaded');
    await saveScreen(basePage, 'base-page');

    const dataPage = await browser.newPage();
    dataPage.on('console', (log) => console[log._type](log._text));
    await dataPage.goto('https://www.waves.com/plugins#sort:path~type~order=.default-order~number~asc|views:view=grid-view|paging:currentPage=0|paging:number=all');
    console.log('Data page loaded');
    await saveScreen(dataPage, 'data-page');

    await Apify.utils.puppeteer.injectJQuery(dataPage);
    const results = await dataPage.evaluate(crawlPage);
    await browser.close();
    return results;
}

const saveData = async products => {
    console.log(`Saving ${products.length} results`);
    await Apify.pushData({
        finishedAt: new Date().toJSON(),
        products,
    });
    return true;
};

module.exports = {
    crawlPage,
    getData,
    saveData,
};