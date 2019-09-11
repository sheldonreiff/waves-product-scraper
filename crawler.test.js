const crawler = require('./crawler');

jest.setTimeout(36000);

describe('gets products', () => {
    let products = [];
    
    beforeAll( async () => {
        products = await crawler.getData();
    });

    it('gets at at least 10 products', () => {
        expect(products.length).toBeGreaterThanOrEqual(10);
    });

    it('gets valid skus', () => {
        products.forEach(product => {
            expect(product.sku.length).toBeLessThanOrEqual(30);
            expect(product.sku.length).toBeGreaterThanOrEqual(3);
        });
    });

    it('gets valid names', () => {
        products.forEach(product => {
            expect(product.name.length).toBeLessThanOrEqual(250);
            expect(product.name.length).toBeGreaterThanOrEqual(3);
        });
    });

    it('gets valid sale prices', () => {
        products.forEach(product => {
            expect(product.salePrice).toBeLessThanOrEqual(15000);
            expect(product.salePrice).toBeGreaterThanOrEqual(0);
        });
    });

    it('gets valid msrps', () => {
        products.forEach(product => {
            expect(product.msrp).toBeLessThanOrEqual(15000);
            expect(product.msrp).toBeGreaterThanOrEqual(0);
        });
    });

    it('gets valid product types', () => {
        products.forEach(product => {
            expect(['plugin', 'bundle']).toContain(product.type);
        });
    });

    it('gets valid urls', () => {
        products.forEach(product => {
            expect(product.url).toMatch(/^https:\/\/www.waves.com\/plugins\/.+$/);
        });
    });

    it('gets valid image urls', () => {
        products.forEach(product => {
            expect(product.thumbnailUrl).toMatch(/^https:\/\/.*\.png$/);
        });
    });
});
