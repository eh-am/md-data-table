angular.module('md.data.table')
    .controller('EditDialogController', mdEditableDialogController)
    .directive('mdEditable', mdEditable);

function mdEditableDialogController($scope, $mdDialog, editType, maxNoteLength, dateFormat, data, moment) {

    $scope.editType = editType;
    $scope.maxNoteLength = maxNoteLength;

    $scope.editModel = {};

    if (editType === 'date' && data && !(data instanceof Date)) {
        $scope.editModel.data = moment(data, dateFormat).toDate();
    }
    else {
        $scope.editModel.data = data;
    }

    $scope.close = function () {
        $mdDialog.hide();
    };

    $scope.save = function () {
        $mdDialog.hide({
            data: $scope.editModel.data
        });
    }
}

function mdEditable($mdDialog) {
    'use strict';

    function link(scope, element, attrs, tableCtrl) {

        element.on('click', function (event) {
            event.stopPropagation();

            var type = attrs.mdEditable;

            $mdDialog.show({
                    controller: 'EditDialogController',
                    locals: {
                        editType: type,
                        dateFormat: scope.dateFormat,
                        maxNoteLength: scope.maxNoteLength,
                        data: scope.data
                    },
                    templateUrl: 'templates.md-data-table-edit.html',
                    parent: angular.element(document.body),
                    targetEvent: event,
                    clickOutsideToClose: true
                })
                .then(function (object) {
                    if (object && object.data) {
                        if (type === 'date' && scope.data && !(scope.data instanceof Date)) {
                            scope.data = moment(object.data).format(scope.dateFormat);
                        }
                        else {
                            scope.data = object.data;
                        }

                        if(typeof tableCtrl.rowUpdateCallback === 'function') {
                            tableCtrl.rowUpdateCallback();
                        }
                    }
                }, function () {
                    console.log("Error hiding edit dialog.");
                });
        });

    }

    return {
        link: link,
        require: '^^mdDataTable',
        restrict: 'A',
        scope: {
            data: '=',
            dateFormat: '@',
            maxNoteLength: '@'
        }
    };
}
