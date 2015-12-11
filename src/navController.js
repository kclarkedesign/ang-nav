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

    var SCRIPTNAME = 'ProgramFinder.html';

	var navApp = angular.module('artNavApp', ['infinite-scroll', 'ui.bootstrap', 'ngScrollSpy', 'ngTouch', 'ngCookies', 'angular-cache', 'angulartics', 'nav.config']);
	var NavListController = function ($scope, tileInfoSrv, $location, $timeout, $window, $cookieStore, navConfig) {
		var self = this;
		self.allClasses = [{Name: '', NodeID: LOADINGNODEID}];
		self.arrCategory = [];
		self.location = $location;
		self.timeout = $timeout;
	    self.cookieStore = $cookieStore;
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
		self.showGlobalSpinner = false;
		self.debounceSearch = _.debounce(function () { self.modifyUrlSearch(false); }, 2000);
		self.debounceGlobalSearch = _.debounce(function (searchTerm) { self.fetchSearchResults(searchTerm); }, 2000);
		self.applyScope = function () { $scope.$apply(); };
		self.enabledFilters = {};
		self.bottomContainerStyle = {'overflow-x': 'hidden', 'height': '100%' };
		self.bodyStyle = { 'height': '100%', 'margin': '0', 'padding': '0', 'overflow': 'hidden' };
		self.chunkLevels = [];
		self.affixed = false;
		self.scrollingUp = false;
		self.environment = "desktop";
		self.navOpened = false;
		self.printedReport = [];
		self.virtualPageUrl = '';
		self.virtualPageTitle = '';
		self.printNum = 1;

		self.savedPrograms = self.cookieStore.get('savedPrograms');
		if (_.isUndefined(self.savedPrograms)) {
			self.savedPrograms = [];
		}

		self.savedSearches = self.cookieStore.get('savedSearches');
		if (_.isUndefined(self.savedSearches)) {
			self.savedSearches = [];
		}

		self.eventClassDropdown = {
			isopen: false
		};

		self.tileInfoSrv = tileInfoSrv;

        (function(cf) {
            if (!cf.get('navCache')) {
                self.navCache = cf('navCache', {
                    maxAge: 30 * 60 * 1000, //30 minutes
                    deleteOnExpire: 'aggressive',
                    onExpire: function(key, value) {
                        var currentInterestArea = self.arrCategory[0];
                        var currentInterestAreaName = currentInterestArea[0].Name;
                        var currentInterestAreaId = currentInterestArea[0].NodeID;
                        self.getInterestItems(self.interestCompiled, {Name: currentInterestAreaName, NodeID: currentInterestAreaId});
                    }
                });
            }
        })(self.tileInfoSrv.cacheFactory);

		self.tileInfoSrv.getAll('items/Filters.json', self.navCache, 'navigation').then(function (data) {
			self.getInterestItems(self.getAllInitialClasses, data);
		}, function (respData) {
			self.tileInfoSrv.getAll('/webservices/categoryproduction.svc/FilterNodes/'+ navConfig.FilterNodeNum +'/', self.navCache, 'navigation').then(function (data) {
				self.getInterestItems(self.getAllInitialClasses, data);
			}).finally(function() {
				if (!self.allClasses.length || (self.allClasses.length && self.allClasses[0].Name === '')) {
					self.allClasses = [{ Name: 'Error loading data.  Click to refresh.', NodeID: ERRORLOADINGNODEID }];
				}
			});
		});

		self.log = function (variable) {
			console.log(variable);
		};

		self.table = function (variable) {
			console.table(variable);
		};

		var w = angular.element($window);
		self.currentScreenWidth = w.outerWidth();
		w.bind('resize', function () {
			//This condition is for mobile devices that change the height of the window when you swipe up or down to scroll.
			if (this.outerWidth !== self.currentScreenWidth) {
				if (!_.isUndefined(self.currentObj)) {
					resizeTileDisplay($scope);
					self.onscreenResults = [];
					self.displayTiles();
					self.loadMore(self.environment);
					$scope.$apply();
				}
				self.currentScreenWidth = this.outerWidth;
			}
		});
		$scope.$watch(function () {
			return self.location.path();
		}, function (locationPath){
			if (INITIALIZING) {
				$timeout(function() { INITIALIZING = false; });
			} else {
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
							Current: self.currentObj.Current,
							FeaturedItemsHeader: self.currentObj.FeaturedItemsHeader
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
						// if browser back and forward buttons or global search used for unpredictable jumps
						if ((self.arrCategory.length === 0 || self.arrCategory[0].length === 0) && numOfSlashesLocation > 0) {
							var subfolders = locationPath.substring(1).split('/');
							var classIndex = _.findIndex(self.allClasses, {'Name': subfolders[0]});
							var classesByInterest = [self.allClasses[classIndex]];
							self.getValues(classesByInterest, 0, self.navsDict[subfolders[0]]);
						} else {
							var subfolders = locationPath.substring(1).split('/');
							var rootFolder = subfolders[0];
							//if logo clicked to reset let's just skip this
							if (rootFolder.length > 0) {
								//if the url's root folder doesn't match the last recorded folder from the url, let's build it up from scratch
								var currentRootFolder = self.arrCategory[0][0].Name;
								if (currentRootFolder !== rootFolder) {
									adjustLevelArray(self.arrCategory, 0, self.arrCategory.length, true);
									var classIndex = _.findIndex(self.allClasses, {'Name': rootFolder});
									var classesByInterest = [self.allClasses[classIndex]];
									self.getValues(classesByInterest, 0, self.navsDict[rootFolder]);
								}
							}
						}
						self.buildCurrentObj();
						break;
				}
				self.displayTiles();
				self.lastLocationPath = locationPath + locationObj.removed;
				self.JumpNav = {};
				self.limit = self.origLimit;
				self.affixed = false;
			}
		});
	};

	NavListController.prototype.printAllReport = function () {
		var self = this;
		self.printStatus = 'Printing...';
		self.printedReport = [];
		_.forEach(self.allClasses, function (sl) {
			self.getInterestItems(self.interestCompiled, sl);
		});
		self.printReport(self.classesByNodeId, [], []);
	};

	NavListController.prototype.printReport = function (nodes, keywords, kwArr) {
		var self = this;
		_.forEach(nodes, function (node) {
			if (_.isUndefined(node.parent)) {
				if (_.isArray(node)) {
					_.forEach(node, function (n) {
						var kwStringArr = [];
						_.forEach(keywords, function (kw) {
							kwStringArr.push(kw.Level +':  '+ kw.Keywords);
						});
						var levelAndKeywords = kwStringArr.toString();
						var uniqid = n.ProductionNumber === 0 ? n.PackageNo : n.ProductionNumber;
						var prodNo = n.ProductionNumber;
					    var packageNo = n.PackageNo;
						var foundArr = _.find(kwArr, { 'uniqid' : uniqid });
						if (_.isUndefined(foundArr)) {
							var kws = '';
							_.forEach(keywords, function (kw, ind) {
								kws += kw.Keywords;
								if (ind +1 < keywords.length){
									kws += ',';
								}
							});
							kwArr.push({ uniqid: uniqid, prodid: prodNo, packid: packageNo, name: n.Title, keywords: kws, kws_0: levelAndKeywords });
						} else {
						 	var foundKeywords = foundArr.keywords;
							var kws = '';
							_.forEach(keywords, function (kw, ind) {
								kws += kw.Keywords;
								if (ind +1 < keywords.length){
									kws += ',';
								}
							});
							var keywordArr = (kws +','+ foundKeywords).split(',');
						 	var kwUniq = _.uniq(keywordArr).toString();
						 	foundArr.keywords = kwUniq;
							for (var x = 1; x <=10; x++) {
								if (_.isUndefined(foundArr['kws_' +x])) {
									foundArr['kws_' +x] = levelAndKeywords;
									break;
								}
							}
						}
					});
					keywords.pop();
				}
				return;
			}
			keywords.push({ Level: node.name, Keywords: node.keywords });
			self.printReport(node, keywords, kwArr);
		});
		self.printedReport = _.sortByOrder(kwArr, ['kws_7', 'kws_6'], ['asc']);
	};

	NavListController.prototype.getSublevels = function (level, nodeid) {
		var self = this;
		if (self.currentObj) {
			if (_.isUndefined(level)) {
				level = self.currentObj.Level;
				nodeid = self.currentObj.NodeID;
			}
			return _.filter(self.arrCategory[level+1], { 'Parent': nodeid });

		} else {
			return;
		}
	};

    NavListController.prototype.chunkSublevels = function() {
        var self = this;
        var subLevels = self.getSublevels();
        var tempChunkLevels = [];
        if (!_.isUndefined(subLevels)) {
            var chunkSize = (Math.ceil(subLevels.length / 4));
            tempChunkLevels = _.chunk(subLevels, chunkSize);
            if (tempChunkLevels.length < 3) {
                tempChunkLevels.push([]);
            }
        }
        if (!_.isEqual(tempChunkLevels, self.chunkLevels)) {

            self.chunkLevels = tempChunkLevels;
        }
        return self.chunkLevels;
    };

	NavListController.prototype.getAllInitialClasses = function (self) {
		var locationPath = self.location.path();
		if (locationPath.length && locationPath !== '/') {
			var match = locationPath.match(/^\/(.+?)(\/|$)/);
			var interestFolder = match[1];
			var classesByInterest = [_.find(self.allClasses, {'Name' : interestFolder })];
			self.displayMicroSites(locationPath);
			self.getValues(classesByInterest, 0, self.navsDict[interestFolder]);
			self.buildCurrentObj();
			self.displayTiles();
		}
	};

	NavListController.prototype.getInterestItems = function (func, arg) {
		var self = this;
		var subLevelName;
		var subLevelId;
	    if (_.isUndefined(arg.Name)) {
	        //if page load
	        self.allClasses = [];
	        self.allClasses.push.apply(self.allClasses, arg.data);
	        var locationPath = self.location.path();
	        if (locationPath.length && locationPath !== '/') {
	            var match = locationPath.match(/^\/(.+?)(\/|$)/);
	            subLevelName = match[1];
	            //if user comes to site with filters in url but no interest area picked
	            if (subLevelName.indexOf("__") > 0) {
	                subLevelName = undefined;
	                self.eventClassDropdown.isopen = true;
	                self.navOpened = true;
	            } else {
    	            var foundLevel = _.find(self.allClasses, { 'Name': subLevelName });
	                subLevelId = foundLevel.NodeID;
	            }
	        } else {
	            self.eventClassDropdown.isopen = true;
	            self.navOpened = true;
	        }
	    } else {
	        //if interest link clicked
	        subLevelName = arg.Name;
	        subLevelId = arg.NodeID;
	    }

	    if (!_.isUndefined(subLevelName)) {
			if (_.isUndefined(self.navsDict[subLevelName])) {
				self.tileInfoSrv.getItems(subLevelId, self.allClasses, self.navCache).then(function (items) {
					self.navsDict[subLevelName] = items.data;
					func(self, arg, true);
				});
			} else {
			    self.tileInfoSrv.getItems(subLevelId, self.allClasses, self.navCache).then(function (items) {
                    self.navCache.remove(subLevelName);
                    self.navsDict[subLevelName] = items.data;
                    self.navCache.put(subLevelName, {
                        itemData: items.data
                    });
                    func(self, arg);
				});
			}
		}
	};

	NavListController.prototype.interestCompiled = function (self, subLevel, printNow) {	
		var currentName = subLevel.Name;
		adjustLevelArray(self.arrCategory, 0, self.arrCategory.length, true);

		var classIndex = _.findIndex(self.allClasses, {'Name': currentName});
		var classesByInterest = [self.allClasses[classIndex]];
		self.getValues(classesByInterest, 0, self.navsDict[currentName]);
		if (printNow) {
			self.printStatus = 'Printing '+ self.printNum +' of '+ self.allClasses.length +' reports';
			self.printNum++;
			if (self.printNum > self.allClasses.length) {
				self.printStatus = 'Done';
			}
			self.printReport(self.classesByNodeId, [], []);
		} else {
			self.printStatus = 'Full report printed';
		}
	};

	NavListController.prototype.interestClicked = function (self, subLevel) {
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
		self.currentObj.FeaturedItemsHeader = '';
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
    
    NavListController.prototype.searchGlobal = function () {
		var self = this;
		if (self.textboxGlobalSearch.length) {
			self.showGlobalSpinner = true;
			self.debounceGlobalSearch(self.textboxGlobalSearch);
		} else {
			self.fetchSearchResults(self.textboxGlobalSearch);  
		}
	};

    NavListController.prototype.prepareSearchRedirect = function() {
		var self = this;
        self.displaySearchResults = [];
        self.navOpened = false;
        self.textboxGlobalSearch = '';
    };

    NavListController.prototype.fetchSearchResults = function(searchTerm) {
		var self = this;
        self.displaySearchResults = [];
        if (searchTerm.length) {
            self.tileInfoSrv.getAll('/webservices/categoryproduction.svc/Search/' + searchTerm + '/', self.navCache, 'globalSearch').then(function(data) {
            //note:  this is just a workaround for now 
            //self.tileInfoSrv.getAll('/src/junk.json', self.navCache, 'globalSearch').then(function(data) {
                var results = data.data;
                if (results.length) {
                    var interestArr = _.uniq(_.flatten(_.pluck(results, 'InterestAreas')));
                    _.forEach(interestArr, function(interest) {
                        var sublevel = _.find(self.allClasses, function(ac) {
                            return ac.JSONDataURL.toLowerCase().indexOf('/'+ interest) > 0;
                        });
                        var subLevelName = sublevel.Name;
                        if (!_.isUndefined(sublevel)) {
                            var foundLevel = _.find(self.allClasses, { 'Name': subLevelName });
		                    var subLevelId = foundLevel.NodeID;
		                    self.tileInfoSrv.getItems(subLevelId, self.allClasses, self.navCache).then(function(items) {
		                        self.navsDict[subLevelName] = items.data;
		                        var absUrl = self.location.absUrl().toLowerCase();
		                        var baseUrl = absUrl.substring(0, absUrl.indexOf(SCRIPTNAME.toLowerCase())) + SCRIPTNAME;
                                var href = baseUrl +'#/'+ subLevelName +'/search__'+ searchTerm;
                                self.displaySearchResults.push({
                                    searchTerm: searchTerm,
                                    interestArea: subLevelName,
                                    href: encodeURI(href)
                                });
		                        self.showGlobalSpinner = false;
		                    });
                        }
                    });
                } else {
                    //search finds no results
                    self.showGlobalSpinner = false;
                }
            }, function(reason) {
                //search throws error
                self.showGlobalSpinner = false;
            });
        } else {
            self.showGlobalSpinner = false;
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
					foundNode = findNodeDeep(self.classesByNodeId, nid);
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
	    self.virtualPageUrl = locationPath;
	    var breadcrumbs = self.getBreadcrumbs(false);
        if (breadcrumbs.length) {
            self.virtualPageTitle = (self.getBreadcrumbs(false))[0].Name;
        } else {
            self.virtualPageTitle = (self.getBreadcrumbs(true)).Name;
        }

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
	    if (self.onscreenResults.length === 0) {
            self.fetchSearchResults(self.textboxSearch);
	    }

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

	NavListController.prototype.setNewPath = function (subLevel) {
		var self = this;
		if (subLevel.Name === self.currentObj.Name && subLevel.Level === self.currentObj.Level && subLevel.NodeID === self.currentObj.NodeID) {
			return;
		}
		self.setUrl(subLevel.Name, 'jump', subLevel.Level);
	};

	NavListController.prototype.setCurrent = function (currentId) {
		var self = this;
		var currentName, currentLevel, currentNode, jumpType, currentIndex, currentFeaturedContent;
		var urlMethod = 'default';
		if (isActualNumber(currentId)) {
			jumpType = 'linkBack';
			urlMethod = 'parse';
			var breadCrumb = self.activeBreadcrumb[currentId];
			currentName = breadCrumb.Name;
			currentLevel = breadCrumb.Level;
			currentNode = breadCrumb.NodeID;
			currentFeaturedContent = breadCrumb.FeaturedItemsHeader;
		} else {
			var subLevel = currentId;
			currentName = subLevel.Name;
			currentLevel = self.currentObj.Level + 1;
			currentNode = subLevel.NodeID;
			jumpType = 'linkTo';
			currentFeaturedContent = subLevel.FeaturedItemsHeader;
		}
		self.currentObj.Level = currentLevel;
		self.currentObj.Name = currentName;
		self.currentObj.NodeID = currentNode;
		self.currentObj.FeaturedItemsHeader = currentFeaturedContent;
		self.JumpNav = { To: currentName, Type: jumpType };
		self.setUrl(currentIndex || currentName, urlMethod);
	};

	NavListController.prototype.setUrl = function (currentId, urlMethod, jumpTo) {
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
			case 'jump':
				var folderSplit = locationPath.split("/");
				var newLocation = '';
				for (var x = 0; x <= jumpTo; x++) {
					newLocation += ('/' + folderSplit[x]);
				}
				newLocationPath = fixUrl(newLocation +'/'+ currentId + locationPathRemoved);
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
					KeyWords: node.Keywords,
					FeaturedItemsHeader: node.FeatureItemsContent
				});
				if (node.Keywords.length) {
					var keywordsToLookForArr = node.Keywords.toLowerCase().split(',');
					var filteredResults = filterListByKeywords(resultsByKeywords, keywordsToLookForArr);
					var foundNode = findNodeDeep(self.classesByNodeId, node.ParentNodeID);
					if (_.isObject(foundNode)) {
						foundNode[node.NodeID] = { 
							results: filteredResults, 
							parent: node.ParentNodeID,
							keywords: node.Keywords,
							name: node.Name 
						};
					} else {
						self.classesByNodeId[node.NodeID] = { 
							results: filteredResults, 
							parent: node.ParentNodeID,
							keywords: node.Keywords,
							name: node.Name
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
			self.deleteSaved(foundSearch, self.savedSearches, 'savedSearches');
		} else {
			self.savedSearches.push(savedSearch);
			self.cookieStore.put('savedSearches',self.savedSearches);
		}
	};

	NavListController.prototype.saveProgram = function (title, img, url) {
		var self = this;
		var savedProgram = { 
			Url: url,
			Title: title,
			Img: img
		};

		var foundProgram = _.findIndex(self.savedPrograms, function (sp) {
			return sp.Url === savedProgram.Url && sp.Title === savedProgram.Title && sp.Img === savedProgram.Img;
		});
		if (foundProgram >= 0) {
			self.deleteSaved(foundProgram, self.savedPrograms, 'savedPrograms');
		} else {
			self.savedPrograms.push(savedProgram);
			self.cookieStore.put('savedPrograms',self.savedPrograms);
		}
	};

	NavListController.prototype.deleteSaved = function (index, savedItems, type) {
		var self = this;
		savedItems.splice(index, 1);
		self.cookieStore.put(type,savedItems);
	};

	NavListController.prototype.loadMore = function (env) {
		var self = this;
		if (env === self.environment) {
			self.limit += self.origLimit;
		}
	};

	NavListController.prototype.sliceBy = function (slicer) {
		var self = this;
		var location = self.location;
		var locationPath = location.path();
		var origLocationPath = locationPath;
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
			case 'datetimeagetypesearch':
				sliceUrl = [DAYSLICEURL, TIMESLICEURL, SDATESLICEURL, EDATESLICEURL, AGESLICEURL, TYPESLICEURL, SEARCHSLICEURL];
				sliceArr = [self.daySlice, self.timeSlice, Date.parse(self.sdateSlice), Date.parse(self.edateSlice), self.ageSlice, self.typeSlice, self.textboxSearch];
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
			if (locationPath === origLocationPath) {
				self.opened.dayOrTime = false;
				self.opened.ageRange = false;
			} else {
				location.path(locationPath);
			}
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
			self.opened.dayOrTime = true;
		} else {
			if (!self.dateApplyClicked) {
				self.daySlice = _.clone(self.origDaySlice);
				self.timeSlice = _.clone(self.origTimeSlice);
				self.sdateSlice = self.origSdateSlice;
				self.edateSlice = self.origEdateSlice;
			}
			self.opened.dayOrTime = false;
		}
	};

	NavListController.prototype.checkDateInit = function () {
		var self = this;
		//https://github.com/angular-ui/bootstrap/issues/3701 - clear date issue
		//since fields don't get cleared directly due to bug, we must explicitly set date fields to undefined
		if (_.isNull(self.sdateSlice) || (self.sdateSlice && (typeof self.sdateSlice === 'object' && (self.sdateSlice).getTime() === 0))) {
			delete self.sdateSlice;
		}
		if (_.isNull(self.edateSlice) || (self.edateSlice && (typeof self.edateSlice === 'object' && (self.edateSlice).getTime() === 0))) {
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
		if (clearWhich.indexOf('type') >=0) {
			self.typeSlice = 'all';
		}
		if (clearWhich.indexOf('search') >=0) {
			self.textboxSearch = '';
		}
		//var sliceBy = clearWhich.indexOf('datetime') >= 0 && clearWhich.indexOf('age') >=0 ? 'datetimeage' : clearWhich;
		self.sliceBy(clearWhich);
	};

	NavListController.prototype.checkAgeState = function (open) {
		var self = this;
		if (open) {
			self.ageApplyClicked = false;
			self.origAgeSlice = _.clone(self.ageSlice);
			self.opened.ageRange = true;
		} else {
			if (!self.ageApplyClicked) {
				self.ageSlice = _.clone(self.origAgeSlice);
			}
			self.opened.ageRange = false;
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
		var isDateFilterEnabled = self.isFilterEnabled('date');
		var index = 0;
		if (isDateFilterEnabled) {
			self.enabledFilters['Date or Time'] = {
				pre: '',
				suf: '',
				ind: ++index
			};
		}
		var isTypeFilterEnabled = self.isFilterEnabled('type');
		if (isTypeFilterEnabled) {
			self.enabledFilters['Class/Event'] = {
				pre: '',
				suf: '',
				ind: ++index
			};
		}
		var isAgeFilterEnabled = self.isFilterEnabled('age');
		if (isAgeFilterEnabled) {
			self.enabledFilters['Age Range'] = {
				pre: '',
				suf: '',
				ind: ++index
			};
		}
		var isSearchFilterEnabled = self.isFilterEnabled('search');
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

	NavListController.prototype.isFilterEnabled = function (which) {
		var self = this;
		var enabled;
		switch (which) {
			case 'date':
				enabled = !self.checkDateInit() && self.initialized;
				break;
			case 'type':
				enabled = !_.isUndefined(self.typeSlice) && self.typeSlice !== 'all';
				break;
			case 'age':
				enabled = !self.checkAgeInit() && self.initialized;
				break;
			case 'search':
				enabled = !_.isUndefined(self.textboxSearch) && self.textboxSearch !== '';
				break;
			default:
				enabled = (!self.checkDateInit() && self.initialized) || 
				(!_.isUndefined(self.typeSlice) && self.typeSlice !== 'all') || (!self.checkAgeInit() && self.initialized) || 
				(!_.isUndefined(self.textboxSearch) && self.textboxSearch !== '');
		}
		return enabled;
	};

	NavListController.prototype.scrollReset = function () {
		var self = this;
		self.scrollingUp = true;
		self.affixed = false;
	};

	NavListController.prototype.showFeaturedHeader = function () {
		var self = this;
		var breadcrumbs = self.getBreadcrumbs(true);
		if (_.isUndefined(breadcrumbs)) {
			return false;
		} else {
			return ((self.getBreadcrumbs(true)).FeaturedItemsHeader).length > 0 && self.onscreenResults.length > 0;
		}
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
			if (!_.isNaN(sliceVal) && sliceVal !== 'all' && sliceVal !== '') {
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
						return catprod.keyword.toLowerCase().trim();
					});
				} else {
					var navKeywords = _.map(navs.KeyWord, function (catprod) {
						return catprod.toLowerCase().trim();
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

    var formatDataFromJson = function(arr, nodeId) {
        var packageNo = arr.PackageNo;
        var prodNo = arr.ProductionSeasonNumber === 0 ? packageNo : arr.ProductionSeasonNumber;
        var keyWords = _.pluck(arr.CategoryProductionKeywords, 'keyword');
        var futurePerformanceDates = _.pluck(arr.FuturePerformances, 'perf_dt');
        var itemTypes = _.remove(keyWords, function(n) {
            return (n.toLowerCase() === 'class' || n.toLowerCase() === 'event');
        });
        var featured = _.includes(keyWords, 'Featured Item') ? true : false;
        var pushToBottom = arr.PushToBottomOfList;
        if (pushToBottom && featured) {
            featured = false;
        }
        var itemType = itemTypes.length ? itemTypes[0] : "";
        var mainImage = arr.MainImage;
        var image = mainImage.length === 0 ? '/_ui/uptown/img/default_lrg_516x311.jpg' : mainImage.substring(mainImage.indexOf('/'));
        var begDate = arr.NextPerformanceDateTime || arr.FirstDate;
        begDate = new Date(parseInt(begDate.substr(6)));
        var yearNumber = begDate.getFullYear();

        var futurePerfCount = Number(arr.FuturePerformanceCount);
        var startDate = futurePerfCount > 1 ? "Multiple dates/times" : formatDateOutput(begDate);

        var sortDate1 = "";
        var sortDate2 = "";
        var warning = arr.ProdStatus;
        var inProgress;
        if (pushToBottom || begDate < new Date()) {
            sortDate2 = begDate;
            //10 is an arbirtary number to set the secondary sorting
            sortDate1 = begDate.setFullYear(yearNumber + 10);
            inProgress = true;
            pushToBottom = true;
        } else {
            sortDate1 = begDate;
            sortDate2 = "";
            inProgress = false;
        }

        var shortDescription = "<div class='shortDescTxt pb10'>" + arr.ShortDesc + "</div>";
        var shortDesc = shortDescription.replace(/<p>/g, '').replace(/<\/p>/g, '<br />');
        var instructors = _.map(arr.ProdSeasonInstructors, function(arr) {
            return arr.Instructor_name.replace(/\s{2,}/g, ' ');
        });
        var teachers = instructors.toString();

        if (isActualNumber(futurePerfCount) && futurePerfCount > 0) {
            if (teachers.length && futurePerfCount > 1) {
                shortDesc += "<div class='teach'><b>Instructor" + (instructors.length > 1 ? "s" : "") + ":</b>&nbsp;&nbsp;" + teachers.replace(/,/g, ", ") + "</div>";
            }
            var performances = arr.FuturePerformances;
            if (performances.length > 0) {
                if (performances.length > 1) {
                    if (packageNo === 0) {
                        shortDesc += "<a class='expand-collapse'>" + "Multiple Dates/Times (" + performances.length + ")" + " <i class='fa fa-lg fa-caret-down'></i></a>";
                    } else {
                        shortDesc += "<a class='expand-collapse'>" + "This Subscription Includes (" + performances.length + ")" + " <i class='fa fa-lg fa-caret-down'></i></a>";
                    }
                }
                _.forEach(performances, function(p, ind) {
                    var perfDate = p.perf_dt;
                    perfDate = new Date(parseInt(perfDate.substr(6)));
                    var futureDate = formatDateOutput(perfDate);
                    var fromPrice = p.lowest_price;
                    if (fromPrice !== 'Free') {
                        fromPrice = 'from ' + fromPrice;
                    }
                    var numSessions = p.number_of_sessions;
                    var dowArr, teachArr;
                    if (itemType.toLowerCase() === 'class') {
                        var rawTeachers = p.instructors;
                        teachArr = rawTeachers.split(',');
                        var classInstructors = '';
                        _.forEach(teachArr, function(tch, index) {
                            classInstructors += tch;
                            if ((index + 1) < teachArr.length) {
                                classInstructors += ', ';
                            }
                        });
                        var rawDaysOfWeek = p.days_of_week;
                        if (!_.isNull(rawDaysOfWeek)) {
                            dowArr = rawDaysOfWeek.split(',');
                            var daysOfWeek = '';
                            _.forEach(dowArr, function(dow, index) {
                                daysOfWeek += dow;
                                if ((index + 1) < dowArr.length) {
                                    daysOfWeek += ', ';
                                }
                            });
                        }
                    }
                    if (packageNo === 0) {
                        if (ind === 0) {
                            shortDesc += "<div class='expand-collapse-container " + ((ind + 1) === performances.length ? "" : "collapse") + "'>"
                            shortDesc += "<table width='100%'cellpadding='0' cellspacing='0' class='schedule mt5'><tbody><tr>";
                            if (itemType.toLowerCase() === 'class') {
                                shortDesc += "<th width='185'>Start Date</th><th>Day" + (dowArr.length > 1 ? "s" : "") + "</th>" +
                                    "<th>Session" + (numSessions > 1 ? "s" : "") + "</th><th>Price</th>" +
                                    "<th>" + (teachers.length ? "Instructor" + (teachArr.length > 1 ? "s" : "") : "") + "</th>";
                            } else {
                                shortDesc += "<th width='185'>Date</th><th>Price</th>";
                            }
                            shortDesc += "</tr>";
                        }
                        shortDesc += "<tr><td>" + futureDate + "</td>";
                        if (itemType.toLowerCase() === 'class') {
                            shortDesc += "<td>" + daysOfWeek + "</td><td>" + numSessions + "</td>" +
                                "<td>" + fromPrice + "</td><td>" + classInstructors + "</td>";
                        } else {
                            shortDesc += "<td>" + fromPrice + "</td>";
                        }
                        shortDesc += "</tr>";

                        //Closes the table and expand/collapse div
                        if ((ind + 1) === performances.length) {
                            shortDesc += "</tbody></table></div>";
                        }
                    } else {
                        if (ind === 0) {
                            shortDesc += "<div class='expand-collapse-container collapse'><table cellpadding='0' cellspacing='0' class='schedule schedule-subs mt5'><tbody><tr>";
                        }
                        shortDesc += "<td width='100'><img src=\"http://www.92y.org" + p.thumbnail + "\" border=\"0\" alt=\"" + p.title + "\" / style=\"width: 105px;\">"
                        shortDesc += "<br /><a href='http://www.92y.org/tickets/production.aspx?ba=1&performanceNumber=" + p.perf_no + "' target='_blank'>" + p.title + "</a><span class='futureDate'>" + futureDate + "</span></td>";

                        //Closes the table and expand/collapse div
                        if ((ind + 1) === performances.length) {
                            shortDesc += "</tr></tbody></table></div>";
                        }
                    }
                });
            }
        }

        if (arr.ThisIsPartOfSeries && arr.ThisIsPartOfSeries.length) {
            shortDesc += "<div class='partof'>This is part of:  ";
            var moreLinks = [];
            _.forEach(arr.ThisIsPartOfSeries, function(series, index) {
                if ((index + 1) <= arr.ThisIsPartOfSeries.length) {
                    if (index <= 1) {
                        shortDesc += (index >= 1 ? ', ' + series : series);
                    } else {
                        moreLinks.push(series);
                    }
                } else {
                    moreLinks.push(series);
                }
            });
            if (moreLinks.length > 1) {
                shortDesc += ', and <a class="expand-collapse mt5"> more (' + moreLinks.length + ') <i class="fa fa-lg fa-caret-down"></i></a>';
                shortDesc += '<div class="expand-collapse-container collapse">';
                _.forEach(moreLinks, function(ml) {
                    shortDesc += "<div class='morelink'>" + ml + "</div>";
                });
                shortDesc += "</div>";
            }
            shortDesc += "</div>";
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
    };

    var formatCommaString = function(uglyString) {
        uglyString = uglyString.replace(/,(.)/g, function($0, $1) {
            return ', ' + _.capitalize($1);
        });
        return _.capitalize(uglyString);
    };

    var formatDateOutput = function(uglyDate, short) {
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
        var dateMinute = uglyDate.getMinutes() > 0 ? ":" + (uglyDate.getMinutes().toString().length === 1 ? "0" + uglyDate.getMinutes() : uglyDate.getMinutes()) : "";
        var prettyDate = short ? monthAbbr[uglyDate.getMonth()] + " " + uglyDate.getDate() + " " + yearNumber : dayAbbr[uglyDate.getDay()] + ", " + monthAbbr[uglyDate.getMonth()] + " " + uglyDate.getDate() + ", " + yearNumber + ", " + dateHour + dateMinute + " " + ampm;
        return prettyDate;
    };

	var TileInfoService = function (http, q, cacheFactory) {
		var self = this;
		self.http = http;
		self.q = q;
	    self.cacheFactory = cacheFactory;
	};
	TileInfoService.$inject = ['$http', '$q', 'CacheFactory'];

	TileInfoService.prototype.getAll = function (url, cache, cacheType) {
		var self = this;
		return self.http.get(url, {cache: self.cacheFactory.get(cache.info().id)}).success(function (data) {
			cache.put(cacheType, {
			    itemData: data
			});
			return data;
		});
	};

	TileInfoService.prototype.getItems = function (subLevelId, levels, cache) {
		var self = this;
	    var foundLevel = _.find(levels, { 'NodeID': subLevelId });
		var jsonFile = foundLevel.JSONDataURL;

		if (_.isUndefined(jsonFile) || jsonFile === '') {
			return self.getItemsById(subLevelId);
			//return self.q.when([]);
		} else {
			return self.http.get(jsonFile, {cache: self.cacheFactory.get(cache.info().id), timeout: 4000}).then(function (data) {
				if (_.isUndefined(data.data) || data.data.length === 0) {
					return self.getItemsById(subLevelId);
				}
			    cache.put(foundLevel.Name, {
			        itemData: data.data
			    });
				return data;
			}, function (error) {
				return self.getItemsById(subLevelId);
			});
		}
	};

	TileInfoService.prototype.getItemsById = function (subLevelId) {
		var self = this;
		var jsonFile;
		switch (subLevelId) {
			case 28220:
				jsonFile = 'items/CatProdPkg_School_Of_Arts.json';
				break;
			case 28271:
				jsonFile = 'items/CatProdPkg_Talks.json';
				break;
			case 28279:
				jsonFile = 'items/CatProdPkg_Special_Events.json';
				break;
			case 28275:
				jsonFile = 'items/CatProdPkg_Concerts_Performances.json';
				break;
			case 28273:
				jsonFile = 'items/CatProdPkg_Continuing_Education.json';
				break;
			case 28272:
				jsonFile = 'items/CatProdPkg_Health_Fitness.json';
				break;
			case 28274:
				jsonFile = 'items/CatProdPkg_Jewish_Life.json';
				break;
			case 28276:
				jsonFile = 'items/CatProdPkg_Literary.json';
				break;
			case 28277:
				jsonFile = 'items/CatProdPkg_Kids_Family.json';
				break;
		}
		return self.http.get(jsonFile).then(function (data) {
			return data;
		}, function (error) {
			return {data: []};
		});
	};
    
	navApp.service('tileInfoSrv', TileInfoService);

	NavListController.$inject = ['$scope', 'tileInfoSrv', '$location', '$timeout', '$window', '$cookieStore', 'navConfig'];
	navApp.controller('NavListController', NavListController);

	navApp.directive('enableContainer', function () {
		function link(scope, element) {
			var divNoJs = element.children('#nojs');
			divNoJs.css('display', 'none');
			var divTiles = element.children('#tiles');
			divTiles.css('display', '');
		}
		return {
			link: link
		};
	});

	navApp.directive('getBodyDimensions', function () {
		function link(scope) {
			resizeTileDisplay(scope);
		}
		return {
			link: link
		};
	});

	navApp.directive('getElementPosition', function () {
		return {
			link: function (scope, element, attrs) {
				var raw = element[0];
				scope.$watch(function() {
					return raw.offsetTop;
				}, function(newValue, oldValue) {
					var winHeight = $(window).height();
					var headerHeight;
					if (attrs.skipHeader == "true") {
						headerHeight = 0;
					} else {
						headerHeight = $('header').height();
					}
					var containerHeight = winHeight - (newValue + headerHeight);
					scope.navListCtrl.bottomContainerStyle.height = containerHeight +'px';

					element.bind('scroll', function () {
						if (raw.scrollTop > 0 && scope.navListCtrl.scrollingUp === false) {
							scope.navListCtrl.affixed = true;
						} else {
							scope.navListCtrl.affixed = false;
							if (raw.scrollTop === 0) {
								scope.navListCtrl.scrollingUp = false;	
							}
						}
						scope.$apply();
					});
				});
			}
		};
	});

	navApp.directive('backToTopButton', function () {
		return {
			link: function (scope, element, attrs) {
				scope.$watch(function() {
					return scope.navListCtrl.affixed;
				}, function(newValue, oldValue) {
					if (newValue === false) {
						$("#bottomContainer").scrollTop(0);
					}
				});
			}
		};
	});

	navApp.filter('unsafe', function($sce) {
		return function(val) {
			return $sce.trustAsHtml(val);
		};
	});
    
    navApp.config(['$analyticsProvider', function($analyticsProvider){
        $analyticsProvider.registerPageTrack(function(path) {
            var cleanPath = path.replace(/%20/g, ' ');
            var pathArray = cleanPath.split('/');
            var virtualPageUrl;
            var virtualPageTitle;
            _.forEach(pathArray, function (p, ind) {
                //if programfinder.html found in the path, initialize virtualPageTitle and go to next iteration
                if (p.toLowerCase().indexOf(SCRIPTNAME.toLowerCase()) >= 0) {
                    virtualPageTitle = '';
                    return;
                }
                //if virtualPageTitle has been initialized but not filled in
                if (!_.isUndefined(virtualPageTitle) && virtualPageTitle === '') {
                    //if we are at the end of the loop and we still haven't filled in virtualPageUrl, then fill it in with the main interest area
                    //otherwise just initialize the variable for the next iteration
                    //also, fill in the virtualPageTitle variable and then go to next iteration
                    if ((ind + 1) === pathArray.length) {
                        virtualPageUrl = '/'+ p;
                    } else {
                        virtualPageUrl = '';
                    }
                    virtualPageTitle = p;
                    return;
                }
                //if virtualPageUrl has been initialized, add in the rest of the path to it
                if (!_.isUndefined(virtualPageUrl)) {
                    virtualPageUrl += '/'+ p;
                }
            });
            var dataLayer = window.dataLayer = window.dataLayer || [];
            dataLayer.push({
                'event': 'VirtualPageview',
                'virtual-page-URL': virtualPageUrl,
                'virtual-page-title': virtualPageTitle
            });
        });
    }]);
    
    navApp.config(function($provide) {
        $provide.decorator("$exceptionHandler", function($delegate) {
            return function(exception, cause) {
                $delegate(exception, cause);
                logErrorToServer(exception, cause);
            };
        });
    });

})();

var logErrorToServer = function(ex, cwz) {
    try {
        $.ajax({
            type: "POST",
            url: "/handlers/LogJSErrors.ashx",
            contentType: "application/json",
            data: angular.toJson({
                errorUrl: window.location.href +" = "+ navigator.userAgent,
                errorMessage: ex.message,
                stackTrace: ex.stack,
                cause: ( cwz || "" )
            })
        });
    }
    catch(err) {
        console.log(err.message);
    }
};

var isDate = function (checkDate) {
	return _.isDate(checkDate) || (Number(checkDate) > 0 && _.isFinite(Number(checkDate)) && _.isDate(new Date(checkDate))) ? true : false;
};

var resizeTileDisplay = function (scope) {

	var tileHeight, numColumns;
	scope.navListCtrl.environment = "desktop";
	if (window.matchMedia( "(min-width: 1199px)" ).matches) {
		numColumns = 1;
		tileHeight = 211;
	} else if (window.matchMedia( "(min-width: 991px)" ).matches) {
		numColumns = 1;
		tileHeight = 201;
	} else if (window.matchMedia( "(min-width: 767px)" ).matches) {
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
		scope.navListCtrl.bodyStyle = {'overflow-x': 'hidden','overflow-y': 'auto','-webkit-overflow-scrolling': 'touch'};
		scope.navListCtrl.bottomContainerStyle = {};
		headerHeight = $("header").height();
		
	} else {
		headerHeight = $("#Container").offset().top;
		mainArea = $("#main-area").height();
		scope.navListCtrl.bodyStyle = { 'height': '100%', 'margin': '0', 'padding': '0', 'overflow': 'hidden' };
		scope.navListCtrl.bottomContainerStyle = {'overflow-y': 'auto', '-webkit-overflow-scrolling': 'touch', 'overflow-x': 'hidden', 'height': (window.innerHeight-mainArea) - 50 +'px' };
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
	for (var x = start; x <= end; x++){
		if (_.isUndefined(arr[x]) || clear) {
			arr[x] = [];	
		}
	}
	return end;
};

var isActualNumber = function (num) {
	return !isNaN(parseFloat(num)) && isFinite(num);
};


$(document).on('click','.expand-collapse', function(){
	
	//Basic Expand Collapse

	//(Clicked Element)Expand/collapse button
	expandBtn = $(this);

	//Targets next div after clicked element
	//Get isoContainer in Angular, slideToggle, then reload angular-masonry
	var scope = angular.element("#isoContainer, #isoContainerMobile").scope();
	scope.$apply(function(){
		expandBtn.next(".expand-collapse-container").slideToggle('800', function() {
			scope.$broadcast('masonry.reload');
		});
	});
});


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