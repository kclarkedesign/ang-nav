(function () {
	'use strict';
	var navApp = angular.module('artNavApp', ['lodash', 'infinite-scroll', 'iso.directives']);//, 'ngAnimate'
	var NavListController = function ($scope, artClassService, keywordsService) {
		var _this = this;
		_this.classKeys = [];
		_this.eventKeys = [];
		_this.navsDict = {};
		_this.scope = $scope;

		_this.keywordsService = keywordsService;
		_this.keywordsService.getKeywordsForClasses().then(function (classes) {
			_this.classKeys = classes.data;
		});
		_this.keywordsService.getKeywordsForEvents().then(function (events) {
			_this.eventKeys = events.data;
		});

		_this.artClassService = artClassService;
		_this.artClassService.getAdultEdItemsByKeywords().then(function (items) {
			_this.navsDict["Continuing Education & Enrichment"] = items.data;
		});
		_this.artClassService.getConcertsItemsByKeywords().then(function (items) {
			_this.navsDict["Concerts & Performances"] = items.data;
		});
		_this.artClassService.getFitnessItemsByKeywords().then(function (items) {
			_this.navsDict["Health & Fitness"] = items.data;
		});
		_this.artClassService.getJewishItemsByKeywords().then(function (items) {
			_this.navsDict["Jewish Life"] = items.data;
		});
		_this.artClassService.getLiteratureItemsByKeywords().then(function (items) {
			_this.navsDict["Literary"] = items.data;
		});
		_this.artClassService.getParentItemsByKeywords().then(function (items) {
			_this.navsDict["Parenting & Early Childhood"] = items.data;
		});
		_this.artClassService.getSOAItemsByKeywords().then(function (items) {
			_this.navsDict["School of the Arts"] = items.data;
		});
		_this.artClassService.getTalksItemsByKeywords().then(function (items) {
			_this.navsDict["Talks"] = items.data;
		});

		_this.scope.classInfoIndex = 6;
		_this.gridColCount = 3;
		_this.scope.clickedItems = {};
		_this.clearArrays();
		_this.appStarted = false;
		_this.scope.ageRanges = 
		{ 
			adults : false,
			kids : false,
			allKids: false,
			'newborn-5 years' : false,
			'6-12 years' : false,
			teens : false,
			multigenerational : false
		};

		//debug in view
		_this.log = function (variable) {
			console.log(variable);
		};
	};
	NavListController.prototype.clearArrays = function () {
		var _this = this;
		_this.origClassInfoArray = [];
		_this.editClassInfoArray = [];
		_this.unsortedEditClassInfoArray = [];
		_this.undedupedEditClassInfoArray = [];
		_this.dayOfWeekSelected = [];
		_this.timeOfDaySelected = [];
		_this.itemTypeSelected = 'all';
		_this.clearResults();
		_this.appStarted = false;
		_this.nodeIdArray = [];
		_this.l1SubInterestArray = { name: 'level1', arr: [] };
		_this.l2SubInterestArray = { name: 'level2', arr: [] };
		_this.l3SubInterestArray = { name: 'level3', arr: [] };
		_this.l4SubInterestArray = { name: 'level4', arr: [] };
		_this.levelArrays = [_this.l1SubInterestArray, _this.l2SubInterestArray, _this.l3SubInterestArray, _this.l4SubInterestArray];
		_this.queryWord = '';
	};
	NavListController.prototype.clearResults = function () {
		var _this = this;
		_this.onscreenFirstResults = [];
		_this.appStarted = false;
	};
	NavListController.prototype.getAllLevelOne = function (interest) {
		var _this = this;
		var _scope = _this.scope;
		_this.origClassInfoArray = [];
		var allKeys = _this.classKeys.concat(_this.eventKeys);
		_this.l1SubInterestArray.arr = [];

		var interestItems = _.where(_scope.clickedItems, { 'level1': interest });
		_.forEach(interestItems, function (arr) {
			var nodeId = arr.id;
			if (_this.isActualNumber(nodeId)) {
				// var foundClass = findDeep(allKeys, {
				// 	'NodeID': nodeId
				// });
				var foundClass = findDeep(allKeys, nodeId);
				var foundClassKeywordsArray = foundClass.Keywords.toLowerCase().split(',');
				var filteredNavs = filterList(_this.navsDict[interest], foundClassKeywordsArray);
				var classInfoObjArray = addToArray(nodeId, filteredNavs);
				_this.origClassInfoArray = _this.origClassInfoArray.concat(classInfoObjArray);
			}
			if (!_.contains(_this.l1SubInterestArray.arr, interest)){
				_this.l1SubInterestArray.arr.push(interest);
			}
		});
		_this.reduceList();
	};
	NavListController.prototype.reduceList = function (nodeId, levelArray) {
		var _this = this;
		var _scope = _this.scope;
		var arrayToTest = _this.origClassInfoArray.slice();
		var combinedReducedArray = [];
		var combinedLengths = 0;
		_this.clearResults();

		if (_scope.ageRanges.adults){
			combinedReducedArray = _.filter(arrayToTest, function (arr) {
				var keywordLowerCase = _.map(arr.KeyWord, function (kw) {
					return kw.toLowerCase();
				});
				return _.contains(keywordLowerCase, 'adults');
			});
			if (combinedReducedArray.length === 0) {
				_this.clearResults();
			}
			combinedLengths++;
		}else if (_scope.ageRanges.kids){
			if (_scope.ageRanges['newborn-5 years'] || _scope.ageRanges.allKids){
				var combinedReducedArray1 = _.filter(arrayToTest, function (arr) {
					var keywordLowerCase = _.map(arr.KeyWord, function (kw) {
						return kw.toLowerCase();
					});
					return _.contains(keywordLowerCase, 'newborn-5 years');
				});
				combinedReducedArray.push.apply(combinedReducedArray, combinedReducedArray1);
			}						
			if (_scope.ageRanges['6-12 years'] || _scope.ageRanges.allKids){
				var combinedReducedArray2 = _.filter(arrayToTest, function (arr) {
					var keywordLowerCase = _.map(arr.KeyWord, function (kw) {
						return kw.toLowerCase();
					});
					return _.contains(keywordLowerCase, '6-12 years');
				});
				combinedReducedArray.push.apply(combinedReducedArray, combinedReducedArray2);
			}						
			if (_scope.ageRanges.teens || _scope.ageRanges.allKids){
				var combinedReducedArray3 = _.filter(arrayToTest, function (arr) {
					var keywordLowerCase = _.map(arr.KeyWord, function (kw) {
						return kw.toLowerCase();
					});
					return _.contains(keywordLowerCase, 'teens');
				});
				combinedReducedArray.push.apply(combinedReducedArray, combinedReducedArray3);
			}						
			if (_scope.ageRanges.multigenerational || _scope.ageRanges.allKids){
				var combinedReducedArray4 = _.filter(arrayToTest, function (arr) {
					var keywordLowerCase = _.map(arr.KeyWord, function (kw) {
						return kw.toLowerCase();
					});
					return _.contains(keywordLowerCase, 'multigenerational');
				});
				combinedReducedArray.push.apply(combinedReducedArray, combinedReducedArray4);
			}
			if (combinedReducedArray.length === 0) {
				_this.clearResults();
			}
			combinedLengths++;
		}

		if (_this.dayOfWeekSelected.length > 0) {
			if (combinedLengths > 0) {
				arrayToTest = combinedReducedArray.slice();
			}
			combinedReducedArray = [];
			reduceByTimePeriod(_this.dayOfWeekSelected, arrayToTest, combinedReducedArray);
			if (combinedReducedArray.length === 0) {
				_this.clearResults();
			}
			combinedLengths += _this.dayOfWeekSelected.length;
		}

		if (_this.timeOfDaySelected.length > 0) {
			if (combinedLengths > 0) {
				arrayToTest = combinedReducedArray.slice();
			}
			combinedReducedArray = [];
			reduceByTimePeriod(_this.timeOfDaySelected, arrayToTest, combinedReducedArray);
			if (combinedReducedArray.length === 0) {
				_this.clearResults();
			}
			combinedLengths += _this.timeOfDaySelected.length;
		}

		if (_this.itemTypeSelected !== 'all') {
			if (combinedLengths > 0) {
				arrayToTest = combinedReducedArray.slice();
			}
			combinedReducedArray = [];
			combinedReducedArray = _.filter(arrayToTest, function (arr) {
				return arr.ItemType.toLowerCase() === _this.itemTypeSelected.toLowerCase();
			});
			if (combinedReducedArray.length === 0) {
				_this.clearResults();
			}
			combinedLengths += _this.itemTypeSelected.length;
		}

		if (_this.queryWord.length > 0) {
			if (combinedLengths > 0) {
				arrayToTest = combinedReducedArray.slice();
			}
			combinedReducedArray = [];
			combinedReducedArray = _.filter(arrayToTest, function (arr) {
				var pattern = new RegExp(_this.queryWord, "i");
				return pattern.test(arr.Teachers) || pattern.test(arr.Title) || pattern.test(arr.KeyWord.toString());
			});
			if (combinedReducedArray.length === 0) {
				_this.clearResults();
			}
			combinedLengths ++;
		}

		if (!_.isUndefined(nodeId)){
			if (_this.isActualNumber(nodeId)){
				if (_.contains(_this.nodeIdArray, nodeId)){
					_.pull(_this.nodeIdArray, nodeId);
				}else{
					_this.nodeIdArray.push(nodeId);
				}
			}else{
				if (_.contains(levelArray.arr, nodeId)){
					_.pull(levelArray.arr, nodeId);

					var whereObj = new Object;
					whereObj[levelArray.name] = nodeId;

					var levelChildren = _.where(_scope.clickedItems, whereObj);
					_.forEach(levelChildren, function(arr) {
						var childId = arr.id;
						if (_.contains(_this.nodeIdArray, childId)){
							_.pull(_this.nodeIdArray, childId);
						}
					});
				}else{
					levelArray.arr.push(nodeId);
				}
			}
		}

		var origArrayToTest = [];
		if (combinedLengths > 0) {
			arrayToTest = combinedReducedArray.slice();
			origArrayToTest = arrayToTest.slice();
		}
		combinedReducedArray = [];
		var level4DrilledDown = [];
		var level3DrilledDown = [];
		var level2DrilledDown = [];
		var level1DrilledDown = [];

		var nodeReducedArray = [];
		_.forEach(_this.nodeIdArray, function (sub) {
			_.forEach(_scope.clickedItems, function (arr) {
				if (arr.id === sub) {
					var nodeId = arr.id;
					if (_this.isActualNumber(nodeId)) {
						var reducedArray = _.filter(arrayToTest, {
							'NodeID': nodeId
						});
						nodeReducedArray = nodeReducedArray.concat(reducedArray);
						level4DrilledDown.push(arr.level4);
						level3DrilledDown.push(arr.level3);
						level2DrilledDown.push(arr.level2);
						level1DrilledDown.push(arr.level1);
					}
				}
			});
		});
		if (nodeReducedArray.length > 0){
			combinedReducedArray = combinedReducedArray.concat(nodeReducedArray);
		}

		var levelsDrilledDown = [level1DrilledDown, level2DrilledDown, level3DrilledDown, level4DrilledDown]
		var levels = ['level1', 'level2', 'level3', 'level4'];
		for (var x = _this.levelArrays.length -1; x >= 0; x--){
			var levelName = _this.levelArrays[x].name;
			var levelReducedArray = [];
			_.forEach(_this.levelArrays[x].arr, function (sub) {
				_.forEach(_scope.clickedItems, function (arr) {
					if (arr[levelName] === sub && !_.contains(levelsDrilledDown[x], sub)) {
						var nodeId = arr.id;
						if (_this.isActualNumber(nodeId)) {
							var reducedArray = _.filter(arrayToTest, {
								'NodeID': nodeId
							});
							levelReducedArray = levelReducedArray.concat(reducedArray);
							for (var y = x-1; y >= 0; y--){
								levelsDrilledDown[y].push(arr[levels[y]]);
							}
						}
					}
				});
			});
			if (levelReducedArray.length > 0){
				combinedReducedArray = combinedReducedArray.concat(levelReducedArray);
			}
		}

		if (combinedReducedArray.length === 0) {
			_this.clearResults();
		}else{
			combinedLengths++;	
		}

		var combinedLength = combinedReducedArray.length + combinedLengths;
		_this.unsortedEditClassInfoArray = combinedLength > 0 ? combinedReducedArray.slice() : arrayToTest.slice();
		_this.undedupedEditClassInfoArray = _.sortByAll(_this.unsortedEditClassInfoArray, ['SortDate1', 'SortDate2']);
		_this.editClassInfoArray = _.uniq(_this.undedupedEditClassInfoArray, 'Title');
		_this.onscreenFirstResults = _this.onscreenFirstResults.concat(_this.editClassInfoArray.slice(0, _scope.classInfoIndex));
		_this.appStarted = true;
	};
	NavListController.prototype.loadMore = function () {
		var _this = this;
		var _scope = _this.scope;
		var onscreenResultsArrayLength = _this.onscreenFirstResults.length;
		if (onscreenResultsArrayLength > 0) {
			var arrDiff = _this.editClassInfoArray.length - onscreenResultsArrayLength;
			if (arrDiff !== 0) {
				var indexNo = arrDiff > _scope.classInfoIndex ? _scope.classInfoIndex : arrDiff;
				_this.onscreenFirstResults = _this.onscreenFirstResults.concat(this.editClassInfoArray.slice(onscreenResultsArrayLength, (onscreenResultsArrayLength + indexNo)));
			}
		}
	};
	NavListController.prototype.isActualNumber = function (num) {
		return !isNaN(parseFloat(num)) && isFinite(num);
	};
	NavListController.prototype.setAgeRange = function (age) {
		var _this = this;
		var _scope = _this.scope;
		if (age === "adults"){
			_scope.ageRanges[age] = true;
			_scope.ageRanges.kids = false;
			_scope.ageRanges.allKids = false;
			_scope.ageRanges['newborn-5 years'] = false;
			_scope.ageRanges['6-12 years'] = false;
			_scope.ageRanges.teens = false;
			_scope.ageRanges.multigenerational = false;
		}else if (age === "kids"){
			_scope.ageRanges[age] = true;
			_scope.ageRanges.adults = false;
		}else if (age === "allKids"){
			_scope.ageRanges[age] = !_scope.ageRanges[age];
			_scope.ageRanges['newborn-5 years'] = false;
			_scope.ageRanges['6-12 years'] = false;
			_scope.ageRanges.teens = false;
			_scope.ageRanges.multigenerational = false;
			_scope.ageRanges.adults = false;
			_scope.ageRanges.kids = true;
		}else{
			_scope.ageRanges[age] = !_scope.ageRanges[age];
			if (_scope.ageRanges['newborn-5 years'] === false && _scope.ageRanges['6-12 years'] === false && _scope.ageRanges.teens === false && _scope.ageRanges.multigenerational === false){
				_scope.ageRanges.allKids = true;
			}else{
				_scope.ageRanges.allKids = false;
			}
		}
	};
	NavListController.prototype.getRowSpace = function (heightOfExpandedFormWithTwoRowsOfResults) {
		var _this = this;
		var numOfDefaultRows = 2;
		var windowHeight = $(window).height();
		var heightDiff = windowHeight - heightOfExpandedFormWithTwoRowsOfResults;
		var classInfoIndex;
		if (heightDiff > 0){
			var heightOfResultBox = 360;
			var numberOfResultsPerRow = _this.gridColCount;
			var amountOfBlankSpace = Math.ceil(heightDiff / heightOfResultBox);
			numOfDefaultRows += amountOfBlankSpace;
			classInfoIndex = numOfDefaultRows * numberOfResultsPerRow;
		}else{
			//very small resolutions
			var numberOfResultsPerRow = _this.gridColCount;
			classInfoIndex = numOfDefaultRows * numberOfResultsPerRow;
		}
		return classInfoIndex;
	};

	var reduceByTimePeriod = function (timePeriodSelected, arrayToTest, combinedReducedArray) {
		_.forEach(timePeriodSelected, function (slicer) {
			var reducedArray = _.filter(arrayToTest, function (arr) {
				var keywordLowerCase = _.map(arr.KeyWord, function (kw) {
					return kw.toLowerCase();
				});
				return _.contains(keywordLowerCase, slicer);
			});
			_.forEach(reducedArray, function (arr) {
				if (!_.contains(combinedReducedArray, arr)) {
					combinedReducedArray.push(arr);
				}
			});
		});
	};

	var addToArray = function (nodeId, filteredNavs) {
		var classInfoObjArray = [];
		var dayAbbr = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");
		var monthAbbr = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");

		_.forEach(filteredNavs, function (arr) {
			var prodNo = arr.prod_season_no === 0 ? arr.PackageNo : arr.ProdSeasonNo;
			var keyWords = _.pluck(arr.CategoryProductionKeywords, 'keyword');
			var itemTypes = _.remove(keyWords, function (n) { 
				return (n.toLowerCase() === 'class' || n.toLowerCase() === 'event');
			});
			var itemType;
			if (itemTypes.length > 0){
				itemType = itemTypes[0];
			}else{
				itemType = "";
			}
			var image = arr.MainImage;
			if (image.length === 0) {
				image = '/_ui/uptown/img/default_lrg_516x311.jpg';
			} else {
				image = image.substring(image.indexOf('/'));
			}
			var startDate;
			var begDate = arr.NextPerformanceDateTime;
			if (begDate === null){
				begDate = arr.FirstDate;
			}
			begDate = new Date(parseInt(begDate.substr(6)));

			//var begDate = new Date(parseInt(arr.FirstDate.substr(6)));
			var multDates = arr.IsMultipleDatesTimes;
			if (multDates){
				startDate = "Multiple dates/times";
			}else{
				var dayNumber = begDate.getDate();
				var monthNameIndex = begDate.getMonth();
				var dayNameIndex = begDate.getDay();
				var yearNumber = begDate.getFullYear();

				var dateHour = begDate.getHours();
				var ampm = dateHour < 12 ? "AM" : "PM";
				if (dateHour == 0){
					dateHour = 12;
				}
				if (dateHour > 12){
					dateHour = dateHour - 12;
				}
				var timeMinute = begDate.getMinutes()
				if (timeMinute > 0){
					var dateMinute = ":"+ timeMinute;
				}else{
					var dateMinute = "";
				}
				startDate = dayAbbr[dayNameIndex] +", "+ monthAbbr[monthNameIndex] +" " + dayNumber +", "+ yearNumber +", "+ dateHour + dateMinute + " " + ampm;
			}
			var sortDate1 = "";
			var sortDate2 = "";
			var warning = arr.ProdStatus;
			if (begDate < new Date() || warning.length > 0){
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
				ItemType: itemType,
				Teachers: teachers
			};
			classInfoObjArray.push(classInfoObj);
		});
		return classInfoObjArray;
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

	var findDeep = function (items, attrs) {
		// function match(value) {
		// 	for (var key in attrs) {
		// 		if (!_.isUndefined(value)) {
		// 			if (attrs[key] !== value[key]) {
		// 				return false;
		// 			}
		// 		}
		// 	}
		// 	return true;
		// }

		function traverse(value) {
			var result;
			_.forEach(value, function (val) {
				//if (match(val)) {
				if (val.NodeID === attrs) {
					result = val;
					return false;
				}
				if (_.isObject(val) || _.isArray(val)) {
					result = traverse(val);
				}
				if (result) {
					return false;
				}
			});
			return result;
		}
		return traverse(items);
	};

	var ArtClassService = function (http) {
		var _this = this;
		_this.http = http;
	};
	ArtClassService.$inject = ['$http'];
	ArtClassService.prototype.getAdultEdItemsByKeywords = function () {
		var _this = this;
		return _this.http.get('items/CatProdPkg_AdultEd.json').success(function (data) {
			return data;
		});
	};	
	ArtClassService.prototype.getConcertsItemsByKeywords = function () {
		var _this = this;
		return _this.http.get('items/CatProdPkg_ConcertsPerformances.json').success(function (data) {
			return data;
		});
	};	
	ArtClassService.prototype.getFitnessItemsByKeywords = function () {
		var _this = this;
		return _this.http.get('items/CatProdPkg_FitnessClasses.json').success(function (data) {
			return data;
		});
	};	
	ArtClassService.prototype.getJewishItemsByKeywords = function () {
		var _this = this;
		return _this.http.get('items/CatProdPkg_JewishLife.json').success(function (data) {
			return data;
		});
	};	
	ArtClassService.prototype.getLiteratureItemsByKeywords = function () {
		var _this = this;
		return _this.http.get('items/CatProdPkg_Literature.json').success(function (data) {
			return data;
		});
	};	
	ArtClassService.prototype.getParentItemsByKeywords = function () {
		var _this = this;
		return _this.http.get('items/CatProdPkg_ParentingEarlyChildhood.json').success(function (data) {
			return data;
		});
	};	
	ArtClassService.prototype.getSOAItemsByKeywords = function () {
		var _this = this;
		return _this.http.get('items/CatProdPkg_SOA.json').success(function (data) {
			return data;
		});
	};	
	ArtClassService.prototype.getTalksItemsByKeywords = function () {
		var _this = this;
		return _this.http.get('items/CatProdPkg_Talks.json').success(function (data) {
			return data;
		});
	};
	navApp.service('artClassService', ArtClassService);

	var KeywordsService = function (http) {
		var _this = this;
		_this.http = http;
	};
	KeywordsService.$inject = ['$http'];
	KeywordsService.prototype.getKeywordsForClasses = function () {
		var _this = this;
		return _this.http.get('arc-response_AllClasses.json').success(function (data) {
			return data;
		});
	};
	KeywordsService.prototype.getKeywordsForEvents = function () {
		var _this = this;
		return _this.http.get('arc-response_Events.json').success(function (data) {
			return data;
		});
	};
	navApp.service('keywordsService', KeywordsService);

	NavListController.$inject = ['$scope', 'artClassService', 'keywordsService'];
	navApp.controller('NavListController', NavListController);

	navApp.directive('setClickedItem', function () {
		function link(scope, element) {
			var checkBoxes = $('input:checkbox', element);
			$.each(checkBoxes, function (key, value) {
				var chkBox = $(value);
				var chkBoxId = chkBox[0].id * 1;
				if (chkBoxId > 0){
					var chkBoxLblVal = chkBox.next().text();
					var levelOneSection = chkBox.closest('.has-subnav').children('.interest-title');
					var levelOne = levelOneSection.children('span').text();
					var levelTwo = chkBox.closest('.row-section').prev().text();
					var levelFourSection = chkBox.closest('ul');
					var levelFour = levelFourSection[0].id;
					var levelThree = '';
					var containingUl = chkBox.closest('ul')[0];
					if (_.isUndefined(containingUl.id)){
						//level 3
						levelThree = chkBox[0].name;
					}else{
						var ulId = containingUl.id;
						if ($(containingUl).hasClass('level-four')){
							levelThree = ulId;
						}else{
							if ($(containingUl).hasClass('level-five')){
								var parentCheckbox = $('input#'+ ulId);
								containingUl = parentCheckbox.closest('ul')[0];
								if ($(containingUl).hasClass('level-four')){
									levelThree = containingUl.id;
								}
							}
						}
					}
					scope.clickedItems[chkBoxLblVal.replace(/\W/g, '') +'_'+ chkBoxId] = {
						id: chkBoxId,
						name: chkBoxLblVal,
						clicked: false,
						visible: false,
						level1: levelOne,
						level2: levelTwo,
						level3: levelThree,
						level4: levelFour
					};
				}
			});
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

(function () {
	'use strict';
	var lodash = angular.module('lodash', []);
	lodash.factory('_', function () {
		return window._;
	});
})();