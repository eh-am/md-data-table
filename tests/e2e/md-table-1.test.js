describe('md-data-table-1', function() {

  beforeEach(function (){
    browser.get(browser.baseUrl);
    mdDataTable = element(by.id('md-data-table-1'));
  });

    it('should have a header', function () {
        var header = mdDataTable.element(by.tagName('thead'));

        expect(header.isPresent()).toBe(true);

        expect(browser.getTitle()).toBe('Nutrition');
    });

});
