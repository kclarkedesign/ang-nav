var DAYSLICEURL = '/day__';
var TIMESLICEURL = '/time__';
var TYPESLICEURL = '/type__';
var AGESLICEURL = '/age__';
var SDATESLICEURL = '/sdate__';
var EDATESLICEURL = '/edate__';
var SORTSLICEURL = '/sort__';
var SEARCHSLICEURL = '/search__';

var logErrorToServer = function (ex, cwz) {
    try {
        $.ajax({
            type: "POST",
            url: "/handlers/LogJSErrors.ashx",
            contentType: "application/json",
            data: angular.toJson({
                errorUrl: window.location.href + " = " + navigator.userAgent,
                errorMessage: ex.message,
                stackTrace: ex.stack,
                cause: (cwz || "")
            })
        });
    }
    catch (err) {
        console.log(err.message);
    }
};

var isDate = function (checkDate) {
    return _.isDate(checkDate) || (Number(checkDate) > 0 && _.isFinite(Number(checkDate)) && _.isDate(new Date(checkDate))) ? true : false;
};

var resizeTileDisplay = function (scope) {

    var tileHeight, numColumns;
    scope.navListCtrl.environment = "desktop";
    if (window.matchMedia("(min-width: 1199px)").matches) {
        numColumns = 1;
        tileHeight = 211;
    } else if (window.matchMedia("(min-width: 991px)").matches) {
        numColumns = 1;
        tileHeight = 201;
    } else if (window.matchMedia("(min-width: 767px)").matches) {
        numColumns = 2;
        tileHeight = 450;
        scope.navListCtrl.environment = "mobile";
    } else {
        numColumns = 1;
        tileHeight = 139;
        scope.navListCtrl.environment = "mobile";
    }

    var headerHeight;
    if (scope.navListCtrl.environment === "mobile") {
        scope.navListCtrl.bodyStyle = { 'overflow-x': 'hidden', 'overflow-y': 'auto', '-webkit-overflow-scrolling': 'touch' };
        scope.navListCtrl.bottomContainerStyle = {};
        headerHeight = $("header").height();

    } else {
        headerHeight = $("#Container").offset().top;
        mainArea = $("#main-area").height();
        scope.navListCtrl.bodyStyle = { 'height': '100%', 'margin': '0', 'padding': '0', 'overflow': 'hidden' };
        scope.navListCtrl.bottomContainerStyle = { 'overflow-y': 'auto', '-webkit-overflow-scrolling': 'touch', 'overflow-x': 'hidden', 'height': (window.innerHeight - mainArea) - 50 + 'px' };
    }
    var pageHeight = $(window).height();
    var pageHeightWithoutHeader = pageHeight - headerHeight;
    var numRows = Math.ceil(pageHeightWithoutHeader / tileHeight);
    if (numRows === 0) {
        numRows++;
    }
    var limitToSet = numColumns * numRows;
    scope.navListCtrl.limit = limitToSet;
    scope.navListCtrl.numOfColumns = numColumns;
    scope.navListCtrl.origLimit = limitToSet + numColumns;
};

var adjustLevelArray = function (arr, start, end, clear) {
    //creates a blank new level in self.arrCategory
    for (var x = start; x <= end; x++) {
        if (_.isUndefined(arr[x]) || clear) {
            arr[x] = [];
        }
    }
    return end;
};

var isActualNumber = function (num) {
    return !isNaN(parseFloat(num)) && isFinite(num);
};

var seperateSlicersFromUrl = function (locationPath) {
    var cleanUrl = { path: '', removed: '' };
    var dayUrlLocation = locationPath.indexOf(DAYSLICEURL);
    var timeUrlLocation = locationPath.indexOf(TIMESLICEURL);
    var typeUrlLocation = locationPath.indexOf(TYPESLICEURL);
    var ageUrlLocation = locationPath.indexOf(AGESLICEURL);
    var sdateUrlLocation = locationPath.indexOf(SDATESLICEURL);
    var edateUrlLocation = locationPath.indexOf(EDATESLICEURL);
    var sortUrlLocation = locationPath.indexOf(SORTSLICEURL);
    var searchUrlLocation = locationPath.indexOf(SEARCHSLICEURL);
    var locations = [dayUrlLocation, timeUrlLocation, typeUrlLocation, ageUrlLocation, sdateUrlLocation, edateUrlLocation, sortUrlLocation, searchUrlLocation];
    var slcLocation = _.min(locations, function (n) {
        if (n >= 0) {
            return n;
        }
    });
    if (slcLocation >= 0) {
        cleanUrl.path = locationPath.substring(0, slcLocation);
        cleanUrl.removed = locationPath.substring(slcLocation);
    } else {
        cleanUrl.path = locationPath;
        cleanUrl.removed = '';
    }
    return cleanUrl;
};