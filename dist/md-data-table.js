angular.module('md.data.table', ['md.table.templates']);

angular.module('md.data.table').directive('mdColumnHeader', mdColumnHeader);

function mdColumnHeader($compile, $interpolate, $timeout) {
  'use strict';
  
  function postLink(scope, element, attrs, ctrls) {
    var tableCtrl = ctrls[0];
    var headCtrl = ctrls[1];
    var template = angular.element('<div></div>');
    
    template.text($interpolate.startSymbol() + 'name' + $interpolate.endSymbol());
    
    if(attrs.unit) {
      template.text(template.text() + ' (' + $interpolate.startSymbol() + 'unit' + $interpolate.endSymbol() + ')');
    }
    
    if(angular.isDefined(attrs.trim)) {
      template.contents().wrap('<div></div>');
    }
    
    if(attrs.orderBy) {
      var sortIcon = angular.element('<md-icon></md-icon>');
      
      var isActive = function () {
        return headCtrl.order === scope.order || headCtrl.order === '-' + scope.order;
      };
      
      var setOrder = function () {
        
        if(isActive()) {
          scope.$apply(headCtrl.order = headCtrl.order === scope.order ? '-' + scope.order : scope.order);
        } else {
          scope.$apply(headCtrl.order = angular.isDefined(attrs.descendFirst) ? '-' + scope.order : scope.order);
        }
        
        if(headCtrl.pullTrigger) {
          $timeout(headCtrl.pullTrigger);
        }
      };
      
      scope.getDirection = function () {
        if(isActive()) {
          return headCtrl.order[0] === '-' ? 'down' : 'up';
        }
        return angular.isDefined(attrs.descendFirst) ? 'down' : 'up';
      };
      
      sortIcon.attr('md-svg-icon', 'templates.arrow.html');
      sortIcon.attr('ng-class', 'getDirection()');
      
      if(angular.isDefined(attrs.numeric)) {
        template.prepend(sortIcon);
      } else {
        template.append(sortIcon);
      }
      
      element.on('click', setOrder);
      
      scope.$watch(isActive, function (active) {
        if(active) { element.addClass('md-active'); } else { element.removeClass('md-active'); }
      });
    }
    
    element.append($compile(template)(scope));
    
    if(headCtrl.isSignificant(element.parent())) {
      tableCtrl.setColumn(attrs);
      
      if(attrs.ngRepeat) {
        if(scope.$parent.$last) {
          tableCtrl.isReady.head.resolve();
        }
      } else if(tableCtrl.isLastChild(element.parent().children(), element[0])) {
        tableCtrl.isReady.head.resolve();
      }
    }
  }

  return {
    link: postLink,
    require: ['^^mdDataTable', '^mdTableHead'],
    scope: {
      name: '@',
      order: '@orderBy',
      unit: '@'
    }
  };
}

mdColumnHeader.$inject = ['$compile', '$interpolate', '$timeout'];

angular.module('md.data.table').directive('mdDataTable', mdDataTable);

function mdDataTable($mdTable) {
    'use strict';

    function compile(tElement, tAttrs) {
        var head = tElement.find('thead');
        var foot = tElement.find('tfoot');

        // make sure the table has a head element
        if (!head.length) {
            head = tElement.find('tbody').eq(0);

            if (head.children().find('th').length) {
                head.replaceWith('<thead>' + head.html() + '</thead>');
            } else {
                throw new Error('mdDataTable', 'Expecting <thead></thead> element.');
            }

            head = tElement.find('thead');
        }

        var rows = tElement.find('tbody').find('tr');

        head.attr('md-table-head', '');
        rows.attr('md-table-row', '');
        rows.find('td').attr('md-table-cell', '');

        if (foot.length) {
            foot.attr('md-table-foot', '');

            if (tAttrs.mdRowSelect) {
                foot.find('tr').prepend('<td></td>');
            }
        }

        rows.attr('md-select-row', ''); //always add this attribute, use other attributes to control this directive

        var ngRepeat = $mdTable.getAttr(rows, 'ngRepeat');

        if (tAttrs.mdRowSelect && !ngRepeat) {
            console.warn('Please use ngRepeat to enable row selection.');
        }

        if (head.attr('md-order') && !ngRepeat) {
            console.warn('Column ordering without ngRepeat is not supported.');
        }
    }

    function Controller($attrs, $element, $q, $scope) {
        var self = this;

        self.columns = [];
        self.classes = [];
        self.dirtyItems = [];
        self.isReady = {
            body: $q.defer(),
            head: $q.defer()
        };

        if ($attrs.mdRowSelect) {
            self.columns.push({isNumeric: false});

            if (!angular.isArray(self.selectedItems)) {
                self.selectedItems = [];
                // log warning for developer
                console.warn('md-row-select="' + $attrs.mdRowSelect + '" : ' +
                    $attrs.mdRowSelect + ' is not defined as an array in your controller, ' +
                    'i.e. ' + $attrs.mdRowSelect + ' = [], two-way data binding will fail.');
            }
        }

        if ($attrs.mdProgress) {
            $scope.$watch('$mdDataTableCtrl.progress', function () {
                var deferred = self.defer();
                $q.when(self.progress)['finally'](deferred.resolve);
            });
        }

        // support theming
        ['md-primary', 'md-hue-1', 'md-hue-2', 'md-hue-3'].forEach(function (mdClass) {
            if ($element.hasClass(mdClass)) {
                self.classes.push(mdClass);
            }
        });

        self.defer = function () {
            if (self.deferred) {
                self.deferred.reject('cancel');
            } else if (self.showProgress) {
                self.showProgress();
            }

            self.deferred = $q.defer();
            self.deferred.promise.then(self.resolve);

            return self.deferred;
        };

        self.resolve = function () {
            self.deferred = undefined;

            if (self.hideProgress) {
                self.hideProgress();
            }
        };

        self.isLastChild = function (siblings, child) {
            return Array.prototype.indexOf.call(siblings, child) === siblings.length - 1;
        };

        self.isReady.body.promise.then(function (ngRepeat) {
            if ($attrs.mdRowSelect && ngRepeat) {
                self.listener = $scope.$parent.$watch(ngRepeat.items, function (newValue, oldeValue) {
                    if (newValue !== oldeValue) {
                        self.selectedItems.splice(0);
                        self.dirtyItems.splice(0);
                    }
                });
            }
        });

        self.setColumn = function (column) {
            self.columns.push({
                isNumeric: angular.isDefined(column.numeric),
                unit: column.unit,
                name: column.name
            });
        };

        self.processEdit = function (rowData, propertyPath, propertyData, onError) {
            //remove duplicates
            $mdTable.removeDuplicates(self.dirtyItems, rowData.id);

            var oldItem = {};

            angular.copy(rowData, oldItem);

            //sync data
            $mdTable.updateObject(rowData, propertyPath, propertyData);

            //update dirty items
            self.dirtyItems.push({
                oldItem: oldItem,
                newItem: rowData
            });

            //call callback
            if (typeof self.rowUpdateCallback === 'function') {
                //execute the callback for each row
                var i = self.dirtyItems.length;
                var callback = self.rowUpdateCallback();
                var errorCallback = function () { //error callback
                    onError(item.oldItem);
                };
                while (i--) {
                    var item = self.dirtyItems[i];
                    callback(item, errorCallback);
                    self.dirtyItems.splice(i, 1); //remove the item from array
                }
            }
        };

        self.processEditSelect = function (rowData, oldItem, onError) {
            //remove duplicates
            $mdTable.removeDuplicates(self.dirtyItems, rowData.id);

            //update dirty items
            self.dirtyItems.push({
                oldItem: oldItem,
                newItem: rowData
            });

            //call callback
            if (typeof self.rowUpdateCallback === 'function') {
                //execute the callback for each row
                var i = self.dirtyItems.length;
                var callback = self.rowUpdateCallback();
                while (i--) {
                    var item = self.dirtyItems[i];
                    callback(item, onError);
                    self.dirtyItems.splice(i, 1); //remove the item from array
                }
            }
        };
    }

    Controller.$inject = ['$attrs', '$element', '$q', '$scope'];

    return {
        bindToController: {
            progress: '=mdProgress',
            selectedItems: '=mdRowSelect',
            rowUpdateCallback: '&mdRowUpdateCallback',
            rowClick: '=mdRowClick',
            hasAccess: '@'
        },
        compile: compile,
        controller: Controller,
        controllerAs: '$mdDataTableCtrl',
        restrict: 'A',
        scope: {}
    };
}

mdDataTable.$inject = ['$mdTable'];


angular.module('md.data.table').directive('mdTableCell', mdTableCell);

function mdTableCell() {
  'use strict';
  
  function postLink(scope, element) {
    var select = element.find('md-select');
    
    if(select.length) {
      
      select.on('click', function (event) {
        event.stopPropagation();
      });
      
      element.addClass('clickable').on('click', function (event) {
        event.stopPropagation();
        select[0].click();
      });
    }
  }
  
  function compile(tElement) {
    tElement.find('md-select').attr('md-container-class', 'md-table-select');
    return postLink;
  }
  
  return {
    compile: compile
  };
}

angular.module('md.data.table').directive('mdTableFoot', mdTableFoot);

function mdTableFoot() {
  'use strict';

  function postLink(scope, element, attrs, tableCtrl) {
    var cells = element.find('td');
    
    tableCtrl.columns.forEach(function(column, index) {
      if(column.isNumeric) {
        cells.eq(index).addClass('numeric');
      }
    });
    
    if(cells.length < tableCtrl.columns.length) {
      element.find('tr').append('<td colspan="' + (tableCtrl.columns.length - cells.length) + '"></td>');
    }
  }
  
  return {
    require: '^mdDataTable',
    link: postLink
  };
}

angular.module('md.data.table').directive('mdTableHead', mdTableHead);

function mdTableHead($mdTable, $q) {
  'use strict';

  function compile(tElement) {
    tElement.find('th').attr('md-column-header', '');
    
    // enable row selection
    if(tElement.parent().attr('md-row-select')) {
      var ngRepeat = $mdTable.getAttr(tElement.parent().find('tbody').find('tr'), 'ngRepeat');
      
      if(ngRepeat) {
        tElement.find('tr').prepend(angular.element('<th md-select-all="' + $mdTable.parse(ngRepeat).items + '"></th>'));
      }
    }
    
    tElement.after('<thead md-table-progress></thead>');
    
    return postLink;
  }
  
  function Controller($element, $scope) {
    var rows = $element.find('tr');
    
    if(!$scope.sigRow || parseInt($scope.sigRow, 10) === isNaN() || $scope.sigRow < 0) {
      $scope.sigRow = rows.length - 1;
    }
    
    // when tables headers have multiple rows we need a significant row
    // to append the checkbox to and to controll the text alignment for
    // numeric columns
    this.isSignificant = function (row) {
      return row.prop('rowIndex') === $scope.sigRow;
    };
  }
  
  function postLink(scope, element, attrs, tableCtrl) {
    var controller = element.data('$mdTableHeadController');
    
    // table progress
    if(angular.isFunction(scope.trigger)) {
      controller.pullTrigger = function () {
        var deferred = tableCtrl.defer();
        $q.when(scope.trigger(controller.order))['finally'](deferred.resolve);
      };
    }
  }
  
  Controller.$inject = ['$element', '$scope'];
  
  return {
    bindToController: {
      order: '=mdOrder'
    },
    compile: compile,
    controller: Controller,
    controllerAs: '$mdDataTableHeadCtrl',
    require: '^mdDataTable',
    scope: {
      trigger: '=?mdTrigger',
      sigRow: '=?'
    }
  };
}

mdTableHead.$inject = ['$mdTable', '$q'];

angular.module('md.data.table')
    .filter('mdStartFrom', function () {
        'use strict';

        return function (input, start) {
            if (!input || !input.length) {
                return;
            }
            start = +start; //parse to int
            return input.slice(start); //adjust the page, starting from page 1
        };
    })
    .directive('mdDataTablePagination', mdDataTablePagination);

function mdDataTablePagination($q) {
    'use strict';

    function postLink(scope, element, attrs) {
        scope.paginationLabel = {
            text: 'Rows per page:',
            of: 'of'
        };

        if (angular.isObject(scope.label)) {
            angular.extend(scope.paginationLabel, scope.label);
        }

        // table progress
        if (angular.isFunction(scope.trigger)) {

            // the pagination directive is outside the table directive so we need
            // to locate the controller
            var findTable = function (element, callback) {
                while (element.localName !== 'md-data-table-container' && element.previousElementSibling) {
                    element = element.previousElementSibling;
                }
                callback(angular.element(element.firstElementChild));
            };

            var setTrigger = function (table) {
                var tableCtrl = table.controller('mdDataTable');

                if (!tableCtrl) {
                    return console.warn('Table Pagination: Could not locate your table directive, your ' + attrs.mdTrigger + ' function will not work.');
                }

                scope.pullTrigger = function () {
                    var deferred = tableCtrl.defer();
                    $q.when(scope.trigger(scope.page, scope.limit))['finally'](deferred.resolve);
                };
            };

            findTable(element.prop('previousElementSibling'), setTrigger);
        }

        scope.$watch('data', function (value) {
            if (value) {
                scope.total = value.length;
            }
        });
    }

    function Controller($scope, $timeout) {
        var min = 1;

        $scope.hasNext = function () {
            return (($scope.page * $scope.limit) < $scope.total);
        };

        $scope.hasPrevious = function () {
            return ($scope.page > 1);
        };

        $scope.next = function () {
            $scope.page++;

            if ($scope.pullTrigger) {
                $timeout($scope.pullTrigger);
            }

            min = $scope.min();
        };

        $scope.last = function () {
            $scope.page = Math.ceil($scope.total / $scope.limit);

            if ($scope.pullTrigger) {
                $timeout($scope.pullTrigger);
            }

            min = $scope.min();
        };

        $scope.min = function () {
            return ((($scope.page - 1) * $scope.limit) + 1);
        };

        $scope.max = function () {
            return $scope.hasNext() ? $scope.page * $scope.limit : $scope.total;
        };

        $scope.onSelect = function () {
            $scope.page = Math.floor(min / $scope.limit) + 1;

            if ($scope.pullTrigger) {
                $timeout($scope.pullTrigger);
            }

            min = $scope.min();
            while ((min > $scope.total) && $scope.hasPrevious()) {
                $scope.previous();
            }
        };

        $scope.previous = function () {
            $scope.page--;

            if ($scope.pullTrigger) {
                $timeout($scope.pullTrigger);
            }

            min = $scope.min();
        };

        $scope.first = function () {
            $scope.page = 1;

            if ($scope.pullTrigger) {
                $timeout($scope.pullTrigger);
            }

            min = $scope.min();
        };
    }

    Controller.$inject = ['$scope', '$timeout'];

    return {
        controller: Controller,
        scope: {
            label: '=mdLabel',
            limit: '=mdLimit',
            page: '=mdPage',
            data: '=mdData',
            rowSelect: '=mdRowSelect',
            total: '@mdTotal',
            trigger: '=mdTrigger',
            showRowSelection: '=mdShowRowSelection',
            showFirstLast: '=mdShowFirstLast'
        },
        templateUrl: 'templates.md-data-table-pagination.html',
        link: postLink
    };
}

mdDataTablePagination.$inject = ['$q'];

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


angular.module('md.data.table').directive('mdTableRow', mdTableRow);

function mdTableRow($mdTable, $timeout) {
    'use strict';

    function postLink(scope, element, attrs, tableCtrl) {

        if (angular.isDefined(attrs.mdSelectRow)) {
            scope.mdClasses = tableCtrl.classes;

            scope.isDisabled = function () {
                return scope.$eval(attrs.mdDisableSelect);
            };

            scope.isSelected = function (item) {
                return tableCtrl.selectedItems.indexOf(item) !== -1;
            };

            scope.toggleRow = function (item, event) {
                event.stopPropagation();

                if (scope.isDisabled()) {
                    return;
                }

                if (scope.isSelected(item)) {
                    tableCtrl.selectedItems.splice(tableCtrl.selectedItems.indexOf(item), 1);
                } else {
                    tableCtrl.selectedItems.push(item);
                }
            };

            scope.clickRow = function (item, event) {
                event.stopPropagation();

                if (scope.isDisabled()) {
                    return;
                }

                if (typeof tableCtrl.rowClick === 'function') {
                    tableCtrl.rowClick(item);
                }
            };
        }

        if (attrs.ngRepeat) {
            if (scope.$last) {
                tableCtrl.isReady.body.resolve($mdTable.parse(attrs.ngRepeat));
            }
        } else if (tableCtrl.isLastChild(element.parent().children(), element[0])) {
            tableCtrl.isReady.body.resolve();
        }

        tableCtrl.isReady.head.promise.then(function () {
            tableCtrl.columns.forEach(function (column, index) {
                if (column.isNumeric) {
                    var cell = element.children().eq(index);

                    cell.addClass('numeric');

                    if (angular.isDefined(cell.attr('show-unit'))) {
                        $timeout(function () {
                            cell.text(cell.text() + tableCtrl.columns[index].unit);
                        });
                    }
                }
            });
        });

    }

    return {
        link: postLink,
        require: '^^mdDataTable'
    };
}

mdTableRow.$inject = ['$mdTable', '$timeout'];

angular.module('md.data.table').factory('$mdTable', mdTableService);

function mdTableService() {
    'use strict';

    var cache = {};

    function Repeat(ngRepeat) {
        this._tokens = ngRepeat.split(/\s+/);
        this._iterator = 0;

        this.item = this.current();
        while (this.hasNext() && this.getNext() !== 'in') {
            this.item += this.current();
        }

        this.items = this.getNext();
        while (this.hasNext() && ['|', 'track'].indexOf(this.getNext()) === -1) {
            this.items += this.current();
        }
    }

    Repeat.prototype.current = function () {
        return this._tokens[this._iterator];
    };

    Repeat.prototype.getNext = function () {
        return this._tokens[++this._iterator];
    };

    Repeat.prototype.getValue = function () {
        return this._tokens.join(' ');
    };

    Repeat.prototype.hasNext = function () {
        return this._iterator < this._tokens.length - 1;
    };

    /**
     * Get the value of an atribute given its normalized name.
     *
     * @param {jqLite} element - A jqLite element.
     * @param {string} attr - The normalized name of the attribute.
     * @returns {string} - The value of the attribute.
     */
    function getAttr(element, attr) {
        var attrs = element.prop('attributes');

        for (var i = 0; i < attrs.length; i++) {
            if (normalize(attrs.item(i).name) === attr) {
                return attrs.item(i).value;
            }
        }

        return '';
    }

    /**
     * Normalizes an attribute's name.
     *
     * @param {string} attr - The original name of the attribute.
     * @returns {string} - The normalized name of the attribute.
     */
    function normalize(attr) {
        var tokens = attr.replace(/^((?:x|data)[\:\-_])/i, '').split(/[\:\-_]/);
        var normal = tokens.shift();

        tokens.forEach(function (token) {
            normal += token.charAt(0).toUpperCase() + token.slice(1);
        });

        return normal;
    }

    function parse(ngRepeat) {
        if (!cache.hasOwnProperty(ngRepeat)) {
            return (cache[ngRepeat] = new Repeat(ngRepeat));
        }

        return cache[ngRepeat];
    }


    /**
     * Remove object from array with a given key
     *
     * @param items
     * @param key
     */
    function removeDuplicates(items, key) {
        if (items.length > 0) {
            angular.forEach(items, function (item, i) {
                if (item.id === key) {
                    items.splice(i, 1);
                    return false;
                }
            });
        }
    }

    /**
     * This sets the object property based on the property path provided.
     * The object name is included in the property.
     *
     * var test = {property:value}
     *
     * prop should be test.property
     *
     * @param obj
     * @param prop
     * @param value
     */
    function setDeepValue(obj, prop, value) {
        if (typeof prop === 'string') {
            prop = prop.split('.');
            prop.shift(); //remove the object name
        }

        if (prop.length > 1) {
            var e = prop.shift();
            setDeepValue(obj[e] = Object.prototype.toString.call(obj[e]) === '[object Object]' ? obj[e] : {}, prop, value);
        } else {
            obj[prop[0]] = value;
        }
    }

    return {
        getAttr: getAttr,
        normalize: normalize,
        parse: parse,
        removeDuplicates: removeDuplicates,
        updateObject: setDeepValue
    };

}

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
        //console.log('scope editType is', $scope.editType);
        var $form, inputText, inputValue;

        $form = angular.element('form[name="inlineEditForm"]');
        // I was going this way but then saw that our workaround is necessary only for mdDatepicker
        //switch ($scope.editType) {
        //    case 'text':
        //    case 'number':
        //    case 'email':
        //        inputValue = $form.find('input').val();
        //        break;
        //    case 'note':
        //        inputValue = $form.find('textarea').val();
        //        break;
        //    case 'date':
        //        inputText = $form.find('input').val();
        //        inputValue = moment(inputText, $scope.dateFormat).toDate();
        //        break;
        //}

        if ($scope.editType === 'date') {
            inputText = $form.find('input').val();
            inputValue = moment(inputText, $scope.dateFormat).toDate();
            //console.log('hiding inline edit with', inputValue)
            $mdDialog.hide({data: inputValue});
        } else {
            //console.log('hiding inline edit with', $scope.editModel.data)
            $mdDialog.hide({data: $scope.editModel.data});
        }
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
                    templateUrl: 'templates.md-data-table-edit.html',
                    parent: angular.element(document.body),
                    targetEvent: event,
                    clickOutsideToClose: true
                })
                .then(function (object) {
                    if (angular.isUndefined(object)) // the dialog was canceled
                        return;
                    scope.data = object.data;
                    tableCtrl.processEdit(rowData, attrs.data, scope.data, function (oldItem) { //error callback
                        scope.rowData = oldItem; //revert the object
                        scope.data = oldData; //revert the property data
                    });
                }, function () {
                    console.log('Error hiding edit dialog.');
                });
        });
    }

    return {
        compile: compile,
        require: '^^mdDataTable',
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


angular.module('md.data.table').directive('mdSelectAll', mdSelectAll);

function mdSelectAll() {
  'use strict';
  
  function template(tElement) {
    var checkbox = angular.element('<md-checkbox></md-checkbox>');
    
    checkbox.attr('aria-label', 'Select All');
    checkbox.attr('ng-click', 'toggleAll()');
    checkbox.attr('ng-class', 'mdClasses');
    checkbox.attr('ng-checked', 'allSelected()');
    checkbox.attr('ng-disabled', '!getCount()');
    
    tElement.append(checkbox);
  }
  
  function postLink(scope, element, attrs, tableCtrl) {
    var count = 0;
    
    var getSelectableItems = function() {
      return scope.items.filter(function (item) {
        return !tableCtrl.isDisabled(item);
      });
    };
    
    tableCtrl.isReady.body.promise.then(function () {
      scope.mdClasses = tableCtrl.classes;
      
      scope.getCount = function() {
        return (count = !scope.items?0:scope.items.reduce(function(sum, item) {
          return tableCtrl.isDisabled(item) ? sum : ++sum;
        }, 0));
      };
      
      scope.allSelected = function () {
        return count && count === tableCtrl.selectedItems.length;
      };
      
      scope.toggleAll = function () {
        var selectableItems = getSelectableItems(scope.items);
        
        if(selectableItems.length === tableCtrl.selectedItems.length) {
          tableCtrl.selectedItems.splice(0);
        } else {
          tableCtrl.selectedItems = selectableItems;
        }
      };
    });
  }
  
  return {
    link: postLink,
    require: '^^mdDataTable',
    scope: {
      items: '=mdSelectAll'
    },
    template: template
  };
}


angular.module('md.data.table').directive('mdSelectRow', mdSelectRow);

function mdSelectRow($mdTable) {
    'use strict';

    function template(tElement, tAttrs) {
        var ngRepeat = $mdTable.parse(tAttrs.ngRepeat);

        if (!angular.isDefined(tAttrs.mdNoCheckbox)) { //attribute present do not add the checkbox
            var checkbox = angular.element('<md-checkbox></md-checkbox>');

            checkbox.attr('aria-label', 'Select Row');
            checkbox.attr('ng-click', 'toggleRow(' + ngRepeat.item + ', $event)');
            checkbox.attr('ng-class', 'mdClasses');
            checkbox.attr('ng-checked', 'isSelected(' + ngRepeat.item + ')');
            if (tAttrs.mdDisableSelect) {
                checkbox.attr('ng-disabled', 'isDisabled()');
            }

            tElement.prepend(angular.element('<td></td>').append(checkbox));

            if (angular.isDefined(tAttrs.mdAutoSelect)) { //if attribute present add toggle function to the row, additional to the toggle function on the check box
                tAttrs.$set('ngClick', 'toggleRow(' + ngRepeat.item + ', $event)');
            }

            tAttrs.$set('ngClass', '{\'md-selected\': isSelected(' + ngRepeat.item + ')}');
        }

        if (angular.isDefined(tAttrs.mdNoSelect)) { //attribute present add click event to the row
            tAttrs.$set('ngClick', 'clickRow(' + ngRepeat.item + ', $event)');
        }
    }

    function postLink(scope, element, attrs, tableCtrl) {
        var model = {};
        var ngRepeat = $mdTable.parse(attrs.ngRepeat);

        if (!angular.isFunction(scope.isDisabled)) {
            scope.isDisabled = function () {
                return false;
            };
        }

        tableCtrl.isDisabled = function (item) {
            model[ngRepeat.item] = item;
            return scope.isDisabled(model);
        };
    }

    return {
        link: postLink,
        priority: 1001,
        require: '^^mdDataTable',
        scope: {
            isDisabled: '&?mdDisableSelect'
        },
        template: template
    };
}

mdSelectRow.$inject = ['$mdTable'];


angular.module('md.data.table')
    .directive('mdSelectUpdateCallback', mdSelectUpdateCallback);
/**
 * This directive for the md-select in the md table cell.  The md-select has bugs when it comes to on change event and track by value.
 * The on change event is fired for every item in the list. With this directive we can control the events.
 */
function mdSelectUpdateCallback() {
    'use strict';

    return {
        restrict: 'A',
        require: '^^mdDataTable',
        link: function (scope, element, attrs, tableCtrl) {

            scope.enableOnChange = false;

            var oldItem = {};

            scope.$watch(attrs.ngModel, function (newValue) {
                if (scope.enableOnChange && newValue !== undefined) {

                    scope.enableOnChange = false;

                    var rowData = scope[attrs.ngModel.split('.')[0]];

                    tableCtrl.processEditSelect(rowData,oldItem,function () { //error callback
                        angular.copy(oldItem,scope[attrs.ngModel.split('.')[0]]);
                    });
                }
            });

            //enable the watcher only when the user interacts with the select
            element.on('click', function () {
                if (!scope.enableOnChange) {
                    scope.enableOnChange = true;
                }

                angular.copy(scope[attrs.ngModel.split('.')[0]], oldItem);
            });
        }
    };
}

mdSelectUpdateCallback.$inject = ['$mdTable'];

angular.module('md.table.templates', ['templates.arrow.html', 'templates.navigate-before.html', 'templates.navigate-first.html', 'templates.navigate-last.html', 'templates.navigate-next.html', 'templates.md-data-table-edit.html', 'templates.md-data-table-pagination.html', 'templates.md-data-table-progress.html']);

angular.module('templates.arrow.html', []).run(['$templateCache', function($templateCache) {
  'use strict';
  $templateCache.put('templates.arrow.html',
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path d="M3,9 L4.06,10.06 L8.25,5.87 L8.25,15 L9.75,15 L9.75,5.87 L13.94,10.06 L15,9 L9,3 L3,9 L3,9 Z"/></svg>');
}]);

angular.module('templates.navigate-before.html', []).run(['$templateCache', function($templateCache) {
  'use strict';
  $templateCache.put('templates.navigate-before.html',
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>\n' +
    '');
}]);

angular.module('templates.navigate-first.html', []).run(['$templateCache', function($templateCache) {
  'use strict';
  $templateCache.put('templates.navigate-first.html',
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M7 6 v12 h2 v-12 h-2z M17.41 7.41L16 6l-6 6 6 6 1.41-1.41L12.83 12z"/></svg>\n' +
    '');
}]);

angular.module('templates.navigate-last.html', []).run(['$templateCache', function($templateCache) {
  'use strict';
  $templateCache.put('templates.navigate-last.html',
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M15 6 v12 h2 v-12 h-2z M8 6L6.59 7.41 11.17 12l-4.58 4.59L8 18l6-6z"/></svg>\n' +
    '');
}]);

angular.module('templates.navigate-next.html', []).run(['$templateCache', function($templateCache) {
  'use strict';
  $templateCache.put('templates.navigate-next.html',
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>\n' +
    '');
}]);

angular.module('templates.md-data-table-edit.html', []).run(['$templateCache', function($templateCache) {
  'use strict';
  $templateCache.put('templates.md-data-table-edit.html',
    '<md-dialog aria-label="Edit" ng-cloak>\n' +
    '    <form name="inlineEditForm" novalidate>\n' +
    '        <md-toolbar>\n' +
    '            <div class="md-toolbar-tools">\n' +
    '                <h2>Edit</h2>\n' +
    '            </div>\n' +
    '        </md-toolbar>\n' +
    '        <md-dialog-content style="width:300px;max-width:800px;max-height:220px;" layout="column"\n' +
    '                           layout-align="center center">\n' +
    '            <div class="md-dialog-content">\n' +
    '                <div ng-switch on="editType">\n' +
    '                    <div ng-switch-when="date">\n' +
    '                        <md-datepicker name="dateField"\n' +
    '                                       ng-model="editModel.data"\n' +
    '                                       ng-required="fieldRequired"\n' +
    '                                       md-max-date="fieldMaxDate"\n' +
    '                                       md-min-date="fieldMinDate"\n' +
    '                                       md-placeholder="Enter date"\n' +
    '                                       aria-label="date"></md-datepicker>\n' +
    '\n' +
    '                        <div class="validation-messages" ng-messages="inlineEditForm.dateField.$error"\n' +
    '                             ng-if="inlineEditForm.dateField.$error">\n' +
    '                            <div ng-message="required">You did not enter a field</div>\n' +
    '                            <div ng-message="maxdate">Date is too late!</div>\n' +
    '                            <div ng-message="mindate">Date is too early!</div>\n' +
    '                        </div>\n' +
    '                    </div>\n' +
    '                    <div ng-switch-when="note">\n' +
    '                        <md-input-container class="md-block">\n' +
    '                                <textarea name="textareaField"\n' +
    '                                          aria-label="textarea"\n' +
    '                                          ng-model="editModel.data"\n' +
    '                                          md-maxlength="{{fieldMaxLength}}"\n' +
    '                                          rows="5"\n' +
    '                                          ng-required="fieldRequired"\n' +
    '                                          style="overflow-y: auto;width:250px;"\n' +
    '                                >\n' +
    '                                </textarea>\n' +
    '\n' +
    '                            <div ng-messages="inlineEditForm.textareaField.$error"\n' +
    '                                 ng-if="inlineEditForm.textareaField.$error">\n' +
    '                                <div ng-message="required">You did not enter a field</div>\n' +
    '                                <div ng-message="md-maxlength">Your field is too long</div>\n' +
    '                            </div>\n' +
    '                        </md-input-container>\n' +
    '                    </div>\n' +
    '                    <div ng-switch-default>\n' +
    '                        <md-input-container>\n' +
    '                            <input name="inputField"\n' +
    '                                   ng-model="editModel.data"\n' +
    '                                   type="{{editType}}"\n' +
    '                                   md-maxlength="{{fieldMaxLength}}"\n' +
    '                                   ng-required="fieldRequired"\n' +
    '                                   aria-label="input">\n' +
    '\n' +
    '                            <div ng-messages="inlineEditForm.inputField.$error"\n' +
    '                                 ng-if="inlineEditForm.inputField.$error">\n' +
    '                                <div ng-message="required">You did not enter a field</div>\n' +
    '                                <div ng-message="md-maxlength">Your field is too long</div>\n' +
    '                            </div>\n' +
    '                        </md-input-container>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <!--pre>\n' +
    '                dateField.$error = {{ inlineEditForm.dateField.$error | json }}\n' +
    '                textareaField.$error = {{ inlineEditForm.textareaField.$error | json }}\n' +
    '                inputField.$error = {{ inlineEditForm.inputField.$error | json }}\n' +
    '            </pre-->\n' +
    '        </md-dialog-content>\n' +
    '        <md-dialog-actions layout="row">\n' +
    '            <span flex></span>\n' +
    '            <md-button ng-click="close()">Cancel</md-button>\n' +
    '            <md-button class="md-raised md-primary" ng-disabled="inlineEditForm.$invalid" ng-click="save()">Save\n' +
    '            </md-button>\n' +
    '        </md-dialog-actions>\n' +
    '    </form>\n' +
    '</md-dialog>');
}]);

angular.module('templates.md-data-table-pagination.html', []).run(['$templateCache', function($templateCache) {
  'use strict';
  $templateCache.put('templates.md-data-table-pagination.html',
    '<div>\n' +
    '  <span class="label" ng-show="showRowSelection">{{paginationLabel.text}}</span>\n' +
    '  <md-select ng-show="showRowSelection" ng-model="limit" md-container-class="md-pagination-select" ng-change="onSelect()" aria-label="Row Count" placeholder="{{rowSelect ? rowSelect[0] : 5}}">\n' +
    '    <md-option ng-repeat="rows in rowSelect ? rowSelect : [5, 10, 15]" ng-value="rows">{{rows}}</md-option>\n' +
    '  </md-select>\n' +
    '  <span>{{min()}} - {{max()}} {{paginationLabel.of}} {{total}}</span>\n' +
    '</div>\n' +
    '<div>\n' +
    '  <md-button ng-show="showFirstLast" type="button" ng-click="first()" ng-disabled="!hasPrevious()" aria-label="First">\n' +
    '    <md-icon md-svg-icon="templates.navigate-first.html"></md-icon>\n' +
    '  </md-button>\n' +
    '  <md-button type="button" ng-click="previous()" ng-disabled="!hasPrevious()" aria-label="Previous">\n' +
    '    <md-icon md-svg-icon="templates.navigate-before.html"></md-icon>\n' +
    '  </md-button>\n' +
    '  <md-button type="button" ng-click="next()" ng-disabled="!hasNext()" aria-label="Next">\n' +
    '    <md-icon md-svg-icon="templates.navigate-next.html"></md-icon>\n' +
    '  </md-button>\n' +
    '  <md-button ng-show="showFirstLast" type="button" ng-click="last()" ng-disabled="!hasNext()" aria-label="Last">\n' +
    '    <md-icon md-svg-icon="templates.navigate-last.html"></md-icon>\n' +
    '  </md-button>\n' +
    '</div>\n' +
    '');
}]);

angular.module('templates.md-data-table-progress.html', []).run(['$templateCache', function($templateCache) {
  'use strict';
  $templateCache.put('templates.md-data-table-progress.html',
    '<thead ng-if="showProgress">\n' +
    '  <tr>\n' +
    '    <th colspan="{{columnCount}}">\n' +
    '      <md-progress-linear md-mode="indeterminate"></md-progress-linear>\n' +
    '    </th>\n' +
    '  </tr>\n' +
    '</thead>');
}]);
