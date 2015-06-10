(function () {
	'use strict';
	var __startingLevel = 0;
	var __maxLevel = 0;
	var __initializing = true;

	var navApp = angular.module('artNavApp', ['angularLocalStorage', 'wu.masonry', 'infinite-scroll']);
	var NavListController = function ($scope, tileInfoSrv, $location, $timeout, storage, $window) {
		var self = this;
		var classesByInterest = [];
		self.arrCategory = [];
		self.location = $location;
		self.JumpNav = {};
		self.navsDict = {};
		self.onscreenResults = [];
		self.resultsByKeywords = [];
		self.classesByNodeId = {};
		self.limit = 0;
		self.origLimit = 0;
		self.numOfColumns = 0;

		storage.bind($scope, 'navListCtrl.savedSearches', { defaultValue: [] });

		self.tileInfoSrv = tileInfoSrv;

		self.tileInfoSrv.getSOAItems().then(function (items) {
			self.resultsByKeywords = self.navsDict["School of the Arts"] = items.data;

			self.tileInfoSrv.getAllClasses().then(function (data) {
				classesByInterest.push(data.data[5]);
				self.getValues(classesByInterest, 0);
				self.buildCurrentObj();
				self.displayTiles();
			});

		});

		var w = angular.element($window);
		w.bind('resize', function () {
			resizeTileDisplay($scope);

			self.onscreenResults = [];
			$scope.$apply();
			self.displayTiles();
			self.loadMore();
		});

		$scope.$watch(function () {
			return self.location.path();
		}, function (){
			if (__initializing) {
				$timeout(function() { __initializing = false; });
			} else {
				var locationPath = self.location.path();
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
						lastCurrent.Current = false;
						self.activeBreadcrumb.push(cloneCurrentObj);
						break;
					case 'linkBack':
						// if link in active breadcrumb is clicked
						var lastLocationPath = self.lastLocationPath;
						var numOfSlashesLastLocation = (lastLocationPath.match(/\//g) || []).length;

						if (locationPath === '/') {
							self.activeBreadcrumb = self.activeBreadcrumb.slice(0, 1);
						}else{
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
						}else{
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
					default:
						// if browser back and forward buttons used for unpredictable jumps
						self.buildCurrentObj();
						break;
				}
				self.displayTiles();
				self.lastLocationPath = locationPath;
				self.JumpNav = {};
				self.limit = self.origLimit;
			}
		});
	};

	NavListController.prototype.displayTiles = function () {
		var self = this;
		if (self.currentObj.Level === 0) {
			self.getClassesByNodeId(self.classesByNodeId);
		}else{
			self.getClassesByNodeId(self.currentObj.NodeID);
		}
	};

	NavListController.prototype.getClassesByNodeId = function (id) {
		var self = this;
		if (_.isObject(id)){
			self.onscreenResults = [];
			var cni;
			for (cni in id) {
				_.forEach(self.classesByNodeId[cni], function (arr) {
					var classInfoObj = formatDataFromJson(arr, cni);
					var checkPropExists = _.find(self.onscreenResults, { 'ProdNo': classInfoObj.ProdNo });
					if (_.isUndefined(checkPropExists)){
						self.onscreenResults.push(classInfoObj);
					}
				});
			}
		}else{
			//self.onscreenResults = [];
			var onscreenResultsQueue = [];
			_.forEach(self.classesByNodeId[id], function (arr) {
				var classInfoObj = formatDataFromJson(arr, id);
				onscreenResultsQueue.push(classInfoObj);
			});
			var lastLocArr = self.lastLocationPath.split("/");
			var locArr = self.location.path().split("/");

			if (_.difference(locArr, lastLocArr).length === 1){
				if (self.onscreenResults.length) {
					_.forEach(_.clone(self.onscreenResults), function (arr) {
						var checkPropExists = _.find(onscreenResultsQueue, { 'ProdNo': arr.ProdNo });
						if (_.isUndefined(checkPropExists)){
							_.pull(self.onscreenResults, arr);
						}
					});
				}else{
					self.onscreenResults = _.clone(onscreenResultsQueue);
				}
			}else{
				self.onscreenResults = _.clone(onscreenResultsQueue);
			}
		}
		self.onscreenResults = _.sortByAll(self.onscreenResults, ['SortDate1', 'SortDate2']);
	};

	NavListController.prototype.buildCurrentObj = function () {
		var self = this;
		var locationPath = self.location.path();
		if (locationPath.length && locationPath !== '/') {
			self.lastLocationPath = locationPath;
			var subfolders = locationPath.split('/');
			var findChild, foundChildParent, findObj, foundChild;
			self.activeBreadcrumb = [];
			_.forEachRight(subfolders, function (folder, index) {
				if (folder.length) {
					if (_.isUndefined(foundChildParent)){
						if (index === 1){
							//if this is only one level above then we can safely assume there are no duplicate children
							findObj = { 'Name': folder };
						}else{
							//this is to safeguard against multiple children of the same name
							var findAllPossibleChildren = _.where(self.arrCategory[index], { 'Name': folder });
							var findAllPossibleParents = _.where(self.arrCategory[index-1], { 'Name': subfolders[index-1] });
							_.forEach(findAllPossibleChildren, function (kids, index) {
								var parentId = kids.Parent;
								var foundParent = _.where(findAllPossibleParents, { NodeID: parentId });
								if (foundParent.length){
									foundChildParent = foundParent[0].NodeID;
									return false;
								}
							});
							findObj = { 'Name': folder, Parent: foundChildParent };
						}
					}else{
						findObj = { 'Name': folder, NodeID: foundChildParent };
					}
					findChild = _.where(self.arrCategory[index], findObj);
					foundChild = findChild[0];
					foundChildParent = foundChild.Parent;
					foundChild = _.clone(foundChild);
					delete foundChild.Parent;

					if (index === (subfolders.length - 1)){
						foundChild.Current = true;
						self.currentObj = _.clone(foundChild);
					}	
				}else{
					foundChild = {
						Level: 0,
						Name: 'School of the Arts',
						NodeID: 3446,
						Current: false
					};
				}
				self.activeBreadcrumb.push(_.clone(foundChild));
			});
			self.activeBreadcrumb.reverse();
		}else{
			self.currentObj = {
				Level: 0,
				Name: 'School of the Arts',
				NodeID: 3446,
				Current: true
			};
			self.activeBreadcrumb = [ _.clone(self.currentObj) ];
			self.lastLocationPath = '';
		}
	};

	NavListController.prototype.setCurrent = function (currentId, parentIndex) {
		var self = this;
		var currentName, currentLevel, currentNode, jumpType, currentIndex;
		var urlMethod = 'default';
		if (isActualNumber(currentId)){
			if (_.isUndefined(parentIndex)) {
				jumpType = 'linkBack';
				urlMethod = 'parse';
			}else{
				var pastSearch = self.savedSearches[parentIndex];
				//prevent multiple clicks to same link
				if (pastSearch[currentId].NodeID === self.currentObj.NodeID){
					return;
				}
				self.activeBreadcrumb = _.clone(pastSearch);
				jumpType = 'jumpTo';
				urlMethod = 'build';
				currentIndex = currentId;
			}
			var breadCrumb = self.activeBreadcrumb[currentId];
			currentName = breadCrumb.Name;
			currentLevel = breadCrumb.Level;
			currentNode = breadCrumb.NodeID;
		}else{
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

		if (!isActualNumber(currentId)){
			//protect against any links with a forward-slash, like Beginner/Advanced
			//this is so the slash doesn't get interpreted as another level
			currentId = currentId.replace(/\//,'%2F');
		}
		switch (urlMethod) {
			case 'parse':
				if (currentId === 'School of the Arts'){
					locationPath = '';
				}else{
					var folderPosition = locationPath.indexOf('/'+ currentId +'/');
					locationPath = locationPath.substr(0, folderPosition + currentId.length + 1);
				}
				location.path(locationPath);
				break;
			case 'build':
				var newLocation = '';
				for (var x = 1; x <= currentId; x++) {
					newLocation += ('/' + self.activeBreadcrumb[x].Name);	
				}
				location.path(newLocation === '' ? '/'+ newLocation : newLocation);
				break;
			default:
				if (locationPath === '/'){
					locationPath = '';
				}
				location.path(locationPath + '/'+ currentId);	
		}
	};

	NavListController.prototype.getValues = function (nodes, level) {
		var self = this;
		var tempArr = [];
		_.forEach(nodes, function (node){
			if ((node.ChildNode.length === 0 && node.Keywords.length) || node.ChildNode.length > 0){
				tempArr.push({ 
					Name: node.Name.trim(), 
					NodeID: node.NodeID, 
					Level: level, 
					Parent: node.ParentNodeID, 
					KeyWords: node.Keywords 
				});
				if (node.Keywords.length) {
					var keywordsToLookForArr = node.Keywords.toLowerCase().split(',');
					var filteredResults = filterList(self.resultsByKeywords, keywordsToLookForArr);
					if (filteredResults.length) {
						self.classesByNodeId[node.NodeID] = filteredResults;
					}
				}
				if (level > __maxLevel){
					__maxLevel = level;
				}
				if (node.ChildNode.length){
					var childNodeValue = self.getValues(node.ChildNode, ++level);
					if (!childNodeValue){
						tempArr.pop();
					}
					--level;
				}
			}
		});
		if (tempArr.length === 0){
			return false;
		}
		if (__startingLevel < __maxLevel){
			__startingLevel = adjustLevelArray(self.arrCategory, __startingLevel, __maxLevel);
		}
		self.arrCategory[level] = self.arrCategory[level].concat(tempArr);
		return true;
	};

	NavListController.prototype.getBreadcrumbs = function (last) {
		var self = this;
		return last ? _.last(self.activeBreadcrumb) : _.initial(self.activeBreadcrumb);
	};

	NavListController.prototype.saveSearch = function () {
		var self = this;
		var breadcrumbToAdd = _.clone(self.activeBreadcrumb);
		var crumbToCheck = _.last(breadcrumbToAdd);
		var isCrumbAlreadySaved = false;
		_.forEach(self.savedSearches, function (ss) {
			var searchToCheck = _.last(ss);
			if (searchToCheck.NodeID === crumbToCheck.NodeID){
				isCrumbAlreadySaved = true;
				return false;
			}
		});
		if (!isCrumbAlreadySaved){
			self.savedSearches.push(_.clone(self.activeBreadcrumb));	
		}
	};

	NavListController.prototype.deleteSavedSearch = function (index) {
		var self = this;
		self.savedSearches.splice(index, 1);
	};

	NavListController.prototype.loadMore = function () {
		var self = this;
		self.limit += self.numOfColumns;
	};

	var filterList = function (navArr, foundClassKeywordsArray) {
		var filteredNavs = _.filter(navArr, function (navs) {
			var navKeywords = _.map(navs.CategoryProductionKeywords, function (catprod) {
				return catprod.keyword.toLowerCase();
			});
			var filtered = _.filter(foundClassKeywordsArray, function(keyword){
				return navKeywords.indexOf(keyword) != -1;
			});
			return filtered.length === foundClassKeywordsArray.length;
		});
		return filteredNavs;
	};

	var formatDataFromJson = function (arr, nodeId){
		var prodNo = arr.ProductionSeasonNumber === 0 ? arr.PackageNo : arr.ProductionSeasonNumber;
		var keyWords = _.pluck(arr.CategoryProductionKeywords, 'keyword');
		var itemTypes = _.remove(keyWords, function (n) { 
			return (n.toLowerCase() === 'class' || n.toLowerCase() === 'event');
		});
		var itemType = itemTypes.length ? itemTypes[0] : "";
		var mainImage = arr.MainImage;
		var image = mainImage.length === 0 ? '/_ui/uptown/img/default_lrg_516x311.jpg' : mainImage.substring(mainImage.indexOf('/'));
		var startDate;
		var begDate = arr.NextPerformanceDateTime || arr.FirstDate;
		begDate = new Date(parseInt(begDate.substr(6)));
		var yearNumber = begDate.getFullYear();

		var multDates = arr.IsMultipleDatesTimes;
		if (multDates){
			startDate = "Multiple dates/times";
		}else{
			startDate = formatDateOutput(begDate);
		}

		var sortDate1 = "";
		var sortDate2 = "";
		var warning = arr.ProdStatus;
		if (begDate < new Date() || warning.length){
			sortDate2 = begDate;
			//10 is an arbirtary number to set the secondary sorting
			sortDate1 = begDate.setFullYear(yearNumber + 10);
			startDate = "";
		}else{
			sortDate1 = begDate;
			sortDate2 = "";
		}

		var shortDescription = arr.ShortDesc;
		var shortDesc = shortDescription.replace(/<p>/g, '').replace(/<\/p>/g, '<br />');
		var instructors = _.map(arr.ProdSeasonInstructors, function (arr) {
			return arr.Instructor_name.replace(/\s{2,}/g, ' ');
		});
		var teachers = instructors.toString();
		var futurePerfCount = Number(arr.FuturePerformanceCount);

		if (isActualNumber(futurePerfCount) && futurePerfCount > 0){
			shortDesc += "<br/><b>Starting From:</b>  "+ arr.LowestPrice;
			var performances = arr.FuturePerformances;
			_.forEach(performances, function(p, ind) {
				var perfDate = p.perf_dt;
				perfDate = new Date(parseInt(perfDate.substr(6)));
				var futureDate = formatDateOutput(perfDate);
				if (ind === 0){
					shortDesc += "<br/><b>Upcoming Dates:</b><br/>"+ futureDate;
				}else{
					if (ind >= 3){
						shortDesc += "<br/>And "+ (futurePerfCount - 3) +" more";
						return false;
					}
					shortDesc += "<br/>"+ futureDate;
				}
			});
		}
		shortDesc += "<br/><a href=\"http://www.92y.org"+ arr.URL +"\" target=\"_blank\">Learn More &#10148;</a>";
		var classInfoObj = {
			Title: arr.Title,
			KeyWord: keyWords,
			ProdNo: prodNo,
			NodeID: nodeId,
			Desc: shortDesc,
			Img: image,
			FriendlyDate: startDate,
			SortDate1: sortDate1,
			SortDate2: sortDate2,
			Url: arr.URL,
			Warning: warning,
			ItemType: itemType
		};
		return classInfoObj;
	}

	var formatDateOutput = function (uglyDate) {
		var dayAbbr = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");
		var monthAbbr = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
		var dateHour = uglyDate.getHours();
		var yearNumber = uglyDate.getFullYear();
		var ampm = dateHour < 12 ? "AM" : "PM";
		if (dateHour == 0){
			dateHour = 12;
		}
		if (dateHour > 12){
			dateHour = dateHour - 12;
		}
		var dateMinute = uglyDate.getMinutes() > 0 ? ":"+ uglyDate.getMinutes() : "";
		var prettyDate = dayAbbr[uglyDate.getDay()] +", "+ monthAbbr[uglyDate.getMonth()] +" " + uglyDate.getDate() +", "+ yearNumber +", "+ dateHour + dateMinute + " " + ampm;
		return prettyDate;
	}

	var TileInfoService = function (http) {
		var self = this;
		self.http = http;
	};
	TileInfoService.$inject = ['$http'];

	TileInfoService.prototype.getAllClasses = function () {
		var self = this;
		return self.http.get('arc-response_AllClasses.json').success(function (data) {
			return data;
		});
	};
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

var resizeTileDisplay = function (scope) {
	var tileWidth = 320;
	var pageWidth = _.isUndefined(window.outerWidth) ? $(window).width() : window.outerWidth;

	var numColumns = Math.floor(pageWidth / tileWidth);

	var headerHeight = 274;
	var tileHeight = 360;
	var pageHeight = $(window).height();
	var pageHeightWithoutHeader = pageHeight - headerHeight;
	var numRows = Math.floor(pageHeightWithoutHeader / tileHeight);

	var limitToSet = numColumns * numRows;
	scope.navListCtrl.limit = limitToSet;
	scope.navListCtrl.numOfColumns = numColumns;
	scope.navListCtrl.origLimit = limitToSet + numColumns;
}

var adjustLevelArray = function (arr, start, end) {
	for (var x = start; x <= end; x++){
		arr[x] = [];
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
	$wrapper.children(".shortDescription").css("height", 180 - titleHeight - warnHeight+"px");
	if($wrapper.css("bottom") == "144px") {
		$wrapper.animate({bottom: "5px"});
		$classTitle.animate({bottom: "0"});
		$classDate.animate({bottom: "0"});
		$warning.animate({bottom: "0"});
		$content.slideUp(function () {
			$showMore.html($showMore.html().replace("Show Less ▼", "Show More ▲"));
		});
	} else {
		$wrapper.css( "bottom", "5px" );
		$wrapper.animate({bottom: "144px"});
		$classTitle.animate({bottom: "144px"});
		$classDate.animate({bottom: "144px"});
		$warning.animate({bottom: "144px"});
		$content.slideDown(function () {
			$showMore.html($showMore.html().replace("Show More ▲", "Show Less ▼"));
		});
	}
	return false;
});