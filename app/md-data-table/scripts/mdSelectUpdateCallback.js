angular.module('md.data.table')
    .directive('mdSelectUpdateCallback', mdSelectUpdateCallback);
/**
 * This directive for the md-select in the md table cell.  The md-select has bugs when it comes to on change event and track by value.
 * The on change event is fired for every item in the list. With this directive we can control the events.
 */
function mdSelectUpdateCallback($mdTable) {
    'use strict';

    return {
        restrict: 'A',
        require: '^^mdDataTable',
        link: function (scope, element, attrs, tableCtrl) {

            scope.enableOnChange = false;

            var oldItem = {};

            scope.$watch(attrs.ngModel, function (newValue, oldValue) {
                if (scope.enableOnChange && newValue !== undefined) {
                    var rowData = scope[attrs.ngModel.split('.')[0]];

                    //remove duplicates
                    $mdTable.removeDuplicates(tableCtrl.dirtyItems, rowData.id);

                    //update dirty items
                    tableCtrl.dirtyItems.push({
                        oldItem: oldItem,
                        newItem: rowData
                    });

                    //call callback
                    if (typeof tableCtrl.rowUpdateCallback === 'function') {
                        tableCtrl.rowUpdateCallback();
                    }
                }
            });

            //enable the watcher only when the user interacts with the select
            element.on('click', function () {
                if (!scope.enableOnChange) {
                    scope.enableOnChange = true;
                }

                angular.copy(scope[attrs.ngModel.split('.')[0]],oldItem);
            });
        }
    };
}

mdSelectUpdateCallback.$inject = ['$mdTable'];