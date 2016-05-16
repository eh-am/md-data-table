'use strict';

angular.module('md.data.table').directive('mdDataTableContainer', mdDataTableContainer);

function mdDataTableContainer($compile, $timeout) {

  function link($scope, element, attrs, ctrl, $transclude){

    // var clone = $compile(element.find('table'))($scope);
    // element.after(clone);
    // element.after('<div>asd</div>');
    // $transclude(function(clone){
    //   element.clone()
    // }));

    // $transclude(function(transcludeEl){
      // element.append(transcludeEl);
      // element.parent().append(transcludeEl);
    // });



    // console.log(element.parent().append($transclude()));
  }



  function compile(element, scope) {



      //  var t = tElement.find('table');
  //
  //
  //   tElement.append(t);
  //   console.log('telement', tElement);
  //   tElement.append('<div>dummy</div>');
  //
  //
    return postLink;
  }

  // empty controller to be bind properties to in postLink function
  function Controller($element, $transclude) {
    // console.log('test');
    // console.log('transclude', $transclude);
    // $element.append($transclude());
    // $element.parent().append($transclude());
  }

  function postLink(scope, element, attrs) {
    console.log('finished compiling everything');
    // var t = element.find('table');
    // var s = t.scope();

    console.log('??', $timeout);

    $timeout(function(){
      //TODO: Use more specific selectors

      var table = element.find('table');
      var thead = angular.element(table.find('thead')[0]);
      var tbody = table.find('tbody');
      var tr = tbody.find('tr').clone();
      var th = thead.find('th').clone();

      // console.log($(element).find('th'));
      // console.log('th', th);
      // console.log('thead', thead);

      //foreach tr found angular.element(tbody.find('tr')[0]).clone().empty();
      // var responsiveTable = {};
      // responsiveTable.tr = {}
      // responsiveTable.tr.element = angular.element(tbody.find('tr')[0]).clone().empty();


      // angular.forEach(tr, function (row){
      //   console.log('row', row);
      // });

      // var row = angular.element(tr[0]).find('td');
      var newTable = angular.element('<table ng-show="columnMode" data-md-table md-progress="deferred" md-row-update-callback="rowUpdateCallback()" md-row-dirty="dirtyItems"></table>');
      var newBody = angular.element('<tbody></tbody>');
      newTable.append(newBody);

      var responsiveTable = {};
      angular.forEach(tr, function (row){
        responsiveTable.tr = {};
        responsiveTable.tr = new Array();
        // responsiveTable.tr.push();

        responsiveTable.tr.element = angular.element(row).clone().empty();
        responsiveTable.tr.element.addClass('column-mode').removeAttr('data-ng-repeat');
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


          $compile(responsiveTable.tr.td.table.thead.element, table.scope());

          // responsiveTable.tr.td = {};
        });

        newBody.append(responsiveTable.tr.element);
        responsiveTable.tr = {};
      });


      // newTable.append(responsiveTable.tr.element);
      element.append(newTable);
      console.log('olha o escopo', table.scope());

      $compile(newTable, table.scope());



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






      // Final

      // console.log('tr', responsiveTable.tr.empty())
      // console.log('table', th);
    }, 0);
    // console.log($compile(t.html(), scope));

    // element.append(t);

    // var original = element.clone(true);
    // console.log(original);

    // element.parent().append($compile(original.html()(scope)))

    // console.log('added ', original);


    // $timeout(function(){
    //   var t = element.find('table');
    //   var a = angular.element('<div></div>');
    //
    //   a.append(t);
    //   element.append(a);
    //   // console.log('return of append', element.append(t));
    //   // $compile(t, t.scope());
    //   element.append(angular.element('<div>asd</div>'));
    // }, 0);

  }

  return {
    // link: link,
    controller: Controller,
    // transclude: true,
    compile: compile,
    // require: '^^mdTable',
    restrict: 'EA'
  };
}

mdDataTableContainer.$inject = ['$compile', '$timeout'];
