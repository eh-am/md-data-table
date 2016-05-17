'use strict';

angular.module('md.data.table').directive('mdDataTableContainer', mdDataTableContainer);

function mdDataTableContainer($compile, $timeout, $rootScope) {

  function link($scope, element, attrs, ctrl, $transclude){
  }



  function compile(element, scope) {

    return postLink;
  }

  // empty controller to be bind properties to in postLink function
  function Controller($element, $transclude) {
  }

  function postLink(scope, element, attrs) {

    // recreate the dom in a hacky way (nested tables and such)
    $timeout(function(){
      //TODO: Use more specific selectors

      var table = element.find('table');
      var thead = angular.element(table.find('thead')[0]);
      var tbody = table.find('tbody');
      var tr = tbody.find('tr').clone();
      var th = thead.find('th').clone();


      var ourScope = table.scope();
      var newTable = angular.element('<table ng-show="columnMode" data-md-table md-progress="deferred" md-row-update-callback="rowUpdateCallback()" md-row-dirty="dirtyItems"></table>');

      var newBody = angular.element('<tbody md-body></tbody>');
      newTable.append(newBody);

      var responsiveTable = {};
      angular.forEach(tr, function (row){
        responsiveTable.tr = {};



        responsiveTable.tr.element = angular.element(row).clone().empty();
        responsiveTable.tr.element.addClass('column-mode');
        // If I add the removeAttr it compiles, but it obviously won't loop through the data
        // and the bindings would'nt work, therefore no cool features :( 
        responsiveTable.tr.element.removeAttr('data-ng-repeat');


        th = thead.find('th').clone();

        angular.forEach(angular.element(row).find('td'), function (cell){
          responsiveTable.tr.td = { element: angular.element('<td></td>')};
          responsiveTable.tr.td.table = { element: angular.element('<table></table>')};
          responsiveTable.tr.td.table.thead = { element: thead.clone().empty() };
          responsiveTable.tr.td.table.thead.tr = { element: angular.element('<tr md-row></tr>') };
          responsiveTable.tr.td.table.thead.tr.th = { element: th.splice(0, 1) };

          responsiveTable.tr.td.table.tbody = { element: angular.element('<tbody md-body></tbody>') };
          responsiveTable.tr.td.table.tbody.row = { element: angular.element('<tr md-row></tr md-row>')};
          responsiveTable.tr.td.table.tbody.row.td = { element: cell };

          //Head
          responsiveTable.tr.td.table.thead.tr.element.append(responsiveTable.tr.td.table.thead.tr.th.element);
          responsiveTable.tr.td.table.thead.element.append(responsiveTable.tr.td.table.thead.tr.element);
          responsiveTable.tr.td.table.element.append(responsiveTable.tr.td.table.thead.element);
          responsiveTable.tr.td.table.thead.tr.element.append(responsiveTable.tr.td.table.thead.tr.th.element);

          //Body
          responsiveTable.tr.td.table.tbody.row.element.append(responsiveTable.tr.td.table.tbody.row.td.element);
          responsiveTable.tr.td.table.tbody.element.append(responsiveTable.tr.td.table.tbody.row.element);
          responsiveTable.tr.td.table.element.append(responsiveTable.tr.td.table.tbody.element);
          responsiveTable.tr.td.element.append(responsiveTable.tr.td.table.element);
          responsiveTable.tr.element.append(responsiveTable.tr.td.element);

          responsiveTable.tr.td = {};
        });


        newBody.append(responsiveTable.tr.element);
        responsiveTable.tr = {};
      });


      $compile(newTable, scope);
      element.append(newTable);




      // angular.forEach(row, function (cell){
      //   responsiveTable.tr.td = { element: angular.element('<td></td>')};
      //   responsiveTable.tr.td.table = { element: angular.element('<table></table>')};
      //   responsiveTable.tr.td.table.thead = { element: thead.clone().empty() };
      //   responsiveTable.tr.td.table.thead.tr = { element: angular.element('<tr></tr>') };
      //   responsiveTable.tr.td.table.thead.tr.th = { element: th[i++] };
      //
      //   responsiveTable.tr.td.table.tbody = { element: angular.element('<tbody md-body></tbody>') };
      //   responsiveTable.tr.td.table.tbody.row = { element: angular.element('<tr md-row></tr md-row>')};
      //   responsiveTable.tr.td.table.tbody.row.td = { element: cell };
      //
      //   //Head
      //   responsiveTable.tr.td.table.thead.tr.element.append(responsiveTable.tr.td.table.thead.tr.th.element);
      //   responsiveTable.tr.td.table.thead.element.append(responsiveTable.tr.td.table.thead.tr.element);
      //   responsiveTable.tr.td.table.element.append(responsiveTable.tr.td.table.thead.element);
      //   responsiveTable.tr.td.table.thead.tr.element.append(responsiveTable.tr.td.table.thead.tr.th.element);
      //
      //   //Body
      //   responsiveTable.tr.td.table.tbody.row.element.append(responsiveTable.tr.td.table.tbody.row.td.element);
      //   responsiveTable.tr.td.table.tbody.element.append(responsiveTable.tr.td.table.tbody.row.element);
      //   responsiveTable.tr.td.table.element.append(responsiveTable.tr.td.table.tbody.element);
      //   responsiveTable.tr.td.element.append(responsiveTable.tr.td.table.element);
      //   responsiveTable.tr.element.append(responsiveTable.tr.td.element);
      //
      //
      //   responsiveTable.tr.td = {};
      // });
    }, 0);

  }

  return {
    controller: Controller,
    compile: compile,
    restrict: 'EA'
  };
}

mdDataTableContainer.$inject = ['$compile', '$timeout', '$rootScope'];
