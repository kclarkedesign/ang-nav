(function () {
	'use strict';
	var STARTINGLEVEL = 0;
	var MAXLEVEL = 0;
	var INITIALIZING = true;
	var DAYSLICEURL = '/day__';
	var TIMESLICEURL = '/time__';
	var TYPESLICEURL = '/type__';
	var AGESLICEURL = '/age__';
	var SDATESLICEURL = '/sdate__';
	var EDATESLICEURL = '/edate__';
	var SORTSLICEURL = '/sort__';
	var SEARCHSLICEURL = '/search__';
	var MICROSITESOA = {
		classes: 'promo-item SOA',
		aClass: '',
		aHref: '/Uptown/School-of-the-Arts',
		img: 'School of the Arts',
		id: 'SOA'
	};
	var MICROSITEFINEART = {
		classes: 'promo-item Art studioArt',
		aClass: '',
		aHref: '/SOA/Studio-Art',
		img: 'Fine Art &amp; Design',
		id: 'fineart'
	};
	var MICROSITECERAMICS = {
		classes: 'promo-item Art ceramics',
		aClass: '',
		aHref: '/SOA/Ceramics',
		img: 'Ceramics',
		id: 'ceramics'
	};
	var MICROSITEJEWELRY = {
		classes: 'promo-item Art jewelry',
		aClass: '',
		aHref: '/SOA/Jewelry.aspx',
		img: 'Jewelry Center',
		id: 'jewelry'
	};
	var MICROSITEMUSIC = {
		classes: 'promo-item Music',
		aClass: '',
		aHref: '/SOA/School-of-Music',
		img: 'Music',
		id: 'music'
	};
	var MICROSITEINSTRUCT = {
		classes: 'promo-item Music instruct',
		aClass: 'group-private',
		aHref: '/Uptown/School-of-the-Arts/School-of-Music/Private-Instruction.aspx',
		img: 'Private &amp; Semi-Private Instruction',
		id: 'instruct'
	};
	var MICROSITEDANCE = {
		classes: 'promo-item Dance',
		aClass: '',
		aHref: '/Uptown/School-of-the-Arts/Harkness-Dance-Center',
		img: 'Dance',
		id: 'dance'
	};
	var MICROSITERK = {
		classes: 'promo-item rk-program',
		aClass: '',
		aHref: '/Uptown/School-of-the-Arts/Scholarship-Programs/Recanati-Kaplan-Program-for-Excellence-in-the-Arts',
		img: 'Recanati Kaplan Scholars',
		id: 'rk'
	};
	var MICROSITELIST = [MICROSITESOA, MICROSITEFINEART, MICROSITECERAMICS, MICROSITEJEWELRY, MICROSITEMUSIC, MICROSITEINSTRUCT, MICROSITEDANCE, MICROSITERK];
	var WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	var DAYPARTS = ['morning', 'afternoon', 'evening'];
	var LOADINGNODEID = 0;
	var ERRORLOADINGNODEID = -1;

	var navApp = angular.module('artNavApp', ['angularLocalStorage', 'wu.masonry', 'infinite-scroll', 'ui.bootstrap', 'ngScrollSpy']);
	var NavListController = function ($scope, tileInfoSrv, $location, $timeout, storage, $window) {
		var self = this;
		self.allClasses = [{Name: '', NodeID: LOADINGNODEID}];
		self.arrCategory = [];
		self.location = $location;
		self.timeout = $timeout;
		self.JumpNav = {};
		self.navsDict = {};
		self.onscreenResults = [];
		self.classesByNodeId = {};
		self.opened = {};
		self.minBegDate = new Date();
		self.minEndDate = new Date();
		self.maxDate = new Date();
		self.maxDate = self.maxDate.setFullYear(self.maxDate.getFullYear() + 1);
		self.times = _.clone(DAYPARTS);
		self.days = _.clone(WEEKDAYS);
		var shiftDay = self.days.shift();
		self.days.push(shiftDay);
		self.initDaySlice = 'all';
		self.initTimeSlice = 'all';
		self.initSdateSlice = undefined;
		self.initEdateSlice = undefined;
		self.initAgeSlice = 'all';
		self.initSortOrder = 'all';
		self.soonestSortSelected = false;
		self.showSpinner = false;
		self.debounceSearch = _.debounce(function () { self.modifyUrlSearch(false); }, 2000);
		self.applyScope = function () { $scope.$apply(); };
		self.enabledFilters = {};

		storage.bind($scope, 'navListCtrl.savedSearches', { defaultValue: [] });
		storage.bind($scope, 'navListCtrl.savedPrograms', { defaultValue: [] });

		self.tileInfoSrv = tileInfoSrv;
		self.tileInfoSrv.getSOAItems().then(function (items) {
			self.navsDict["School Of The Arts"] = items.data;
			self.tileInfoSrv.getAllClasses('items/Filters.json').then(function (data) {
				self.getAllInitialClasses(data);
			}, function (respData) {
				self.tileInfoSrv.getAllClasses('http://stage2.92y.org/webservices/categoryproduction.svc/FilterNodes/28219/').then(function (data) {
					self.allClasses = [];
					self.getAllInitialClasses(data);
				}).finally(function() {
					if (self.allClasses.length === 0) {
						self.allClasses = [{Name: 'Error loading data.  Click to refresh.', NodeID: ERRORLOADINGNODEID}];
					}
				});
			});
		});
		self.log = function (variable) {
			console.log(variable);
		};

		var w = angular.element($window);
		w.bind('resize', function () {
			if (!_.isUndefined(self.currentObj)) {
				resizeTileDisplay($scope);
				self.onscreenResults = [];
				self.displayTiles();
				self.loadMore();
				$scope.$apply();
			}
		});
		$scope.$watch(function () {
			return self.location.path();
		}, function (){
			if (INITIALIZING) {
				$timeout(function() { INITIALIZING = false; });
			} else {
				var locationPath = self.location.path();
				var locationObj = seperateSlicersFromUrl(locationPath);
				locationPath = locationObj.path;
				var numOfSlashesLocation = (locationPath.match(/\//g) || []).length;

				//if JumpNav is empty then we know back or forward button was used otherwise it will be set by one of the links
				switch (self.JumpNav.Type) {
					case 'linkTo':
						// if child link on right side clicked
						var cloneCurrentObj = {
							Level: self.currentObj.Level,
							Name: self.currentObj.Name,
							NodeID: self.currentObj.NodeID,
							Current: self.currentObj.Current
						};
						var lastCurrent = _.find(self.activeBreadcrumb, 'Current');
						if (!_.isUndefined) {
							lastCurrent.Current = false;	
						}
						self.activeBreadcrumb.push(cloneCurrentObj);
						break;
					case 'linkBack':
						// if link in active breadcrumb is clicked
						var lastLocationPath = self.lastLocationPath;
						var lastLocationObj = seperateSlicersFromUrl(lastLocationPath);
						lastLocationPath = lastLocationObj.path;
						var numOfSlashesLastLocation = (lastLocationPath.match(/\//g) || []).length;

						if (locationPath === '/') {
							self.activeBreadcrumb = self.activeBreadcrumb.slice(0, 1);
						} else {
							for (var x = 0; x < numOfSlashesLastLocation - numOfSlashesLocation; x++){
								self.activeBreadcrumb.pop();
							}
						}
						var nextCurrent = _.last(self.activeBreadcrumb);
						nextCurrent.Current = true;
						break;
					case 'jumpTo':
						// if link in saved breadCrumb is clicked
						if (locationPath === '/') {
							self.activeBreadcrumb = self.activeBreadcrumb.slice(0, 1);
						} else {
							for (var x = self.activeBreadcrumb.length - 1; x >= 0; x--){
								var breadCrumb = self.activeBreadcrumb[x];
								if (breadCrumb.NodeID === self.currentObj.NodeID) {
									break;
								}
								self.activeBreadcrumb.pop();
							}
						}
						var nextCurrent = _.last(self.activeBreadcrumb);
						nextCurrent.Current = true;
						break;
					case 'sliceBy':
						// if slicer is selected
						// since we don't change position, just filters, we can skip all the link stuff
						break;
					default:
						// if browser back and forward buttons used for unpredictable jumps
						if (self.arrCategory[0].length === 0) {
							var subfolders = locationPath.substring(1).split('/');
							var classIndex = _.findIndex(self.allClasses, {'Name': subfolders[0]});
							var classesByInterest = [self.allClasses[classIndex]];
							self.getValues(classesByInterest, 0, self.navsDict[subfolders[0]]);
						}
						self.buildCurrentObj();
						break;
				}
				self.displayTiles();
				self.lastLocationPath = locationPath + locationObj.removed;
				self.JumpNav = {};
				self.limit = self.origLimit;
			}
		});
	};

	NavListController.prototype.getAllInitialClasses = function (data) {
		//todo:  note for the future - to handle more interest areas the following must be expanded and handled differently
		var self = this;
		self.allClasses.push.apply(self.allClasses, data.data);
		var locationPath = self.location.path();
		if (locationPath.length && locationPath !== '/') {
			var match = locationPath.match(/^\/(.+?)(\/|$)/);
			var interestFolder = match[1];
			var classesByInterest = [_.find(self.allClasses, {'Name' : interestFolder })];
			self.displayMicroSites(locationPath);
			self.getValues(classesByInterest, 0, self.navsDict["School Of The Arts"]);
			self.buildCurrentObj();
			self.displayTiles();
		}
	};

	NavListController.prototype.interestClicked = function (subLevel) {
		var self = this;
		var currentName = subLevel.Name;
		if (!_.isUndefined(self.currentObj) && currentName === self.currentObj.Name || (_.isUndefined(self.currentObj) && subLevel.NodeID === LOADINGNODEID)) {
			return;
		}
		if (_.isUndefined(self.currentObj) && subLevel.NodeID === ERRORLOADINGNODEID) {
			location.reload();
		}
		adjustLevelArray(self.arrCategory, 0, self.arrCategory.length, true);

		var classIndex = _.findIndex(self.allClasses, {'Name': subLevel.Name});
		var classesByInterest = [self.allClasses[classIndex]];
		self.getValues(classesByInterest, 0, self.navsDict[subLevel.Name]);

		var locationPath = self.location.path();
		var locationObj = seperateSlicersFromUrl(locationPath);
		var locationSlicers = locationObj.removed;
		self.populateSlicers(locationSlicers);

		if (_.isUndefined(self.currentObj)) {
			self.currentObj = {};
		}
		self.activeBreadcrumb = [];
		if (_.isUndefined(self.lastLocationPath)) {
			self.lastLocationPath = '';
		}
		self.currentObj.Level = 0;
		self.currentObj.Name = currentName;
		self.currentObj.NodeID = subLevel.NodeID;
		self.currentObj.Current = true;
		self.JumpNav = { To: currentName, Type: 'linkTo' };
		self.setUrl(currentName, 'replace');
	};

	NavListController.prototype.displayMicroSites = function (currentUrl) {
		var self = this;
		if (currentUrl.indexOf('School Of The Arts') >= 0) {
			if (_.isUndefined(self.microsites) || self.microsites.length === 0) {
				self.microsites = _.clone(MICROSITELIST);
				if (currentUrl.indexOf('/Dance') >= 0) {
					_.pull(self.microsites, 
						_.find(self.microsites, { 'id' : 'fineart'}), 
						_.find(self.microsites, { 'id' : 'ceramics'}), 
						_.find(self.microsites, { 'id' : 'jewelry'}), 
						_.find(self.microsites, { 'id' : 'music'}), 
						_.find(self.microsites, { 'id' : 'instruct'})
					);
				}
				if (currentUrl.indexOf('/Fine Art & Design') >= 0) {
					_.pull(self.microsites, 
						_.find(self.microsites, { 'id' : 'dance'}), 
						_.find(self.microsites, { 'id' : 'ceramics'}), 
						_.find(self.microsites, { 'id' : 'jewelry'}), 
						_.find(self.microsites, { 'id' : 'music'}), 
						_.find(self.microsites, { 'id' : 'instruct'})
					);
				}
				if (currentUrl.indexOf('/Ceramics') >= 0) {
					_.pull(self.microsites, 
						_.find(self.microsites, { 'id' : 'fineart'}), 
						_.find(self.microsites, { 'id' : 'dance'}), 
						_.find(self.microsites, { 'id' : 'jewelry'}), 
						_.find(self.microsites, { 'id' : 'music'}), 
						_.find(self.microsites, { 'id' : 'instruct'})
					);
				}
				if (currentUrl.indexOf('/Music') >= 0) {
					_.pull(self.microsites, 
						_.find(self.microsites, { 'id' : 'fineart'}), 
						_.find(self.microsites, { 'id' : 'dance'}), 
						_.find(self.microsites, { 'id' : 'jewelry'}), 
						_.find(self.microsites, { 'id' : 'ceramics'})
					);
				}
				if (currentUrl.indexOf('/Jewelry') >= 0) {
					_.pull(self.microsites, 
						_.find(self.microsites, { 'id' : 'fineart'}), 
						_.find(self.microsites, { 'id' : 'dance'}), 
						_.find(self.microsites, { 'id' : 'ceramics'}), 
						_.find(self.microsites, { 'id' : 'music'}), 
						_.find(self.microsites, { 'id' : 'instruct'})
					);
				}
			} else {
				var subFolderPresent = false;
				if (currentUrl.indexOf('/Dance') >= 0) {
					subFolderPresent = true;
					var fineart = _.find(self.microsites, { 'id' : 'fineart'});
					if (_.isObject(fineart)) {
						_.pull(self.microsites, fineart);
					}
					var ceramics = _.find(self.microsites, { 'id' : 'ceramics'});
					if (_.isObject(ceramics)) {
						_.pull(self.microsites, ceramics);
					}
					var jewelry = _.find(self.microsites, { 'id' : 'jewelry'});
					if (_.isObject(jewelry)) {
						_.pull(self.microsites, jewelry);
					}
					var music = _.find(self.microsites, { 'id' : 'music'});
					if (_.isObject(music)) {
						_.pull(self.microsites, music);
					}
					var instruct = _.find(self.microsites, { 'id' : 'instruct'});
					if (_.isObject(instruct)) {
						_.pull(self.microsites, instruct);
					}
				}
				if (currentUrl.indexOf('/Fine Art & Design') >= 0) {
					subFolderPresent = true;
					var dance = _.find(self.microsites, { 'id' : 'dance'});
					if (_.isObject(dance)) {
						_.pull(self.microsites, dance);
					}
					var ceramics = _.find(self.microsites, { 'id' : 'ceramics'});
					if (_.isObject(ceramics)) {
						_.pull(self.microsites, ceramics);
					}
					var jewelry = _.find(self.microsites, { 'id' : 'jewelry'});
					if (_.isObject(jewelry)) {
						_.pull(self.microsites, jewelry);
					}
					var music = _.find(self.microsites, { 'id' : 'music'});
					if (_.isObject(music)) {
						_.pull(self.microsites, music);
					}
					var instruct = _.find(self.microsites, { 'id' : 'instruct'});
					if (_.isObject(instruct)) {
						_.pull(self.microsites, instruct);
					}
				}
				if (currentUrl.indexOf('/Ceramics') >= 0) {
					subFolderPresent = true;
					var fineart = _.find(self.microsites, { 'id' : 'fineart'});
					if (_.isObject(fineart)) {
						_.pull(self.microsites, fineart);
					}
					var dance = _.find(self.microsites, { 'id' : 'dance'});
					if (_.isObject(dance)) {
						_.pull(self.microsites, dance);
					}
					var jewelry = _.find(self.microsites, { 'id' : 'jewelry'});
					if (_.isObject(jewelry)) {
						_.pull(self.microsites, jewelry);
					}
					var music = _.find(self.microsites, { 'id' : 'music'});
					if (_.isObject(music)) {
						_.pull(self.microsites, music);
					}
					var instruct = _.find(self.microsites, { 'id' : 'instruct'});
					if (_.isObject(instruct)) {
						_.pull(self.microsites, instruct);
					}
				}
				if (currentUrl.indexOf('/Jewelry') >= 0) {
					subFolderPresent = true;
					var fineart = _.find(self.microsites, { 'id' : 'fineart'});
					if (_.isObject(fineart)) {
						_.pull(self.microsites, fineart);
					}
					var dance = _.find(self.microsites, { 'id' : 'dance'});
					if (_.isObject(dance)) {
						_.pull(self.microsites, dance);
					}
					var ceramics = _.find(self.microsites, { 'id' : 'ceramics'});
					if (_.isObject(ceramics)) {
						_.pull(self.microsites, ceramics);
					}
					var music = _.find(self.microsites, { 'id' : 'music'});
					if (_.isObject(music)) {
						_.pull(self.microsites, music);
					}
					var instruct = _.find(self.microsites, { 'id' : 'instruct'});
					if (_.isObject(instruct)) {
						_.pull(self.microsites, instruct);
					}
				}
				if (currentUrl.indexOf('/Music') >= 0) {
					subFolderPresent = true;
					var fineart = _.find(self.microsites, { 'id' : 'fineart'});
					if (_.isObject(fineart)) {
						_.pull(self.microsites, fineart);
					}
					var ceramics = _.find(self.microsites, { 'id' : 'ceramics'});
					if (_.isObject(ceramics)) {
						_.pull(self.microsites, ceramics);
					}
					var jewelry = _.find(self.microsites, { 'id' : 'jewelry'});
					if (_.isObject(jewelry)) {
						_.pull(self.microsites, jewelry);
					}
					var dance = _.find(self.microsites, { 'id' : 'dance'});
					if (_.isObject(dance)) {
						_.pull(self.microsites, dance);
					}
				}
				if (!subFolderPresent) {
					var fineart = _.find(self.microsites, { 'id' : 'fineart'});
					if (_.isUndefined(fineart)) {
						self.microsites.push(MICROSITEFINEART);
					}
					var ceramics = _.find(self.microsites, { 'id' : 'ceramics'});
					if (_.isUndefined(ceramics)) {
						self.microsites.push(MICROSITECERAMICS);
					}
					var jewelry = _.find(self.microsites, { 'id' : 'jewelry'});
					if (_.isUndefined(jewelry)) {
						self.microsites.push(MICROSITEJEWELRY);
					}
					var dance = _.find(self.microsites, { 'id' : 'dance'});
					if (_.isUndefined(dance)) {
						self.microsites.push(MICROSITEDANCE);
					}
					var music = _.find(self.microsites, { 'id' : 'music'});
					if (_.isUndefined(music)) {
						self.microsites.push(MICROSITEMUSIC);
					}
					var instruct = _.find(self.microsites, { 'id' : 'instruct'});
					if (_.isUndefined(instruct)) {
						self.microsites.push(MICROSITEINSTRUCT);
					}
				}
			}
		} else {
			self.microsites = [];
		}
	};

	NavListController.prototype.slicerPicked = function (whichDateTime, whatTime) {
		var self = this;
		switch (whichDateTime) {
			case 'sdate':
				self.updateEndMinDate();
				break;
			case 'time':
				self.timeSlice = self.updateCheckedGroups(self.timeSlice, whatTime);
				break;
			case 'day':
				self.daySlice = self.updateCheckedGroups(self.daySlice, whatTime);
				break;
			case 'age':
				self.ageSlice = self.updateCheckedGroups(self.ageSlice, whatTime);
				break;
		}
	};

	NavListController.prototype.updateCheckedGroups = function(chkSlc, chkVal) {
		if (_.isUndefined(chkVal)) {
			chkSlc = 'all';
		} else {
			if (!_.isArray(chkSlc)) {
				chkSlc = [];
			}
			if (chkSlc.indexOf(chkVal) > -1) {
				_.pull(chkSlc, chkVal);
				if (chkSlc.length === 0) {
					chkSlc = 'all';
				}
			} else {
				chkSlc.push(chkVal);
				if (chkVal === 'newborn-5' || chkVal === '6-12' || chkVal === 'teens' || chkVal === 'multigenerational') {
					_.pull(chkSlc, 'kids');
				} else if (chkVal === 'kids') {
					_.pull(chkSlc, 'newborn-5');
					_.pull(chkSlc, '6-12');
					_.pull(chkSlc, 'teens');
					_.pull(chkSlc, 'multigenerational');
				} else if (chkVal === 'adults' || chkVal === 'seniors') {
					_.pull(chkSlc, 'alladults');
				} else if (chkVal === 'alladults') {
					_.pull(chkSlc, 'adults');
					_.pull(chkSlc, 'seniors');
				}
			}
		}
		return chkSlc;
	};

	NavListController.prototype.updateEndMinDate = function () {
		var self = this;
		self.minEndDate = _.clone(self.sdateSlice);
		if (self.sdateSlice > self.edateSlice) {
			self.edateSlice = self.sdateSlice;
		}
	};

	NavListController.prototype.openCalendar = function ($event, which) {
		var self = this;
		$event.preventDefault();
		$event.stopPropagation();
		if (which === 'end') {
			self.opened.end = !self.opened.end;
		} else {
			//prevents the start calendar opening up and overlapping the open end calendar
			self.opened.start = !self.opened.start && !self.opened.end ? true : false;
		}
	};

	NavListController.prototype.modifyUrlSearch = function (fromLink) {
		var self = this;
		var location = self.location;
		var locationPath = location.path();

		locationPath = rewriteUrlLocation(SEARCHSLICEURL, self.textboxSearch, locationPath);
		location.path(locationPath);

		self.JumpNav = { To: self.currentObj.Name, Type: 'sliceBy' };

		if (!fromLink) {
			self.debounceSearch.cancel();
			self.applyScope();
		}
	};

	NavListController.prototype.searchByWord = function () {
		var self = this;
		if (self.textboxSearch.length) {
			self.showSpinner = true;
			self.debounceSearch();
		} else {
			self.modifyUrlSearch(false);
		}
	};

	NavListController.prototype.displayTiles = function () {
		var self = this;
		var onscreenResultsQueue = [];
		if (_.isUndefined(self.currentObj.NodeID)) {
			//if logo is clicked to reset the entire page
			self.onscreenResults = [];
			self.activeBreadcrumb = [];
			adjustLevelArray(self.arrCategory, 0, self.arrCategory.length, true);
			self.initialized = false;
			self.microsites = [];
		} else {
			var foundNode = findNodeDeep(self.classesByNodeId, self.currentObj.NodeID);
			if (foundNode.results.length) {
				_.forEach(foundNode.results, function (res) {
					var prodNo = res.ProductionSeasonNumber === 0 ? res.PackageNo : res.ProductionSeasonNumber;
					var foundClass = _.find(onscreenResultsQueue, {'ProdNo': prodNo});
					if (_.isUndefined(foundClass)) {
						var classInfoObj = formatDataFromJson(res, self.currentObj.NodeID);
						onscreenResultsQueue.push(classInfoObj);
					}
				});
			} else {
				var allNodeIds = pluckAllKeys(foundNode);
				_.forEach(allNodeIds, function (nid) {
					var foundNode = findNodeDeep(self.classesByNodeId, nid);
					_.forEach(foundNode.results, function (res) {
						var prodNo = res.ProductionSeasonNumber === 0 ? res.PackageNo : res.ProductionSeasonNumber;
						var foundClass = _.find(onscreenResultsQueue, {'ProdNo': prodNo});
						if (_.isUndefined(foundClass)) {
							var classInfoObj = formatDataFromJson(res, nid);
							onscreenResultsQueue.push(classInfoObj);
						}
					});
				});
			}
			self.getClassesByNodeId(onscreenResultsQueue);
		}
	};

	NavListController.prototype.getClassesByNodeId = function (onscreenResultsQueue) {
		var self = this;
		var locationPath = self.location.path();
		var lastLocationPath = self.lastLocationPath;
		lastLocationPath = seperateSlicersFromUrl(lastLocationPath).path;
		var lastLocArr = lastLocationPath.split("/");

		var locationParts = seperateSlicersFromUrl(locationPath);
		locationPath = locationParts.path;
		var locationPathRemoved = locationParts.removed;
		var locArr = locationPath.split("/");

		//note:  until we get a proper top-down pattern with the keywords, we can't use this code
		// if (_.difference(locArr, lastLocArr).length === 1) {
		// 	if (self.onscreenResults.length) {
		// 		_.forEach(_.clone(self.onscreenResults), function (arr) {
		// 			var checkPropExists = _.find(onscreenResultsQueue, { 'ProdNo': arr.ProdNo });
		// 			if (_.isUndefined(checkPropExists)) {
		// 				_.pull(self.onscreenResults, arr);
		// 			}
		// 		});
		// 	} else {
		// 		self.onscreenResults = _.clone(onscreenResultsQueue);
		// 	}
		// } else {
			self.onscreenResults = _.clone(onscreenResultsQueue);
		// }
		
		self.onscreenResults = filterListByDateRange(self.onscreenResults, self.sdateSlice, self.edateSlice);

		self.onscreenResults = filterListWithFutureDates(self.onscreenResults, self.daySlice, self.timeSlice);

		if (!_.isUndefined(self.typeSlice) && self.typeSlice !== 'all') {
			self.onscreenResults = _.filter(self.onscreenResults, function(res) {
				return res.ItemType.toLowerCase() === self.typeSlice;
			});
		}
		if (!_.isUndefined(self.ageSlice) && self.ageSlice !== 'all') {
			self.onscreenResults = filterListByKeywords(self.onscreenResults, self.ageSlice);
		}
		self.onscreenResults = checkListContainsWords(self.onscreenResults, self.textboxSearch);

		// var sortBy;
		// var sortUrlLocation = locationPathRemoved.indexOf(SORTSLICEURL);
		// if (sortUrlLocation < 0) {
		// 	sortBy = 'all';
		// } else {
		// 	var endSlashLocation = locationPathRemoved.indexOf("/", sortUrlLocation + 1);
		// 	if (endSlashLocation < 0) {
		// 		endSlashLocation = locationPathRemoved.length;
		// 	}
		// 	sortBy = locationPathRemoved.substring(sortUrlLocation + 7, endSlashLocation);
		// }
		// switch (sortBy) {
		// 	case 'progress':
		// 		self.onscreenResults = _.sortByOrder(self.onscreenResults, ['InProgress', 'SortDate1', 'SortDate2'], [false, true, true]);
		// 		break;
		// 	case 'featured':
		// 		self.onscreenResults = _.sortByOrder(self.onscreenResults, ['Featured', 'SortDate1', 'SortDate2'], [false, true, true]);
		// 		break;
		// 	default:
		// 		self.onscreenResults = _.sortByAll(self.onscreenResults, ['SortDate1', 'SortDate2']);
		// 		break;
		// }
		// self.sortOrder = sortBy;

		self.onscreenResults = _.sortByOrder(self.onscreenResults, ['Featured', 'SortDate1', 'SortDate2'], [false, true, true]);

		self.showSpinner = false;
		self.initialized = true;
	};

	NavListController.prototype.sortResults = function (sortBy) {
		var self = this;
		var location = self.location;
		var locationPath = location.path();

		locationPath = rewriteUrlLocation(SORTSLICEURL, sortBy, locationPath);
		location.path(locationPath);

		self.soonestSortSelected = sortBy === 'all' ? true : false;

		self.JumpNav = { To: self.currentObj.Name, Type: 'sliceBy' };
	};

	NavListController.prototype.populateSlicers = function (urlSlicers) {
		var self = this;
		var slicerUrls = [DAYSLICEURL, TIMESLICEURL, TYPESLICEURL, AGESLICEURL, SDATESLICEURL, EDATESLICEURL, SEARCHSLICEURL];
		var slicerTexts = [];
		self.daySlice = _.clone(self.initDaySlice);
		self.timeSlice = _.clone(self.initTimeSlice);
		self.typeSlice = 'all';
		self.ageSlice = _.clone(self.initAgeSlice);
		self.sdateSlice = self.initSdateSlice;
		self.edateSlice = self.initEdateSlice;
		self.textboxSearch = '';
		_.forEach(slicerUrls, function (slicerUrl, index) {
			var sliceUrlStartLocation = urlSlicers.indexOf(slicerUrl);
			if (sliceUrlStartLocation >= 0) {
				var sliceUrlEndLocation = urlSlicers.indexOf('/', sliceUrlStartLocation + 1);
				var sliceString = sliceUrlEndLocation >= 0 ? urlSlicers.substring(sliceUrlStartLocation, sliceUrlEndLocation) : urlSlicers.substring(sliceUrlStartLocation);
				var sliceValues = sliceString.substring(sliceString.indexOf('__') + 2);
				switch (index) {
					case 0:
						self.daySlice = sliceValues.split(',');
						break;
					case 1:
						self.timeSlice = sliceValues.split(',');
						break;
					case 2:
						self.typeSlice = sliceValues;
						break;
					case 3:
						self.ageSlice = sliceValues.split(',');
						break;
					case 4:
						self.sdateSlice = Number(sliceValues);
						break;
					case 5:
						self.edateSlice = Number(sliceValues);
						break;
					case 6:
						self.textboxSearch = sliceValues;
						break;
				}
			}
		});
	};

	NavListController.prototype.buildCurrentObj = function () {
		var self = this;
		var locationPath = self.location.path();
		var locationObj = seperateSlicersFromUrl(locationPath);
		locationPath = locationObj.path;
		var locationSlicers = locationObj.removed;
		if (locationPath.length && locationPath !== '/') {
			self.lastLocationPath = self.location.path();
			var subfolders = locationPath.substring(1).split('/');
			var findChild, foundChildParent, findObj, foundChild;
			self.activeBreadcrumb = [];
			_.forEachRight(subfolders, function (folder, index) {
				if (folder.length) {
					if (_.isUndefined(foundChildParent)) {
						if (index === 0) {
							//if this is only one level above then we can safely assume there are no duplicate children
							findObj = { 'Name': folder };
						} else {
							//this is to safeguard against multiple children of the same name
							var findAllPossibleChildren = _.where(self.arrCategory[index], { 'Name': folder });
							var findAllPossibleParents = _.where(self.arrCategory[index-1], { 'Name': subfolders[index-1] });
							_.forEach(findAllPossibleChildren, function (kids, index) {
								var parentId = kids.Parent;
								var foundParent = _.where(findAllPossibleParents, { NodeID: parentId });
								if (foundParent.length) {
									foundChildParent = foundParent[0].NodeID;
									return false;
								}
							});
							findObj = { 'Name': folder, Parent: foundChildParent };
						}
					} else {
						findObj = { 'Name': folder, NodeID: foundChildParent };
					}
					findChild = _.where(self.arrCategory[index], findObj);
					foundChild = findChild[0];
					foundChildParent = foundChild.Parent;
					foundChild = _.clone(foundChild);
					delete foundChild.Parent;

					if (index === (subfolders.length - 1)) {
						foundChild.Current = true;
						self.currentObj = _.clone(foundChild);
					}
				}
				if (!_.isUndefined(foundChild)) {
					self.activeBreadcrumb.push(_.clone(foundChild));	
				}
			});
			self.activeBreadcrumb.reverse();
		} else {
			self.currentObj = {};
			self.activeBreadcrumb = [];
			self.lastLocationPath = '';
		}
		self.populateSlicers(locationSlicers);
	};

	NavListController.prototype.setCurrent = function (currentId) {
		var self = this;
		var currentName, currentLevel, currentNode, jumpType, currentIndex;
		var urlMethod = 'default';
		if (isActualNumber(currentId)) {
			jumpType = 'linkBack';
			urlMethod = 'parse';
			var breadCrumb = self.activeBreadcrumb[currentId];
			currentName = breadCrumb.Name;
			currentLevel = breadCrumb.Level;
			currentNode = breadCrumb.NodeID;
		} else {
			var subLevel = currentId;
			currentName = subLevel.Name;
			currentLevel = self.currentObj.Level + 1;
			currentNode = subLevel.NodeID;
			jumpType = 'linkTo';
		}
		self.currentObj.Level = currentLevel;
		self.currentObj.Name = currentName;
		self.currentObj.NodeID = currentNode;
		self.JumpNav = { To: currentName, Type: jumpType };
		self.setUrl(currentIndex || currentName, urlMethod);
	};

	NavListController.prototype.setUrl = function (currentId, urlMethod) {
		var self = this;
		var location = self.location;
		var locationPath = location.path();
		var locationObj = seperateSlicersFromUrl(locationPath);
		locationPath = locationObj.path;
		var locationPathRemoved = locationObj.removed;
		if (!isActualNumber(currentId)) {
			//protect against any links with a forward-slash, like Beginner/Advanced
			//this is so the slash doesn't get interpreted as another level
			currentId = currentId.replace(/\//g,'%2F');
		}
		var newLocationPath;
		switch (urlMethod) {
			case 'parse':
				var folderPosition = locationPath.indexOf('/'+ currentId +'/');
				locationPath = locationPath.substr(0, folderPosition + currentId.length + 1);
				newLocationPath = fixUrl(locationPath + locationPathRemoved);
				break;
			case 'build':
				var newLocation = '';
				for (var x = 1; x <= currentId; x++) {
					newLocation += ('/' + self.activeBreadcrumb[x].Name);
				}
				newLocationPath = fixUrl(newLocation === '' ? '/'+ newLocation : newLocation + locationPathRemoved);
				break;
			case 'replace':
				newLocationPath = fixUrl('/'+ currentId + locationPathRemoved);
				break;
			default:
				if (locationPath === '/') {
					locationPath = '';
				}
				newLocationPath = fixUrl(locationPath + '/'+ currentId + locationPathRemoved);
		}
		location.path(newLocationPath);
		self.displayMicroSites(newLocationPath);
	};

	NavListController.prototype.getValues = function (nodes, level, resultsByKeywords) {
		var self = this;
		var tempArr = [];
		_.forEach(nodes, function (node) {
			if ((node.ChildNode.length === 0 && node.Keywords.length) || node.ChildNode.length > 0) {
				tempArr.push({ 
					Name: node.Name.trim(), 
					NodeID: node.NodeID, 
					Level: level, 
					Parent: node.ParentNodeID, 
					KeyWords: node.Keywords 
				});
				if (node.Keywords.length) {
					var keywordsToLookForArr = node.Keywords.toLowerCase().split(',');
					var filteredResults = filterListByKeywords(resultsByKeywords, keywordsToLookForArr);
					var foundNode = findNodeDeep(self.classesByNodeId, node.ParentNodeID);
					if (_.isObject(foundNode)) {
						foundNode[node.NodeID] = { 
							results: filteredResults, 
							parent: node.ParentNodeID 
						};
					} else {
						self.classesByNodeId[node.NodeID] = { 
							results: filteredResults, 
							parent: node.ParentNodeID 
						};
					}
				}
				if (level > MAXLEVEL) {
					MAXLEVEL = level;
				}
				if (node.ChildNode.length) {
					var childNodeValue = self.getValues(node.ChildNode, ++level, resultsByKeywords);
					if (!childNodeValue) {
						tempArr.pop();
					}
					--level;
				}
			}
		});
		if (tempArr.length === 0) {
			return false;
		}
		if (STARTINGLEVEL < MAXLEVEL) {
			STARTINGLEVEL = adjustLevelArray(self.arrCategory, STARTINGLEVEL, MAXLEVEL, false);
		}
		if (self.arrCategory.length) {
			self.arrCategory[level] = self.arrCategory[level].concat(tempArr);
		}
		return true;
	};

	NavListController.prototype.getBreadcrumbs = function (last) {
		var self = this;
		return last ? _.last(self.activeBreadcrumb) : _.initial(self.activeBreadcrumb);
	};

	NavListController.prototype.saveSearch = function () {
		var self = this;
		var urlToAdd = self.location.absUrl();
		var locationPath = self.location.path();
		var locationObj = seperateSlicersFromUrl(locationPath);
		locationPath = locationObj.path;
		var foldersToAdd = locationPath.split('/');
		var folderToAdd = _.last(foldersToAdd);
		var locationPathRemoved = locationObj.removed;

		var slicerUrls = [DAYSLICEURL, TIMESLICEURL, TYPESLICEURL, AGESLICEURL, SDATESLICEURL, EDATESLICEURL, SEARCHSLICEURL, SORTSLICEURL];
		var slicerTexts = [];
		_.forEach(slicerUrls, function (slicerUrl, index) {
			var sliceUrlStartLocation = locationPathRemoved.indexOf(slicerUrl);
			if (sliceUrlStartLocation >= 0) {
				var sliceUrlEndLocation = locationPathRemoved.indexOf('/', sliceUrlStartLocation + 1);
				var sliceString = sliceUrlEndLocation >= 0 ? locationPathRemoved.substring(sliceUrlStartLocation, sliceUrlEndLocation) : locationPathRemoved.substring(sliceUrlStartLocation);
				var sliceValues = sliceString.substring(sliceString.indexOf('__') + 2);
				var textVal = (index >= 4 && index <=5) ? formatDateOutput(new Date(Number(sliceValues)), true) : formatCommaString(sliceValues.toString());
				slicerTexts.push(textVal);
			}
		});

		var savedSearch = { 
			url: urlToAdd,
			folder: folderToAdd,
			filter: formatCommaString(slicerTexts.toString())
		};
		
		var foundSearch = _.findIndex(self.savedSearches, function (ss) {
			return ss.url === savedSearch.url && ss.folder === savedSearch.folder && ss.filter === savedSearch.filter;
		});
		if (foundSearch >= 0) {
			self.deleteSaved(foundSearch, self.savedSearches);
		} else {
			self.savedSearches.push(savedSearch);
		}
	};

	NavListController.prototype.saveProgram = function (title, img) {
		var self = this;
		var urlToAdd = self.location.absUrl();
		var savedProgram = { 
			Url: urlToAdd,
			Title: title,
			Img: img
		};

		var foundProgram = _.findIndex(self.savedPrograms, function (sp) {
			return sp.Url === savedProgram.Url && sp.Title === savedProgram.Title && sp.Img === savedProgram.Img;
		});
		if (foundProgram >= 0) {
			self.deleteSaved(foundProgram, self.savedPrograms);
		} else {
			self.savedPrograms.push(savedProgram);
		}
	};

	NavListController.prototype.deleteSaved = function (index, savedItems) {
		savedItems.splice(index, 1);
	};

	NavListController.prototype.loadMore = function () {
		var self = this;
		self.limit += self.numOfColumns;
	};

	NavListController.prototype.sliceBy = function (slicer) {
		var self = this;
		var location = self.location;
		var locationPath = location.path();
		var sliceUrl, sliceArr;
		switch (slicer) {
			case 'day':
				sliceUrl = DAYSLICEURL;
				sliceArr = self.daySlice;
				break;
			case 'time':
				sliceUrl = TIMESLICEURL;
				sliceArr = self.timeSlice;
				break;
			case 'type':
				sliceUrl = TYPESLICEURL;
				sliceArr = self.typeSlice;
				break;
			case 'age':
				sliceUrl = AGESLICEURL;
				sliceArr = self.ageSlice;
				self.ageApplyClicked = true;
				break;
			case 'sdate':
				sliceUrl = SDATESLICEURL;
				sliceArr = Date.parse(self.sdateSlice);
				break;
			case 'edate':
				sliceUrl = EDATESLICEURL;
				sliceArr = Date.parse(self.edateSlice);
				break;
			case 'datetime':
				sliceUrl = [DAYSLICEURL, TIMESLICEURL, SDATESLICEURL, EDATESLICEURL];
				sliceArr = [self.daySlice, self.timeSlice, Date.parse(self.sdateSlice), Date.parse(self.edateSlice)];
				self.dateApplyClicked = true;
				break;
			case 'datetimeage':
				sliceUrl = [DAYSLICEURL, TIMESLICEURL, SDATESLICEURL, EDATESLICEURL, AGESLICEURL];
				sliceArr = [self.daySlice, self.timeSlice, Date.parse(self.sdateSlice), Date.parse(self.edateSlice), self.ageSlice];
				self.dateApplyClicked = true;
				break;
		}
		if (!_.isUndefined(sliceUrl)) {
			if (_.isArray(sliceUrl)) {
				_.forEach(sliceUrl, function (arr, idx) {
					if (!_.isUndefined(sliceArr[idx])) {
						locationPath = rewriteUrlLocation(arr, sliceArr[idx], locationPath);
					}
				});
			} else {
				locationPath = rewriteUrlLocation(sliceUrl, sliceArr, locationPath);
			}
			location.path(locationPath);
			self.JumpNav = { To: self.currentObj.Name, Type: 'sliceBy' };
		}
	};

	NavListController.prototype.checkDateState = function (open) {
		var self = this;
		if (open) {
			self.dateApplyClicked = false;
			self.origDaySlice = _.clone(self.daySlice);
			self.origTimeSlice = _.clone(self.timeSlice);
			self.origSdateSlice = self.sdateSlice;
			self.origEdateSlice = self.edateSlice;
		} else {
			if (!self.dateApplyClicked) {
				self.daySlice = _.clone(self.origDaySlice);
				self.timeSlice = _.clone(self.origTimeSlice);
				self.sdateSlice = self.origSdateSlice;
				self.edateSlice = self.origEdateSlice;
			}
		}
	};

	NavListController.prototype.checkDateInit = function () {
		var self = this;
		//https://github.com/angular-ui/bootstrap/issues/3701 - clear date issue
		//since fields don't get cleared directly due to bug, we must explicitly set date fields to undefined
		if (_.isNull(self.sdateSlice)) {
			delete self.sdateSlice;
		}
		if (_.isNull(self.edateSlice)) {
			delete self.edateSlice;
		}
		return (self.sdateSlice === self.initSdateSlice && self.edateSlice === self.initEdateSlice && _.isEqual(self.daySlice, self.initDaySlice) && _.isEqual(self.timeSlice, self.initTimeSlice));
	};

	NavListController.prototype.checkAgeInit = function () {
		var self = this;
		return _.isEqual(self.ageSlice, self.initAgeSlice);
	};

	NavListController.prototype.clearDropDown = function (clearWhich) {
		var self = this;
		if (clearWhich.indexOf('datetime') >= 0) {
			self.daySlice = self.initDaySlice;
			self.timeSlice = self.initTimeSlice;
			self.sdateSlice = self.initSdateSlice;
			self.edateSlice = self.initEdateSlice;
		}
		if (clearWhich.indexOf('age') >= 0) {
			self.ageSlice = self.initAgeSlice;
		}
		var sliceBy = clearWhich.indexOf('datetime') >= 0 && clearWhich.indexOf('age') >=0 ? 'datetimeage' : clearWhich;
		self.sliceBy(sliceBy);
	};

	NavListController.prototype.checkAgeState = function (open) {
		var self = this;
		if (open) {
			self.ageApplyClicked = false;
			self.origAgeSlice = _.clone(self.ageSlice);
		} else {
			if (!self.ageApplyClicked) {
				self.ageSlice = _.clone(self.origAgeSlice);
			}
		}
	};

	NavListController.prototype.checkSearchSaved = function () {
		var self = this;
		var isSearchSaved = !_.isUndefined(_.find(self.savedSearches, {'url' : self.location.absUrl()}));
		return isSearchSaved;			
	};

	NavListController.prototype.checkProgramSaved = function (title) {
		var self = this;
		var isSearchSaved = !_.isUndefined(_.find(self.savedPrograms, {'Title' : title}));
		return isSearchSaved;			
	};

	NavListController.prototype.displayFilterOptions = function () {
		var self = this;
		self.enabledFilters = {};
		var isDateFilterEnabled = !self.checkDateInit() && self.initialized;
		var index = 0;
		if (isDateFilterEnabled) {
			self.enabledFilters['Date or Time'] = {
				pre: '',
				suf: '',
				ind: ++index
			};
		}
		var isTypeFilterEnabled = self.typeSlice !== 'all';
		if (isTypeFilterEnabled) {
			self.enabledFilters['Class/Event'] = {
				pre: '',
				suf: '',
				ind: ++index
			};
		}
		var isTimeFilterEnabled = !self.checkAgeInit() && self.initialized;
		if (isTimeFilterEnabled) {
			self.enabledFilters['Age Range'] = {
				pre: '',
				suf: '',
				ind: ++index
			};
		}
		var isSearchFilterEnabled = self.textboxSearch !== '';
		if (isSearchFilterEnabled) {
			self.enabledFilters.Search = {
				pre: '',
				suf: '',
				ind: ++index
			};
		}
		if (_.size(self.enabledFilters) > 1) {
			_.forEach(self.enabledFilters, function (arr, ind) {
				if (arr.ind === _.size(self.enabledFilters)) {
					arr.pre = 'or&nbsp;';
				} else {
					if (arr.ind === (_.size(self.enabledFilters) -1)) {
						if (_.size(self.enabledFilters) > 2) {
							arr.suf = ',&nbsp;';
						} else {
							arr.suf = '&nbsp;';	
						}
					} else {
						arr.suf = ',&nbsp;';
					}
				}
			});
		}
		return _.size(self.enabledFilters) > 0;
	};

	var pluckAllKeys = function (obj, res) {
		var res = res || [];
		_.forOwn(obj, function(v, k) {
			if (isActualNumber(k)) {
				res.push(Number(k));
			} else {
				return;
			}
			if (_.isObject(v)) {
				pluckAllKeys(v, res);
			}
		});
		return res;
	};

	var findNodeDeep = function (items, prop) {
		function traverse(value) {
			var result;
			if (value.hasOwnProperty(prop)) {
				result = value[prop];
			} else {
				if (value.hasOwnProperty('CategoryProductionKeywords')) {
					return false;
				}
				_.forEach(value, function (val) {
					if (val.hasOwnProperty(prop)) {
						result = val[prop];
						return false;
					}
					if (_.isObject(val)) {
						result = traverse(val);
					}
					if (result) {
						return false;
					}
				});
			}
			return result;
		}
		return traverse(items);
	};

	var rewriteUrlLocation = function (sliceUrl, sliceVal, locationPath) {
		var sliceUrlStartLocation = locationPath.indexOf(sliceUrl);
		if (sliceUrlStartLocation >= 0){
			var sliceUrlEndLocation = locationPath.indexOf('/', sliceUrlStartLocation + 1);
			var sliceStringToReplace = sliceUrlEndLocation >= 0 ? locationPath.substring(sliceUrlStartLocation, sliceUrlEndLocation) : locationPath.substring(sliceUrlStartLocation);
			//clear from url if field is deselected or value is for 'all' or value is erroneous
			if(!sliceVal.toString().length || _.isNaN(sliceVal) || sliceVal === 'all') {
				sliceUrl = '';
				sliceVal = '';
			}
			locationPath = fixUrl(locationPath.replace(sliceStringToReplace, sliceUrl + sliceVal.toString()));
		} else {
			if (!_.isNaN(sliceVal) && sliceVal !== 'all') {
				locationPath = fixUrl(locationPath + sliceUrl + sliceVal.toString());	
			}
		}
		return locationPath;
	};

	var fixUrl = function (possiblyMessyUrl) {
		//replace any urls that have double slashes with one slash
		return possiblyMessyUrl.replace(/\/\//g, '/');
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

	var filterListByDateRange = function (navArr, sdate, edate) {
		var filteredNavs;
		if (!_.isUndefined(sdate) && isDate(sdate)) {
			if (!_.isUndefined(edate) && isDate(edate)) {
				filteredNavs = _.filter(navArr, function (navs) {
					var sortDate1 = navs.SortDate1;
					return sortDate1 >= sdate && sortDate1 <= edate;
				});
			} else {
				filteredNavs = _.filter(navArr, function (navs) {
					var sortDate1 = navs.SortDate1;
					return sortDate1 >= sdate;
				});
			}
		} else {
			if (!_.isUndefined(edate) && isDate(edate)) {
				filteredNavs = _.filter(navArr, function (navs) {
					var sortDate1 = navs.SortDate1;
					return sortDate1 <= edate;
				});
			} else {
				filteredNavs = navArr;
			}
		}
		return filteredNavs;
	};

	var checkListContainsWords = function (results, searchVal) {
		var filteredNavs;
		var pattern = new RegExp(searchVal, "i");
		if (!_.isUndefined(searchVal) && searchVal.length) {
			filteredNavs = _.filter(results, function (result) {
				return pattern.test(result.Teachers) || pattern.test(result.Title) || pattern.test(result.KeyWord.toString()) || pattern.test(result.DescText);
			});
		} else {
			filteredNavs = results;
		}
		return filteredNavs;
	};

	var isBlankSlice = function (slice) {
		return (_.isUndefined(slice) || slice === 'all');
	};

	var filterListWithFutureDates = function (navArr, daySlices, timeSlices) {
		var filteredNavs;
		if (isBlankSlice(daySlices) && isBlankSlice(timeSlices)) {
			filteredNavs = navArr;
		} else {
			if (daySlices === 'all') {
				daySlices = _.clone(WEEKDAYS);
				var shiftDay = daySlices.shift();
				daySlices.push(shiftDay);
			}
			if (timeSlices === 'all') {
				timeSlices = _.clone(DAYPARTS);
			}
			filteredNavs = _.filter(navArr, function (navs) {
				var isSlicing = false;
				if (navs.FuturePerformances) {
					// when page first loads
					var navFutureDates = _.map(navs.FuturePerformances, function (futurePerf) {
						return new Date(parseInt(futurePerf.perf_dt.substr(6)));
					});
				} else {
					var navFutureDates = _.map(navs.FutureDates, function (futurePerf) {
						return new Date(parseInt(futurePerf.substr(6)));
					});
					isSlicing = true;
				}
				var filtered = _.filter(daySlices, function(daySlice) {
					var returnVal = false;
					_.forEach(navFutureDates, function (fDate) {
						var dayNum = fDate.getDay();
						var hourNum = fDate.getHours();
						var minNum = fDate.getMinutes();
						var dayPart;
						if (hourNum < 12) {
							if (hourNum == 11 && minNum >= 30) {
								dayPart = 'afternoon';
							} else {
								dayPart = 'morning';	
							}
						} else if (hourNum >= 12 && hourNum < 17) {
							dayPart = 'afternoon';
						} else if (hourNum >= 17) {
							dayPart = 'evening';
						}
						if (WEEKDAYS[dayNum] === daySlice && _.includes(timeSlices, dayPart)) {
							returnVal = true;
						}
					});
					return returnVal;
				});
				return isSlicing ? filtered.length > 0 : filtered.length === slices.length;
			});
		}
		return filteredNavs;
	};

	var filterListByKeywords = function (navArr, keywords) {
		var filteredNavs;
		if (!_.isUndefined(keywords) && keywords.length) {
			filteredNavs = _.filter(navArr, function (navs) {
				var isSlicing = false;
				if (navs.CategoryProductionKeywords) {
					// when page first loads
					var navKeywords = _.map(navs.CategoryProductionKeywords, function (catprod) {
						return catprod.keyword.toLowerCase();
					});
				} else {
					var navKeywords = _.map(navs.KeyWord, function (catprod) {
						return catprod.toLowerCase();
					});
					isSlicing = true;
				}
				var filtered = _.filter(keywords, function(keyword) {
					var returnVal;
					keyword = keyword.trim();
					switch (keyword) {
						case 'multigenerational':
							returnVal = navKeywords.indexOf('parenting & family') != -1;
							break;
						case '6-12':
							returnVal = navKeywords.indexOf('6-12 years') != -1;
							break;
						case 'newborn-5':
							returnVal = navKeywords.indexOf('newborn-5 years') != -1;
							break;
						case 'kids':
							returnVal = navKeywords.indexOf('parenting & family') != -1 || navKeywords.indexOf('6-12 years') != -1 || navKeywords.indexOf('newborn-5 years') != -1 || navKeywords.indexOf('teens') != -1;
							break;
						case 'alladults':
							returnVal = navKeywords.indexOf('adults') != -1 || navKeywords.indexOf('seniors') != -1;
							break;
						default:
							returnVal = navKeywords.indexOf(keyword) != -1;
					}
					return returnVal;
				});
				return isSlicing ? filtered.length > 0 : filtered.length === keywords.length;
			});
		} else {
			filteredNavs = navArr;
		}
		return filteredNavs;
	};

	var formatDataFromJson = function (arr, nodeId) {
		var prodNo = arr.ProductionSeasonNumber === 0 ? arr.PackageNo : arr.ProductionSeasonNumber;
		var keyWords = _.pluck(arr.CategoryProductionKeywords, 'keyword');
		var futurePerformanceDates = _.pluck(arr.FuturePerformances, 'perf_dt');
		var itemTypes = _.remove(keyWords, function (n) { 
			return (n.toLowerCase() === 'class' || n.toLowerCase() === 'event');
		});
		var featured = _.includes(keyWords, 'Featured Item') ? true : false;
		var itemType = itemTypes.length ? itemTypes[0] : "";
		var mainImage = arr.MainImage;
		var image = mainImage.length === 0 ? '/_ui/uptown/img/default_lrg_516x311.jpg' : mainImage.substring(mainImage.indexOf('/'));
		var begDate = arr.NextPerformanceDateTime || arr.FirstDate;
		begDate = new Date(parseInt(begDate.substr(6)));
		var yearNumber = begDate.getFullYear();

		var multDates = arr.IsMultipleDatesTimes;
		var startDate = multDates ? "Multiple dates/times" : formatDateOutput(begDate);

		var sortDate1 = "";
		var sortDate2 = "";
		var warning = arr.ProdStatus;
		var inProgress;
		if (begDate < new Date() || warning.length) {
			sortDate2 = begDate;
			//10 is an arbirtary number to set the secondary sorting
			sortDate1 = begDate.setFullYear(yearNumber + 10);
			inProgress = true;
		} else {
			sortDate1 = begDate;
			sortDate2 = "";
			inProgress = false;
		}

		var shortDescription = "<div class='shortDescTxt'>" + arr.ShortDesc + "</div>";
		var shortDesc = shortDescription.replace(/<p>/g, '').replace(/<\/p>/g, '<br />');
		var instructors = _.map(arr.ProdSeasonInstructors, function (arr) {
			return arr.Instructor_name.replace(/\s{2,}/g, ' ');
		});
		var teachers = instructors.toString();
		var futurePerfCount = Number(arr.FuturePerformanceCount);

		if (isActualNumber(futurePerfCount) && futurePerfCount > 0) {
			shortDesc += "<div class='startPrice'>" + "<b>Price:</b>  from "+ arr.LowestPrice + "</div>";
			if (teachers.length) {
				shortDesc += "<div class='teach'><b>Instructor"+ (instructors.length > 1 ? "s" : "") +":</b>&nbsp;&nbsp;"+ teachers.replace(/,/, ", ") + "</div>";	
			}
			var performances = arr.FuturePerformances;
			if (performances.length > 1) {
				_.forEach(performances, function(p, ind) {
					var perfDate = p.perf_dt;
					perfDate = new Date(parseInt(perfDate.substr(6)));
					var futureDate = formatDateOutput(perfDate);
					if (ind === 0) {
						shortDesc += "<div class='dates'><b>Upcoming Dates:</b><br/>"+ futureDate + "</div>";
					} else {
						// if (ind >= 3) {
						// 	shortDesc += "<div class='dates'>And "+ (futurePerfCount - 3) +" more" + "</div>";
						// 	return false;
						// }
						shortDesc += "<div class='dates'>"+ futureDate + "</div>";
					}
				});
			}
		}
		var classInfoObj = {
			Title: arr.Title,
			KeyWord: keyWords,
			ProdNo: prodNo,
			NodeID: nodeId,
			Desc: shortDesc,
			DescText: arr.ShortDesc,
			Img: image,
			FriendlyDate: startDate,
			SortDate1: sortDate1,
			SortDate2: sortDate2,
			Url: arr.URL,
			Warning: warning,
			ItemType: itemType,
			Teachers: teachers,
			InProgress: inProgress,
			Featured: featured,
			FutureDates: futurePerformanceDates
		};
		return classInfoObj;
	}

	var formatCommaString = function (uglyString) {
		uglyString = uglyString.replace(/,(.)/g, function ($0, $1) {
			return ', '+ _.capitalize($1);
		});
		return _.capitalize(uglyString);
	}

	var formatDateOutput = function (uglyDate, short) {
		var dayAbbr = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");
		var monthAbbr = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
		var dateHour = uglyDate.getHours();
		var yearNumber = uglyDate.getFullYear();
		var ampm = dateHour < 12 ? "AM" : "PM";
		if (dateHour == 0) {
			dateHour = 12;
		}
		if (dateHour > 12) {
			dateHour = dateHour - 12;
		}
		var dateMinute = uglyDate.getMinutes() > 0 ? ":"+ (uglyDate.getMinutes().toString().length === 1 ? "0"+ uglyDate.getMinutes() : uglyDate.getMinutes()) : "";
		var prettyDate = short ? monthAbbr[uglyDate.getMonth()] +" " + uglyDate.getDate() +" "+ yearNumber : dayAbbr[uglyDate.getDay()] +", "+ monthAbbr[uglyDate.getMonth()] +" " + uglyDate.getDate() +", "+ yearNumber +", "+ dateHour + dateMinute + " " + ampm;
		return prettyDate;
	}

	var TileInfoService = function (http) {
		var self = this;
		self.http = http;
	};
	TileInfoService.$inject = ['$http'];

	TileInfoService.prototype.getAllClasses = function (url) {
		var self = this;
		return self.http.get(url).success(function (data) {
			return data;
		});
	};

	// TileInfoService.prototype.getAllEvents = function () {
	// 	var self = this;
	// 	return self.http.get('arc-response_Events.json').success(function (data) {
	// 		return data;
	// 	});
	// };
	TileInfoService.prototype.getSOAItems = function () {
		var _this = this;
		return _this.http.get('items/CatProdPkg_SOA.json').success(function (data) {
			return data;
		});
	};

	navApp.service('tileInfoSrv', TileInfoService);

	NavListController.$inject = ['$scope', 'tileInfoSrv', '$location', '$timeout', 'storage', '$window'];
	navApp.controller('NavListController', NavListController);

	navApp.directive('getBodyDimensions', function () {
		function link(scope) {
			resizeTileDisplay(scope);
		}
		return {
			link: link
		};
	});

	navApp.filter('unsafe', function($sce) {
		return function(val) {
			return $sce.trustAsHtml(val);
		};
	});

})();

var isDate = function (checkDate) {
	return _.isDate(checkDate) || (Number(checkDate) > 0 && _.isFinite(Number(checkDate)) && _.isDate(new Date(checkDate))) ? true : false;
}

var resizeTileDisplay = function (scope) {

	var tileHeight, numColumns;
	if (window.matchMedia( "(min-width: 1200px)" ).matches) {
		numColumns = 4;
		tileHeight = 340;
	} else if (window.matchMedia( "(min-width: 992px)" ).matches) {
		numColumns = 3;
		tileHeight = 340;
	} else if (window.matchMedia( "(min-width: 768px)" ).matches) {
		numColumns = 4;
		tileHeight = 141;
	} else {
		numColumns = 4;
		tileHeight = 196;
	}
	var headerHeight = $("#isoContainer, #isoContainerMobile").offset().top;
	var pageHeight = $(window).height();
	var pageHeightWithoutHeader = pageHeight - headerHeight;
	var numRows = Math.floor(pageHeightWithoutHeader / tileHeight);

	var limitToSet = numColumns * numRows;
	scope.navListCtrl.limit = limitToSet;
	scope.navListCtrl.numOfColumns = numColumns;
	scope.navListCtrl.origLimit = limitToSet + numColumns;
}

var adjustLevelArray = function (arr, start, end, clear) {
	//creates a blank new level in self.arrCategory
	for (var x = start; x <= end; x++){
		if (_.isUndefined(arr[x]) || clear) {
			arr[x] = [];	
		}
	}
	return end;
}

var isActualNumber = function (num) {
	return !isNaN(parseFloat(num)) && isFinite(num);
};

$(document).on('click','.showMore',function(){
	var $showMore = $(this).parent(".getMore");
	var $wrapper = $showMore.next(".contentWrap");
	var $classTitle = $showMore.prevAll(".classTitle");
	var $classDate = $showMore.prevAll(".classDate");
	var $warning = $showMore.prevAll(".warning");
	var $content = $wrapper.find("div");
	var titleHeight = $classTitle.height();
	var warnHeight = $warning.height();
	$wrapper.children(".shortDescription").css("height", 225 - titleHeight - warnHeight+"px");
	if($wrapper.css("bottom") == "164px") {
		$wrapper.animate({bottom: "5px"});
		$classTitle.animate({bottom: "0"});
		$classDate.animate({bottom: "0"});
		$warning.animate({bottom: "0"});
		$content.slideUp(function () {
			$showMore.html($showMore.html().replace('Less Info <i class="fa fa-chevron-down"></i></span>', 'More Info <i class="fa fa-chevron-up"></i></span>'));
		});
	} 
	else {
		$wrapper.css( "bottom", "5px" );
		$wrapper.animate({bottom: "164px"});
		$classTitle.animate({bottom: "164px"});
		$classDate.animate({bottom: "164px"});
		$warning.animate({bottom: "164px"});
		$content.slideDown(function () {
			$showMore.html($showMore.html().replace('More Info <i class="fa fa-chevron-up"></i></span>', 'Less Info <i class="fa fa-chevron-down"></i></span>'));
		});
	}
	return false;
});
// $(document).on('mouseout','span.showMore',function(){
// 	console.log("leave");
// 		var $showMore = $(this).parent(".getMore");
// 		var $wrapper = $showMore.next(".contentWrap");
// 		var $classTitle = $showMore.prevAll(".classTitle");
// 		var $classDate = $showMore.prevAll(".classDate");
// 		var $warning = $showMore.prevAll(".warning");
// 		var $content = $wrapper.find("div");
// 		var titleHeight = $classTitle.height();
// 		var warnHeight = $warning.height();
		
// 			$classTitle.animate({bottom: "0"});
// 			$classDate.animate({bottom: "0"});
// 			$warning.animate({bottom: "0"});
// 			$content.slideUp(function () {
// 				$showMore.html($showMore.html().replace('Less Info <i class="fa fa-chevron-down"></i></span>', 'More Info <i class="fa fa-chevron-up"></i></span>'));
// 			});
		
// 		return false;
// 	});

// $(document).on('mouseover','span.showMore',function(){
// 	console.log("enter");
// 		var $showMore = $(this).parent(".getMore");
// 		var $wrapper = $showMore.next(".contentWrap");
// 		var $classTitle = $showMore.prevAll(".classTitle");
// 		var $classDate = $showMore.prevAll(".classDate");
// 		var $warning = $showMore.prevAll(".warning");
// 		var $content = $wrapper.find("div");
// 		var titleHeight = $classTitle.height();
// 		var warnHeight = $warning.height();
		
// 			$wrapper.css( "bottom", "5px" );
// 			$wrapper.animate({bottom: "164px"});
// 			$classTitle.animate({bottom: "164px"});
// 			$classDate.animate({bottom: "164px"});
// 			$warning.animate({bottom: "164px"});
// 			$content.slideDown(function () {
// 				$showMore.html($showMore.html().replace('More Info <i class="fa fa-chevron-up"></i></span>', 'Less Info <i class="fa fa-chevron-down"></i></span>'));
// 			});
		
// 		return false;
// 	});