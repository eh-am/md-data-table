angular.module('md.data.table')
    .controller('EditDialogController', mdEditableDialogController)
    .directive('mdEditable', mdEditable);

function mdEditableDialogController($scope, $mdDialog, editType, fieldMaxLength, fieldRequired, dateFormat, fieldMaxDate, fieldMinDate, data, moment) {
    'use strict';

    $scope.editModel = {};

    $scope.fieldRequired = fieldRequired || false;
    $scope.editType = editType;
    $scope.fieldMaxLength = fieldMaxLength;


    if (fieldMinDate && (fieldMinDate instanceof Date)) {
        $scope.fieldMinDate = fieldMinDate;
    }

    if (fieldMaxDate && (fieldMaxDate instanceof Date)) {
        $scope.fieldMaxDate = fieldMaxDate;
    }

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
    };
}

function mdEditable($mdDialog, moment, $mdTable) {
    'use strict';

    function compile(tElement, tAttrs) {

        //find the row
        var row = tElement.parent();
        var ngRepeat = $mdTable.parse($mdTable.getAttr(row, 'ngRepeat'));

        //add data item attribute
        tAttrs.$set('rowData', ngRepeat.item);

        return link;
    }

    function link(scope, element, attrs, tableCtrl) {

        element.on('click', function (event) {
            event.stopPropagation();

            if (tableCtrl.hasAccess === 'false') {
                return;
            }

            if (scope.mdEditableDisabled === 'true') {
                return;
            }

            //find the row
            var row = element.parent();

            //check if the record was disabled
            if (scope.$parent.$eval($mdTable.getAttr(row, 'mdDisableSelect'))) {
                return;
            }

            //get type of edit field
            var type = attrs.mdEditable;

            //get row record
            var rowData = scope.rowData;
            var oldData;
            if (angular.isObject(scope.data)) {
                oldData = {};
                angular.copy(scope.data, oldData);
            }
            else {
                oldData = scope.data;
            }

            $mdDialog.show({
                    controller: 'EditDialogController',
                    locals: {
                        editType: type,
                        dateFormat: scope.dateFormat,
                        fieldMinDate: scope.fieldMinDate,
                        fieldMaxDate: scope.fieldMaxDate,
                        fieldMaxLength: scope.fieldMaxLength,
                        fieldRequired: scope.fieldRequired,
                        data: scope.data
                    },
                    templateUrl: 'md-data-table-edit.html',
                    parent: angular.element(document.body),
                    targetEvent: event,
                    clickOutsideToClose: true
                })
                .then(function (object) {
                    if (angular.isUndefined(object)) // the dialog was canceled
                        return;
                    if (true || object.data) { // disabled the incorrect check here to be able to save null
                        if (object.data === null) {
                            scope.data = null;
                        } else if (type === 'date' && scope.data && !(scope.data instanceof Date)) {
                            scope.data = moment(object.data).format(scope.dateFormat);
                        } else {
                            scope.data = object.data;
                        }
                        tableCtrl.processEdit(rowData, attrs.data, scope.data, function (oldItem) { //error callback
                            scope.rowData = oldItem; //revert the object
                            scope.data = oldData; //revert the property data
                        });
                    }
                }, function () {
                    console.log('Error hiding edit dialog.');
                });
        });
    }

    return {
        link: link,
        require: '^^mdTable',
        compile: compile,
        restrict: 'A',
        scope: {
            rowData: '=',
            data: '=', //object
            dateFormat: '@', //string
            mdEditableDisabled: '@',
            fieldMinDate: '=', //object
            fieldMaxDate: '=', //object
            fieldMaxLength: '@', //string
            fieldRequired: '@' //string
        }
    };
}

mdEditable.$inject = ['$mdDialog', 'moment', '$mdTable'];
