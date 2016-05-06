describe('Directive: mdDataTablePagination', function () {
      beforeEach(module('md.data.table'));

      // var $controller;
      var scope;

      beforeEach(function(){
        inject(function($compile, $rootScope){
          // $compile = $injector.get('$compile');
          // $rootScope = $injector.get('$rootScope');
          compile = $compile;
          scope = $rootScope.$new();
        });

        directiveElem = getCompiledElement();
      });

      function getCompiledElement(){
        var itemsPerPage = 5;
        var currentPage = 1;
        var data = {
          "count": 9,
          "data": [
            {
              "id": "1",
              "name": "",
              "type": "Ice cream",
              "date": "2015-01-01",
              "calories": { "value": 159.0 },
              "note":"Testing note filed, blah, blah, blah,blah, blah, blah,blah, blah, blah",
              "fat": { "value": 6.0 },
              "carbs": { "value": 24.0 },
              "protein": { "value": 4.0 },
              "sodium": { "value": 87.0 },
              "calcium": { "value": 14.0 },
              "iron": { "value": 1.0 }
            }, {
              "id": "2",
              "name": "Ice cream sandwich",
              "type": "Ice cream",
              "date": "2015-01-01",
              "calories": { "value": 237.0 },
              "note":"Testing note filed, blah, blah, blah,blah, blah, blah,blah, blah, blah",
              "fat": { "value": 9.0 },
              "carbs": { "value": 37.0 },
              "protein": { "value": 4.3 },
              "sodium": { "value": 129.0 },
              "calcium": { "value": 8.0 },
              "iron": { "value": 1.0 }
            }, {
              "id": "3",
              "name": "Eclair",
              "type": "Pastry",
              "date": "2015-01-01",
              "calories": { "value":  262.0 },
              "note":"Testing note filed, blah, blah, blah,blah, blah, blah,blah, blah, blah",
              "fat": { "value": 16.0 },
              "carbs": { "value": 24.0 },
              "protein": { "value":  6.0 },
              "sodium": { "value": 337.0 },
              "calcium": { "value":  6.0 },
              "iron": { "value": 7.0 }
            }, {
              "id": "4",
              "name": "Cupcake",
              "type": "Pastry",
              "date": "2015-01-01",
              "calories": { "value":  305.0 },
              "note":"Testing note filed, blah, blah, blah,blah, blah, blah,blah, blah, blah",
              "fat": { "value": 3.7 },
              "carbs": { "value": 67.0 },
              "protein": { "value": 4.3 },
              "sodium": { "value": 413.0 },
              "calcium": { "value": 3.0 },
              "iron": { "value": 8.0 }
            }, {
              "id": "5",
              "name": "Jelly bean",
              "type": "Candy",
              "date": "2015-01-01",
              "calories": { "value":  375.0 },
              "note":"Testing note filed, blah, blah, blah,blah, blah, blah,blah, blah, blah",
              "fat": { "value": 0.0 },
              "carbs": { "value": 94.0 },
              "protein": { "value": 0.0 },
              "sodium": { "value": 50.0 },
              "calcium": { "value": 0.0 },
              "iron": { "value": 0.0 }
            }, {
              "id": "6",
              "name": "Lollipop",
              "type": "Candy",
              "date": "2015-01-01",
              "calories": { "value": 392.0 },
              "note":"Testing note filed, blah, blah, blah,blah, blah, blah,blah, blah, blah",
              "fat": { "value": 0.2 },
              "carbs": { "value": 98.0 },
              "protein": { "value": 0.0 },
              "sodium": { "value": 38.0 },
              "calcium": { "value": 0.0 },
              "iron": { "value": 2.0 }
            }, {
              "id": "7",
              "name": "Honeycomb",
              "type": "Other",
              "date": "2015-01-01",
              "calories": { "value": 408.0 },
              "note":"Testing note filed, blah, blah, blah,blah, blah, blah,blah, blah, blah",
              "fat": { "value": 3.2 },
              "carbs": { "value": 87.0 },
              "protein": { "value": 6.5 },
              "sodium": { "value": 562.0 },
              "calcium": { "value": 0.0 },
              "iron": { "value": 45.0 }
            }, {
              "id": "8",
              "name": "Donut",
              "type": "Pastry",
              "date": "2015-01-01",
              "calories": { "value": 452.0 },
              "note":"Testing note filed, blah, blah, blah,blah, blah, blah,blah, blah, blah",
              "fat": { "value": 25.0 },
              "carbs": { "value": 51.0 },
              "protein": { "value": 4.9 },
              "sodium": { "value": 326.0 },
              "calcium": { "value": 2.0 },
              "iron": { "value": 22.0 }
            }, {
              "id": "9",
              "name": "KitKat",
              "type": "Candy",
              "date": "2015-01-01",
              "calories": { "value": 518.0 },
              "note":"Testing note filed, blah, blah, blah,blah, blah, blah,blah, blah, blah",
              "fat": { "value": 26.0 },
              "carbs": { "value": 65.0 },
              "protein": { "value": 7.0 },
              "sodium": { "value": 54.0 },
              "calcium": { "value": 12.0 },
              "iron": { "value": 6.0 }
            }
          ]
        };


        var element = angular.element(
          '<md-data-table-pagination md-limit="'+ itemsPerPage +'" md-page="' + currentPage + '"></md-data-table-pagination>'
        );


        var compiledElement = compile(element)(scope);
        scope.$digest();

        return compiledElement;
      }

      it('should work', function(){
        // $scope.toBeDefined();
        expect(true).toBe(true);

        // var mdDataTablePagination = angular.element(angular.by.tagName('md-data-table-pagination'));

        expect(mdDataTablePagination).toBeDefined();
      });


      it('should start on page 1', function(){
        console.log(angular.mock.dump(scope));
        console.log(typeof scope);

        // expect(scope.page).toBe(1);
      });


    });
