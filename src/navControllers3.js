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
		_this.scope.animationSpeed;
		_this.breadCrumbs = [];

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
		_this.dayOfWeekSelected = { name: 'dayOfWeek', value: [] };
		_this.timeOfDaySelected = { name: 'timeOfDay', value: [] };
		_this.itemTypeSelected = { name: 'itemType', value: 'all' };
		_this.queryWordTyped = { name: 'queryWord', value: '' };
		_this.slicerArray = [_this.dayOfWeekSelected, _this.timeOfDaySelected, _this.itemTypeSelected, _this.queryWordTyped];
		_this.clearResults();
		_this.appStarted = false;
		_this.nodeIdArray = [];
		_this.l1SubInterest = { name: 'level1', arr: [] };
		_this.l2SubInterest = { name: 'level2', arr: [] };
		_this.l3SubInterest = { name: 'level3', arr: [] };
		_this.l4SubInterest = { name: 'level4', arr: [] };
		_this.levelArrays = [_this.l1SubInterest, _this.l2SubInterest, _this.l3SubInterest, _this.l4SubInterest];
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
		_this.l1SubInterest.arr = [];

		var interestItems = _.filter(_scope.clickedItems, 'level1', interest );
		_.forEach(interestItems, function (arr) {
			var nodeId = arr.id;
			if (isActualNumber(nodeId)) {
				// var foundClass = findDeep(allKeys, {
				// 	'NodeID': nodeId
				// });
				var foundClass = findDeep(allKeys, nodeId);
				var foundClassKeywordsArray = foundClass.Keywords.toLowerCase().split(',');
				var filteredNavs = filterList(_this.navsDict[interest], foundClassKeywordsArray);
				var classInfoObjArray = addToArray(nodeId, filteredNavs);
				_this.origClassInfoArray = _this.origClassInfoArray.concat(classInfoObjArray);
			}
			if (!_.contains(_this.l1SubInterest.arr, interest)){
				_this.l1SubInterest.arr.push(interest);
			}
		});
		_this.reduceList();
	};
	NavListController.prototype.reduceList = function (nodeId, levelArray) {
		var _this = this;
		var _scope = _this.scope;
		var arrayToTest = _this.origClassInfoArray.slice();
		var combinedReducedArray = [];
			
		if (_scope.ageRanges.kids){
			combinedReducedArray.push.apply(combinedReducedArray, _this.filterByAge('newborn-5 years', arrayToTest));
			combinedReducedArray.push.apply(combinedReducedArray, _this.filterByAge('6-12 years', arrayToTest));
			combinedReducedArray.push.apply(combinedReducedArray, _this.filterByAge('teens', arrayToTest));
			combinedReducedArray.push.apply(combinedReducedArray, _this.filterByAge('multigenerational', arrayToTest));
		}else{
			combinedReducedArray.push.apply(combinedReducedArray, _this.filterByAge('adults', arrayToTest));
		}
		var combinedLengths = 1;
		_.forEach(_this.slicerArray, function (arr) {
			combinedLengths = _this.reduceBySlicer(arr, arrayToTest, combinedReducedArray, combinedLengths);
		});

		if (!_.isUndefined(nodeId)){
			if (isActualNumber(nodeId)){
				if (_.contains(_this.nodeIdArray, nodeId)){
					_.pull(_this.nodeIdArray, nodeId);
				}else{
					_this.nodeIdArray.push(nodeId);
				}
			}else{
				if (_.contains(levelArray.arr, nodeId)){
					_.pull(levelArray.arr, nodeId);

					var levelChildren = _.filter(_scope.clickedItems, levelArray.name, nodeId);
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
					if (isActualNumber(nodeId)) {
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
						if (isActualNumber(nodeId)) {
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
		if (combinedReducedArray.length > 0) {
			combinedLengths++;	
		}
		_this.clearResults();

		var combinedLength = combinedReducedArray.length + combinedLengths;
		_this.unsortedEditClassInfoArray = combinedLength > 0 ? combinedReducedArray.slice() : arrayToTest.slice();
		_this.undedupedEditClassInfoArray = _.sortByAll(_this.unsortedEditClassInfoArray, ['SortDate1', 'SortDate2']);
		_this.editClassInfoArray = _.uniq(_this.undedupedEditClassInfoArray, 'Title');
		_this.onscreenFirstResults = _this.onscreenFirstResults.concat(_this.editClassInfoArray.slice(0, _scope.classInfoIndex));
		_this.appStarted = true;
	};
	NavListController.prototype.reduceBySlicer = function (slicer, arrayToTest, combinedReducedArray, combinedLengths) {
		var slicerValue = slicer.value;
		var slicerName = slicer.name;
		if ((slicerName === "itemType" && slicerValue !== 'all') || (slicerName !== "itemType" && slicerValue.length > 0)){
			var _this = this;
			if (combinedLengths > 0) {
				//this will change the array yet still keep the passed-in reference
				arrayToTest.length = 0;
				arrayToTest.push.apply(arrayToTest, combinedReducedArray);
			}
			combinedReducedArray.length = 0;
			if (slicerName === "itemType" || slicerName === "queryWord"){
				//convert string to array so forEach doesn't split string
				slicerValue = [slicerValue];
			}
			_.forEach(slicerValue, function (slc) {
				var reducedArray = _.filter(arrayToTest, function (arr) {
					var returnValue;
					switch (slicerName) {
						case "itemType":
							returnValue = arr.ItemType.toLowerCase() === slc.toLowerCase();
							break;
						case "queryWord":
							var pattern = new RegExp(slc, "i");
							returnValue = pattern.test(arr.Teachers) || pattern.test(arr.Title) || pattern.test(arr.KeyWord.toString());
							break;
						default:
							var keywordLowerCase = _.map(arr.KeyWord, function (kw) {
								return kw.toLowerCase();
							});
							returnValue = _.contains(keywordLowerCase, slc);
							break;
					}
					return returnValue;
				});
				_.forEach(reducedArray, function (arr) {
					if (!_.contains(combinedReducedArray, arr)) {
						combinedReducedArray.push(arr);
					}
				});
			});
			combinedLengths += slicerValue.length;
		}
		return combinedLengths;
	};
	NavListController.prototype.filterByAge = function (ageRange, arrayToTest) {
		var _this = this;
		var _scope = _this.scope;
		if (_scope.ageRanges[ageRange] || _scope.ageRanges.allKids){
			var filteredReducedArray = _.filter(arrayToTest, function (arr) {
				var keywordLowerCase = _.map(arr.KeyWord, function (kw) {
					return kw.toLowerCase();
				});
				return _.contains(keywordLowerCase, ageRange);
			});
			return filteredReducedArray;
		}
	}
	NavListController.prototype.loadMore = function () {
		var _this = this;
		var _scope = _this.scope;
		var onscreenResultsArrayLength = _this.onscreenFirstResults.length;
		if (onscreenResultsArrayLength > 0) {
			_scope.animationSpeed = '0';
			var arrDiff = _this.editClassInfoArray.length - onscreenResultsArrayLength;
			if (arrDiff !== 0) {
				var indexNo = arrDiff > _scope.classInfoIndex ? _scope.classInfoIndex : arrDiff;
				_this.onscreenFirstResults = _this.onscreenFirstResults.concat(this.editClassInfoArray.slice(onscreenResultsArrayLength, (onscreenResultsArrayLength + indexNo)));
			}
		}
	};
	NavListController.prototype.setAgeRange = function (age) {
		var _this = this;
		var _scope = _this.scope;
		switch (age) {
			case "adults":
				_scope.ageRanges[age] = true;
				_scope.ageRanges.kids = false;
				_scope.ageRanges.allKids = false;
				_scope.ageRanges['newborn-5 years'] = false;
				_scope.ageRanges['6-12 years'] = false;
				_scope.ageRanges.teens = false;
				_scope.ageRanges.multigenerational = false;
				break;
			case "kids":
				_scope.ageRanges[age] = true;
				_scope.ageRanges.adults = false;
				break;
			case "allKids":
				_scope.ageRanges[age] = !_scope.ageRanges[age];
				_scope.ageRanges['newborn-5 years'] = false;
				_scope.ageRanges['6-12 years'] = false;
				_scope.ageRanges.teens = false;
				_scope.ageRanges.multigenerational = false;
				_scope.ageRanges.adults = false;
				_scope.ageRanges.kids = true;
				break;
			default:
				_scope.ageRanges[age] = !_scope.ageRanges[age];
				if (_scope.ageRanges['newborn-5 years'] === false && _scope.ageRanges['6-12 years'] === false && _scope.ageRanges.teens === false && _scope.ageRanges.multigenerational === false){
					_scope.ageRanges.allKids = true;
				}else{
					_scope.ageRanges.allKids = false;
				}
				break;
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

	var addToArray = function (nodeId, filteredNavs) {
		var classInfoObjArray = [];
		_.forEach(filteredNavs, function (arr) {
			var classInfoObj = formatDataFromJson(arr, nodeId);
			classInfoObjArray.push(classInfoObj);
		});
		return classInfoObjArray;
	};

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

	var formatDataFromJson = function (arr, nodeId){
		var prodNo = arr.prod_season_no === 0 ? arr.PackageNo : arr.ProdSeasonNo;
		var keyWords = _.pluck(arr.CategoryProductionKeywords, 'keyword');
		var itemTypes = _.remove(keyWords, function (n) { 
			return (n.toLowerCase() === 'class' || n.toLowerCase() === 'event');
		});
		var itemType = itemTypes.length > 0 ? itemTypes[0] : "";
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
		var futurePerfCount = Number(arr.FuturePerformanceCount);
		//var price;
		if (isActualNumber(futurePerfCount) && futurePerfCount > 0){
			shortDesc += "<br/>Starting From:  "+ arr.LowestPrice;
			var performances = arr.FuturePerformances;
			_.forEach(performances, function(p, ind) {
				var perfDate = p.perf_dt;
				perfDate = new Date(parseInt(perfDate.substr(6)));
				var futureDate = formatDateOutput(perfDate);
				if (ind === 0){
					shortDesc += "<br/>Upcoming Dates:  "+ futureDate;
				}else{
					if (ind >= 3){
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
			//Teachers: teachers,
			//Price: price,
			//Performances: performances
		};
		return classInfoObj;
	}

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


	navApp.directive('setIsoSpeed', function () {
		function link(scope, element) {
			var initialDuration = '.7s';
			element.isotope({ transitionDuration: initialDuration });
			scope.animationSpeed = initialDuration;
			scope.$watch('animationSpeed', function() {
				//console.log(scope.animationSpeed);
				element.isotope({ transitionDuration: scope.animationSpeed });
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

var isActualNumber = function (num) {
	return !isNaN(parseFloat(num)) && isFinite(num);
};