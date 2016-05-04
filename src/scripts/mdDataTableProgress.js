angular.module('md.data.table').directive('mdTableProgress', mdTableProgress);

function mdTableProgress() {
    'use strict';

    function postLink(scope, element, attrs, tableCtrl) {

        tableCtrl.hideProgress = function () {
            scope.showProgress = false;
        };

        tableCtrl.showProgress = function () {
            scope.columnCount = tableCtrl.columns.length;
            scope.showProgress = true;
        };
    }

    return {
        link: postLink,
        require: '^mdDataTable',
        replace: true,
        templateUrl: 'templates.md-data-table-progress.html',
        scope: true
    };
}
