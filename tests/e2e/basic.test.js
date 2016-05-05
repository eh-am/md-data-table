describe('md-data-table', function() {
    describe('Main page', function () {
        it('should have a correct title', function () {
            browser.get(browser.baseUrl);

            expect(browser.getTitle()).toBe('Nutrition');
        })
    });
});
