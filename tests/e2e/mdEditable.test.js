describe('md-editable', function() {
  var table;

  beforeEach(function(){
    browser.get(browser.params.baseUrl);
    table = element(by.id('md-data-table-1'));
  });


  it('should have a correct title', function () {


      expect(browser.getTitle()).toBe('Nutrition');
  })


  it('should open a dialog box when clicking an editable item', function () {
    // $("#md-data-table-1 tbody tr td[md-editable='text']")
    var editableCell = element.all(by.css("#md-data-table-1 tbody tr:not([md-disable-select]) td[md-editable='text']")).first();
    editableCell.click().then(function(){
      browser.waitForAngular();
      var dialog = element(by.css('md-dialog'));

      expect(dialog.isPresent()).toBe(true);
    });

  });




  it('should NOT open a dialog box when clicking a NON editable item', function () {
    var nonEditableCell = element.all(by.css("#md-data-table-1 tbody tr td:not([md-editable])")).first();
    nonEditableCell.click().then(function(){
      browser.waitForAngular();
      var dialog = element(by.css('md-dialog'));

      expect(dialog.isPresent()).toBe(false);
    });
  });

  it('should NOT open a dialog box when clicking a NON editable item', function () {
    // the difference here is that we have the
    // md-editable-disabled="true" tag

    var nonEditableCell = element.all(by.css("#md-data-table-1 tbody tr td[md-editable-disabled='true']")).first();
    nonEditableCell.click().then(function(){
      browser.waitForAngular();
      var dialog = element(by.css('md-dialog'));

      expect(dialog.isPresent()).toBe(false);
    });
  });


  it('should update correctly the edited field', function () {
    var replacingText = "T_E_S_T";
    var editableCell = element.all(by.css("#md-data-table-1 tbody tr td[md-editable='text']")).first();

    editableCell.click().then(function(){
      browser.waitForAngular();
      var dialog = element(by.css('md-dialog'));
      dialog.element(by.model('editModel.data')).sendKeys(editableCell + replacingText);

      // this doesn't look very right, we should have a better way to find the Save button
      dialog.element(by.css('button[aria-label="Save"]')).click().then(function(){

        expect(editableCell.getText()).toBe(editableCell + replacingText);
      });

    });
  });

  // it('should NOT update the edited field when we click on cancel', function () {
  //   var replacingText = "T_E_X_T";
  //   var editableCell = element.all(by.css("#md-data-table-1 tbody tr td[md-editable='text']")).first();
  //   editableCell.click().then(function(){
  //     browser.waitForAngular();
  //     var dialog = element(by.css('md-dialog'));
  //     dialog.element(by.model('editModel.data')).sendKeys(replacingText);
  //
  //     // this doesn't look very right, we should have a better way to find the Save button
  //     dialog.element(by.css('button[aria-label="Save"]')).click().then(function(){
  //
  //       expect(editableCell.getText()).toBe(replacingText);
  //     });
  //
  //   });
  // });





});
