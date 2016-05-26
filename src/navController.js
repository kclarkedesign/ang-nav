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
    var isMobile = false;

    var SCRIPTNAME = 'ProgramFinder.html';

    var STOPWORDS = ['a', 'able', 'about', 'across', 'after', 'all', 'almost', 'also', 'am', 'among', 'an', 'and', 'any', 'are', 'as', 'at',
                    'be', 'because', 'been', 'but', 'by', 'can', 'cannot', 'could', 'dear', 'did', 'do', 'does', 'either', 'else', 'ever',
                    'every', 'for', 'from', 'get', 'got', 'had', 'has', 'have', 'he', 'her', 'hers', 'him', 'his', 'how', 'however', 'i',
                    'if', 'in', 'into', 'is', 'it', 'its', 'just', 'least', 'let', 'like', 'likely', 'may', 'me', 'might', 'most', 'must',
                    'my', 'neither', 'no', 'nor', 'not', 'of', 'off', 'often', 'on', 'only', 'or', 'other', 'our', 'own', 'rather', 'said',
                    'say', 'says', 'she', 'should', 'since', 'so', 'some', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these',
                    'they', 'this', 'tis', 'to', 'too', 'twas', 'us', 'wants', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while',
                    'who', 'whom', 'why', 'will', 'with', 'would', 'yet', 'you', 'your'];

    var navApp = angular.module('artNavApp', ['infinite-scroll', 'ui.bootstrap', 'ngScrollSpy', 'ngTouch', 'ngCookies', 'angular-cache', 'angulartics', 'nav.config', 'ngProgress', 'angular-mmenu']);
    var NavListController = function ($scope, tileInfoSrv, $location, $timeout, $window, $cookieStore, navConfig, ngProgressFactory) {
        var self = this;
        self.allClasses = [{ Name: '', NodeID: LOADINGNODEID}];
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
        self.debounceGlobalSearch = _.debounce(function (searchTerm) { self.fetchSearchResults(searchTerm, true); }, 2000);
        self.applyScope = function () { $scope.$apply(); };
        self.enabledFilters = {};
        self.bottomContainerStyle = { 'overflow-x': 'hidden', 'height': '100%' };
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
        self.showNoGlobalResults = false;
        self.searchTerm = '';
        self.isFetching = false;
        self.dateClearClicked = false;
        self.ageClearClicked = false;
        self.progressbar = ngProgressFactory;
        self.mobileDetect();

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

        (function (cf) {
            if (!cf.get('navCache')) {
                self.navCache = cf('navCache', {
                    maxAge: 30 * 60 * 1000, //30 minutes
                    deleteOnExpire: 'aggressive',
                    onExpire: function (key, value) {
                        var currentInterestArea = self.arrCategory[0];
                        var currentInterestAreaName = currentInterestArea[0].Name;
                        var currentInterestAreaId = currentInterestArea[0].NodeID;
                        self.getInterestItems(self.interestCompiled, { Name: currentInterestAreaName, NodeID: currentInterestAreaId });
                    }
                });
            }
        })(self.tileInfoSrv.cacheFactory);

        self.tileInfoSrv.getAll('/webservices/categoryproduction.svc/FilterNodes/' + navConfig.FilterNodeNum + '/', self.navCache, 'navigation').then(function (data) {
            self.getInterestItems(self.getAllInitialClasses, data);
        }, function (respData) {
            if (!self.allClasses.length || (self.allClasses.length && self.allClasses[0].Name === '')) {
                self.allClasses = [{ Name: 'Error loading data.  Click to refresh.', NodeID: ERRORLOADINGNODEID}];
            }
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

        self.progressbar.start();
        $timeout(function () {
            self.progressbar.complete();
        }, 2000);

        $scope.mainMenuItems = [{"level":0,"items":[{"level":1,"items":[{"level":2,"text":"Lyrics & Lyricists","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Lyrics%20&%20Lyricists"},{"level":2,"items":[{"level":3,"text":"Soundspace","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Festivals%20&%20Special%20Events/Soundspace"},{"level":3,"text":"Seeing Music","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Festivals%20&%20Special%20Events/Seeing%20Music"}],"text":"Festivals & Special Events","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Festivals%20&%20Special%20Events"},{"level":2,"items":[{"level":3,"text":"Faculty Concerts","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/School%20of%20Music%20Concerts/Faculty%20Concerts"},{"level":3,"text":"School Concerts","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/School%20of%20Music%20Concerts/School%20Concerts"}],"text":"School of Music Concerts","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/School%20of%20Music%20Concerts"},{"level":2,"text":"Performance Master Class","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Performance%20Master%20Class"},{"level":2,"items":[{"level":3,"text":"Chamber Music","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Classical/Chamber%20Music"},{"level":3,"items":[{"level":4,"text":"Art of the Guitar","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Classical/Guitar/Art%20of%20the%20Guitar"}],"text":"Guitar","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Classical/Guitar"},{"level":3,"text":"Orchestra","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Classical/Orchestra"},{"level":3,"items":[{"level":4,"text":"Bridge to Beethoven","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Classical/Piano/Bridge%20to%20Beethoven"},{"level":4,"text":"Angela Hewitt: Bach Odyssey","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Classical/Piano/Angela%20Hewitt:%20Bach%20Odyssey"},{"level":4,"text":"Sir András Schiff Selects","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Classical/Piano/Sir%20Andr%C3%A1s%20Schiff%20Selects"},{"level":4,"text":"Masters of the Keyboard","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Classical/Piano/Masters%20of%20the%20Keyboard"}],"text":"Piano","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Classical/Piano"},{"level":3,"text":"Recital","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Classical/Recital"},{"level":3,"items":[{"level":4,"text":"Bridge to Beethoven","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Classical/Strings%20/Bridge%20to%20Beethoven"}],"text":"Strings ","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Classical/Strings%20"},{"level":3,"text":"Vocals","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Classical/Vocals"}],"text":"Classical","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Classical"},{"level":2,"text":"Concert Subscriptions","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Concert%20Subscriptions"},{"level":2,"items":[{"level":3,"text":"Baby Got Bach","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Family/Baby%20Got%20Bach"}],"text":"Family","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Family"},{"level":2,"text":"Jazz","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Jazz"},{"level":2,"text":"Popular & World","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts/Popular%20&%20World"}],"text":"Concerts","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Concerts"},{"level":1,"items":[{"level":2,"text":"Dig Dance Weekend Series","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Dance%20Performances/Dig%20Dance%20Weekend%20Series"},{"level":2,"text":"Fridays at Noon","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Dance%20Performances/Fridays%20at%20Noon"},{"level":2,"text":"Harkness Dance Festival","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Dance%20Performances/Harkness%20Dance%20Festival"}],"text":"Dance Performances","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts/Dance%20Performances"}],"text":"Performing Arts","href":"http://127.0.0.1:8080/ProgramFinder.html#/Performing%20Arts"},{"level":0,"items":[{"level":1,"text":"Civics","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Civics"},{"level":1,"items":[{"level":2,"text":"Gallery Tours","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Art%20Appreciation/Gallery%20Tours"}],"text":"Art Appreciation","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Art%20Appreciation"},{"level":1,"text":"Crafts","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Crafts"},{"level":1,"items":[{"level":2,"text":"Book Talk","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Creative%20Writing%20&%20Literature/Book%20Talk"},{"level":2,"text":"Open-Enrollment","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Creative%20Writing%20&%20Literature/Open-Enrollment"},{"level":2,"text":"Master Classes","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Creative%20Writing%20&%20Literature/Master%20Classes"},{"level":2,"text":"Creative Writing at 92Y","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Creative%20Writing%20&%20Literature/Creative%20Writing%20at%2092Y"},{"level":2,"text":"Litarary Seminars","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Creative%20Writing%20&%20Literature/Litarary%20Seminars"},{"level":2,"text":"Advanced Workshops","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Creative%20Writing%20&%20Literature/Advanced%20Workshops"},{"level":2,"text":"Shakespeare with Bob Smith","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Creative%20Writing%20&%20Literature/Shakespeare%20with%20Bob%20Smith"},{"level":2,"text":"Unterberg Poetry Center Writing Program","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Creative%20Writing%20&%20Literature/Unterberg%20Poetry%20Center%20Writing%20Program"}],"text":"Creative Writing & Literature","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Creative%20Writing%20&%20Literature"},{"level":1,"text":"Film","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Film"},{"level":1,"text":"Games","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Games"},{"level":1,"text":"Theater Arts","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Theater%20Arts"},{"level":1,"items":[{"level":2,"text":"Cooking Classes","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Food%20&%20Wine/Cooking%20Classes"},{"level":2,"items":[{"level":3,"text":"Francine Segan's World of Tasting","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Food%20&%20Wine/Tastings/Francine%20Segan's%20World%20of%20Tasting"}],"text":"Tastings","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Food%20&%20Wine/Tastings"},{"level":2,"text":"Tours","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Food%20&%20Wine/Tours"}],"text":"Food & Wine","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Food%20&%20Wine"},{"level":1,"text":"Jewish Life","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Jewish%20Life"},{"level":1,"items":[{"level":2,"text":"American Sign Language","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Languages/American%20Sign%20Language"},{"level":2,"text":"English as a Second Language","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Languages/English%20as%20a%20Second%20Language"},{"level":2,"text":"French","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Languages/French"},{"level":2,"text":"Hebrew","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Languages/Hebrew"},{"level":2,"text":"Italian","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Languages/Italian"},{"level":2,"text":"Spanish","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Languages/Spanish"},{"level":2,"text":"Yiddish","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Languages/Yiddish"}],"text":"Languages","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Languages"},{"level":1,"items":[{"level":2,"text":"Support Groups","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Personal%20Growth/Support%20Groups"},{"level":2,"text":"Wellness","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Personal%20Growth/Wellness"}],"text":"Personal Growth","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Personal%20Growth"},{"level":1,"text":"Professional Development","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Professional%20Development"},{"level":1,"items":[{"level":2,"text":"Gallery Tours","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Tours%20&%20Excursions/Gallery%20Tours"},{"level":2,"text":"Brooklyn Bus Tours","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Tours%20&%20Excursions/Brooklyn%20Bus%20Tours"},{"level":2,"text":"Nature","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Tours%20&%20Excursions/Nature"},{"level":2,"text":"Walking Tours","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Tours%20&%20Excursions/Walking%20Tours"}],"text":"Tours & Excursions","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment/Tours%20&%20Excursions"}],"text":"Continuing Education & Enrichment","href":"http://127.0.0.1:8080/ProgramFinder.html#/Continuing%20Education%20&%20Enrichment"},{"level":0,"items":[{"level":1,"items":[{"level":2,"text":"Performing Arts","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Arts%20&%20Ideas/Performing%20Arts"}],"text":"Arts & Ideas","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Arts%20&%20Ideas"},{"level":1,"text":"Kids & Family","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Kids%20&%20Family"},{"level":1,"text":"Talks","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Talks"},{"level":1,"text":"Tours & Travel","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Tours%20&%20Travel"},{"level":1,"items":[{"level":2,"text":"Jewish Afterschool","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Education/Jewish%20Afterschool"},{"level":2,"text":"Jewish Studies & Interfaith Classes","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Education/Jewish%20Studies%20&%20Interfaith%20Classes"},{"level":2,"text":"Yiddish & Hebrew Language","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Education/Yiddish%20&%20Hebrew%20Language"}],"text":"Education","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Education"},{"level":1,"items":[{"level":2,"text":"Chanukah at 92Y","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Holidays%20&%20Celebrations/Chanukah%20at%2092Y"},{"level":2,"text":"High Holidays Services","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Holidays%20&%20Celebrations/High%20Holidays%20Services"},{"level":2,"text":"Purim Passover Celebrations","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Holidays%20&%20Celebrations/Purim%20Passover%20Celebrations"},{"level":2,"text":"Shabbat Dinners & Celebrations","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Holidays%20&%20Celebrations/Shabbat%20Dinners%20&%20Celebrations"},{"level":2,"text":"Sukkot","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Holidays%20&%20Celebrations/Sukkot"}],"text":"Holidays & Celebrations","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Holidays%20&%20Celebrations"},{"level":1,"text":"Programs in Hebrew","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life/Programs%20in%20Hebrew"}],"text":"Jewish Life","href":"http://127.0.0.1:8080/ProgramFinder.html#/Jewish%20Life"},{"level":0,"items":[{"level":1,"items":[{"level":2,"text":"Group Instruction","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Aquatics/Group%20Instruction"},{"level":2,"text":"Lifeguard Training & Water Safety","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Aquatics/Lifeguard%20Training%20&%20Water%20Safety"},{"level":2,"text":"Private Instruction","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Aquatics/Private%20Instruction"},{"level":2,"text":"Special Needs","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Aquatics/Special%20Needs"}],"text":"Aquatics","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Aquatics"},{"level":1,"text":"CPR & First Aid","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/CPR%20&%20First%20Aid"},{"level":1,"items":[{"level":2,"text":"Aquacise","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Fitness%20Classes/Aquacise"},{"level":2,"text":"Martial Arts","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Fitness%20Classes/Martial%20Arts"},{"level":2,"text":"Pilates","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Fitness%20Classes/Pilates"},{"level":2,"text":"Specialized Fitness Classes","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Fitness%20Classes/Specialized%20Fitness%20Classes"},{"level":2,"text":"Yoga","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Fitness%20Classes/Yoga"}],"text":"Fitness Classes","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Fitness%20Classes"},{"level":1,"text":"Health Talks","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Health%20Talks"},{"level":1,"text":"Pre-Natal & Post-Partum","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Pre-Natal%20&%20Post-Partum"},{"level":1,"text":"Fitness Training","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Fitness%20Training"},{"level":1,"items":[{"level":2,"text":"Baseball","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Sports/Baseball"},{"level":2,"text":"Basketball","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Sports/Basketball"},{"level":2,"text":"Circus Arts","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Sports/Circus%20Arts"},{"level":2,"text":"Fencing","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Sports/Fencing"},{"level":2,"text":"Golf","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Sports/Golf"},{"level":2,"text":"Gymnastics","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Sports/Gymnastics"},{"level":2,"text":"Pickleball","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Sports/Pickleball"},{"level":2,"text":"Tennis","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Sports/Tennis"},{"level":2,"text":"Track & Field","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Sports/Track%20&%20Field"},{"level":2,"text":"Volleyball","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Sports/Volleyball"}],"text":"Sports","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness/Sports"}],"text":"Health & Fitness","href":"http://127.0.0.1:8080/ProgramFinder.html#/Health%20&%20Fitness"},{"level":0,"items":[{"level":1,"text":"Concerts","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Concerts"},{"level":1,"items":[{"level":2,"text":"Competition Teams","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Dance/Competition%20Teams"},{"level":2,"text":"Performance","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Dance/Performance"},{"level":2,"text":"Summer Intensives","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Dance/Summer%20Intensives"},{"level":2,"text":"Tap","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Dance/Tap"},{"level":2,"text":"Musical Theater","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Dance/Musical%20Theater"},{"level":2,"text":"Ballet","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Dance/Ballet"},{"level":2,"text":"Hip-Hop","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Dance/Hip-Hop"},{"level":2,"text":"Isadora for Children","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Dance/Isadora%20for%20Children"},{"level":2,"text":"Jazz","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Dance/Jazz"},{"level":2,"text":"Modern Dance","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Dance/Modern%20Dance"}],"text":"Dance","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Dance"},{"level":1,"items":[{"level":2,"text":"Architecture & Design","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Art%20&%20Design/Architecture%20&%20Design"},{"level":2,"text":"Ceramics","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Art%20&%20Design/Ceramics"},{"level":2,"text":"Fine Arts","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Art%20&%20Design/Fine%20Arts"},{"level":2,"text":"Digital Design","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Art%20&%20Design/Digital%20Design"},{"level":2,"text":"Metalwork & Jewelry","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Art%20&%20Design/Metalwork%20&%20Jewelry"}],"text":"Art & Design","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Art%20&%20Design"},{"level":1,"items":[{"level":2,"text":"Early Childhood Music","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Music/Early%20Childhood%20Music"},{"level":2,"text":"Ensembles","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Music/Ensembles"},{"level":2,"text":"Group Instruction","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Music/Group%20Instruction"},{"level":2,"text":"Music Technology","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Music/Music%20Technology"},{"level":2,"text":"Private Instruction","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Music/Private%20Instruction"},{"level":2,"text":"Theory & Musicianship","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Music/Theory%20&%20Musicianship"},{"level":2,"text":"Chorus","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Music/Chorus"}],"text":"Music","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Music"},{"level":1,"text":"Birthday Parties","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Birthday%20Parties"},{"level":1,"items":[{"level":2,"text":"Art, Music, Dance","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Camps/Art,%20Music,%20Dance"},{"level":2,"text":"Sports","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Camps/Sports"},{"level":2,"text":"Summer Day Camps","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Camps/Summer%20Day%20Camps"},{"level":2,"text":"Teen Travel","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Camps/Teen%20Travel"}],"text":"Camps","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Camps"},{"level":1,"items":[{"level":2,"items":[{"level":3,"text":"Lifeguard Training & Water Safety","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Aquatics/Lifeguard%20Training%20&%20Water%20Safety"},{"level":3,"text":"Group Instruction","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Aquatics/Group%20Instruction"},{"level":3,"text":"Special Needs","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Aquatics/Special%20Needs"},{"level":3,"text":"Private Instruction","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Aquatics/Private%20Instruction"}],"text":"Aquatics","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Aquatics"},{"level":2,"text":"Gymnastics","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Gymnastics"},{"level":2,"items":[{"level":3,"text":"Fitness Classes","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Sports/Fitness%20Classes"},{"level":3,"text":"Certifications","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Sports/Certifications"},{"level":3,"text":"Basketball","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Sports/Basketball"},{"level":3,"text":"Baseball","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Sports/Baseball"},{"level":3,"text":"Circus Arts","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Sports/Circus%20Arts"},{"level":3,"text":"Tennis","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Sports/Tennis"},{"level":3,"text":"Fencing","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Sports/Fencing"},{"level":3,"text":"Track & Field","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Sports/Track%20&%20Field"},{"level":3,"text":"Sports Programs","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Sports/Sports%20Programs"},{"level":3,"text":"Yoga","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Sports/Yoga"}],"text":"Sports","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim/Sports"}],"text":"Sports, Gymnastics & Swim","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sports,%20Gymnastics%20&%20Swim"},{"level":1,"text":"Afterschool","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Afterschool"},{"level":1,"text":"Concerts & Performances","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Concerts%20&%20Performances"},{"level":1,"items":[{"level":2,"text":"After-School","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Jewish%20Family%20Experiences/After-School"},{"level":2,"text":"Education","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Jewish%20Family%20Experiences/Education"},{"level":2,"text":"Family Shabbat","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Jewish%20Family%20Experiences/Family%20Shabbat"},{"level":2,"text":"Programs in Hebrew","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Jewish%20Family%20Experiences/Programs%20in%20Hebrew"}],"text":"Jewish Family Experiences","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Jewish%20Family%20Experiences"},{"level":1,"items":[{"level":2,"text":"YA Lit","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Literary/YA%20Lit"}],"text":"Literary","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Literary"},{"level":1,"text":"Nursery School","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Nursery%20School"},{"level":1,"items":[{"level":2,"text":"Yearlong Programs","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Parenting/Yearlong%20Programs"},{"level":2,"text":"Drop-In Activities","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Parenting/Drop-In%20Activities"},{"level":2,"text":"For Parents Only","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Parenting/For%20Parents%20Only"},{"level":2,"text":"Babies (0-13 months)","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Parenting/Babies%20(0-13%20months)"},{"level":2,"text":"Parenting Talks","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Parenting/Parenting%20Talks"},{"level":2,"text":"Parents to be/New Parents","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Parenting/Parents%20to%20be/New%20Parents"},{"level":2,"text":"Toddlers (13 mos-4 years)","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Parenting/Toddlers%20(13%20mos-4%20years)"}],"text":"Parenting","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Parenting"},{"level":1,"text":"Sunday Science Spectaculars","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family/Sunday%20Science%20Spectaculars"}],"text":"Kids & Family","href":"http://127.0.0.1:8080/ProgramFinder.html#/Kids%20&%20Family"},{"level":0,"items":[{"level":1,"items":[{"level":2,"text":"Literary Seminars","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Literature/Literary%20Seminars"}],"text":"Literature","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Literature"},{"level":1,"items":[{"level":2,"text":"Books and Bagels","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Readings%20&%20Events/Books%20and%20Bagels"},{"level":2,"text":"Main Reading Series","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Readings%20&%20Events/Main%20Reading%20Series"},{"level":2,"text":"National Poetry Month Series","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Readings%20&%20Events/National%20Poetry%20Month%20Series"},{"level":2,"text":"YA Lit","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Readings%20&%20Events/YA%20Lit"}],"text":"Readings & Events","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Readings%20&%20Events"},{"level":1,"items":[{"level":2,"text":"Open Enrollment ","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Creative%20Writing%20&%20Literature/Open%20Enrollment%20"},{"level":2,"text":"Book Talk","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Creative%20Writing%20&%20Literature/Book%20Talk"},{"level":2,"text":"Creative Writing at 92Y","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Creative%20Writing%20&%20Literature/Creative%20Writing%20at%2092Y"},{"level":2,"text":"Advanced Workshops","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Creative%20Writing%20&%20Literature/Advanced%20Workshops"},{"level":2,"text":"Master Classes","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Creative%20Writing%20&%20Literature/Master%20Classes"},{"level":2,"text":"Literary Seminars","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Creative%20Writing%20&%20Literature/Literary%20Seminars"},{"level":2,"text":"Shakespeare with Bob Smith","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Creative%20Writing%20&%20Literature/Shakespeare%20with%20Bob%20Smith"},{"level":2,"text":"Unterberg Poetry Center Writing Program","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Creative%20Writing%20&%20Literature/Unterberg%20Poetry%20Center%20Writing%20Program"}],"text":"Creative Writing & Literature","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary/Creative%20Writing%20&%20Literature"}],"text":"Literary","href":"http://127.0.0.1:8080/ProgramFinder.html#/Literary"},{"level":0,"items":[{"level":1,"items":[{"level":2,"text":"Art After Hours","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Ceramics/Art%20After%20Hours"},{"level":2,"text":"Technique Specific","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Ceramics/Technique%20Specific"},{"level":2,"items":[{"level":3,"text":"Beginner","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Ceramics/Handbuilding%20&%20Wheel/Beginner"},{"level":3,"text":"Beginner/Intermediate","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Ceramics/Handbuilding%20&%20Wheel/Beginner/Intermediate"},{"level":3,"text":"Intermediate/Advanced","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Ceramics/Handbuilding%20&%20Wheel/Intermediate/Advanced"},{"level":3,"text":"Wheel","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Ceramics/Handbuilding%20&%20Wheel/Wheel"}],"text":"Handbuilding & Wheel","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Ceramics/Handbuilding%20&%20Wheel"},{"level":2,"text":"Independent Study","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Ceramics/Independent%20Study"},{"level":2,"text":"Virtual Clay","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Ceramics/Virtual%20Clay"},{"level":2,"text":"Workshops","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Ceramics/Workshops"}],"text":"Ceramics","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Ceramics"},{"level":1,"items":[{"level":2,"text":"For Professionals","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/For%20Professionals"},{"level":2,"items":[{"level":3,"text":"Dance Parties","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Performances%20&%20Events/Dance%20Parties"},{"level":3,"text":"Dig Dance Weekend Series","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Performances%20&%20Events/Dig%20Dance%20Weekend%20Series"},{"level":3,"text":"Fridays at Noon","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Performances%20&%20Events/Fridays%20at%20Noon"},{"level":3,"text":"Harkness Dance Festival","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Performances%20&%20Events/Harkness%20Dance%20Festival"},{"level":3,"text":"Special Dance Events","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Performances%20&%20Events/Special%20Dance%20Events"},{"level":3,"text":"Student Performances","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Performances%20&%20Events/Student%20Performances"}],"text":"Performances & Events","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Performances%20&%20Events"},{"level":2,"items":[{"level":3,"text":" Afro-Caribbean","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/%20Afro-Caribbean"},{"level":3,"text":"Dance Education Laboratory (DEL)","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Dance%20Education%20Laboratory%20(DEL)"},{"level":3,"text":"Alexander Technique","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Alexander%20Technique"},{"level":3,"text":"Dance Therapy","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Dance%20Therapy"},{"level":3,"text":"Ballet","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Ballet"},{"level":3,"text":"Ballroom","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Ballroom"},{"level":3,"text":"Dance For Life","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Dance%20For%20Life"},{"level":3,"text":"Flamenco","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Flamenco"},{"level":3,"text":"Hip-Hop","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Hip-Hop"},{"level":3,"text":"Hula","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Hula"},{"level":3,"text":"Isadora Duncan","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Isadora%20Duncan"},{"level":3,"text":"Israeli Folk Dance","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Israeli%20Folk%20Dance"},{"level":3,"text":"Jazz","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Jazz"},{"level":3,"text":"Master Classes","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Master%20Classes"},{"level":3,"text":"Middle Eastern Dance","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Middle%20Eastern%20Dance"},{"level":3,"text":"Modern Dance","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Modern%20Dance"},{"level":3,"text":"Musical Theater","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Musical%20Theater"},{"level":3,"text":"Salsa","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Salsa"},{"level":3,"text":"Social Dance","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Social%20Dance"},{"level":3,"text":"Swing Dance","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Swing%20Dance"},{"level":3,"text":"Tap","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes/Tap"}],"text":"Classes","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance/Classes"}],"text":"Dance","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Dance"},{"level":1,"items":[{"level":2,"items":[{"level":3,"text":"Walking Tours","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Art%20Appreciation/Walking%20Tours"}],"text":"Art Appreciation","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Art%20Appreciation"},{"level":2,"text":"Gallery Tours","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Gallery%20Tours"},{"level":2,"text":"Art Travel","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Art%20Travel"},{"level":2,"text":"Design & Digital Art","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Design%20&%20Digital%20Art"},{"level":2,"items":[{"level":3,"text":"Visiting Artists","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Book%20&%20Paper%20Arts/Visiting%20Artists"}],"text":"Book & Paper Arts","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Book%20&%20Paper%20Arts"},{"level":2,"text":"Cartooning & Illustration","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Cartooning%20&%20Illustration"},{"level":2,"items":[{"level":3,"text":"Visiting Artists","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Collage%20&%20Mixed%20Media/Visiting%20Artists"}],"text":"Collage & Mixed Media","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Collage%20&%20Mixed%20Media"},{"level":2,"text":"Digital Photography & Video","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Digital%20Photography%20&%20Video"},{"level":2,"items":[{"level":3,"text":"Beginner","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Drawing/Beginner"},{"level":3,"text":"Figure & Portrait Drawing","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Drawing/Figure%20&%20Portrait%20Drawing"},{"level":3,"text":"Intermediate & Technique Specific","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Drawing/Intermediate%20&%20Technique%20Specific"},{"level":3,"text":"Workshops","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Drawing/Workshops"}],"text":"Drawing","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Drawing"},{"level":2,"items":[{"level":3,"items":[{"level":4,"text":"Beginner","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Painting/Oil%20&%20Acrylic/Beginner"},{"level":4,"text":"Figure and Portrait Oil Painting","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Painting/Oil%20&%20Acrylic/Figure%20and%20Portrait%20Oil%20Painting"},{"level":4,"text":"Intermediate, Advanced & Technique Specific","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Painting/Oil%20&%20Acrylic/Intermediate,%20Advanced%20&%20Technique%20Specific"},{"level":4,"text":"Workshops","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Painting/Oil%20&%20Acrylic/Workshops"}],"text":"Oil & Acrylic","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Painting/Oil%20&%20Acrylic"},{"level":3,"items":[{"level":4,"text":"Beginner","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Painting/Watercolor/Beginner"},{"level":4,"text":"Intermediate/Advanced","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Painting/Watercolor/Intermediate/Advanced"},{"level":4,"text":"Workshops","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Painting/Watercolor/Workshops"}],"text":"Watercolor","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Painting/Watercolor"}],"text":"Painting","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Painting"},{"level":2,"text":"Portfolio Preparation","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Portfolio%20Preparation"},{"level":2,"text":"Printmaking","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Printmaking"},{"level":2,"text":"Professional Development","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Professional%20Development"},{"level":2,"text":"Art Talks","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Art%20Talks"},{"level":2,"text":"Textiles","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design/Textiles"}],"text":"Fine Art & Design","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Fine%20Art%20&%20Design"},{"level":1,"items":[{"level":2,"text":"Art After Hours","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/Art%20After%20Hours"},{"level":2,"items":[{"level":3,"text":"Advanced Jewelry","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/General%20Technique/Advanced%20Jewelry"},{"level":3,"text":"Jewelry III / Intermediate","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/General%20Technique/Jewelry%20III%20/%20Intermediate"},{"level":3,"text":"Jewelry I / Beginner","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/General%20Technique/Jewelry%20I%20/%20Beginner"},{"level":3,"text":"Jewelry II & III - Basic/Intermediate","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/General%20Technique/Jewelry%20II%20&%20III%20-%20Basic/Intermediate"},{"level":3,"text":"Jewelry Fabrication","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/General%20Technique/Jewelry%20Fabrication"}],"text":"General Technique","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/General%20Technique"},{"level":2,"text":"Independent Study","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/Independent%20Study"},{"level":2,"text":"Talks & Tours","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/Talks%20&%20Tours"},{"level":2,"items":[{"level":3,"text":"Wax Carving","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/Technique%20Specific/Wax%20Carving"},{"level":3,"text":"Enameling","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/Technique%20Specific/Enameling"},{"level":3,"text":"Stonesetting","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/Technique%20Specific/Stonesetting"},{"level":3,"text":"Silversmithing","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/Technique%20Specific/Silversmithing"},{"level":3,"text":"Precious Metal Clay","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/Technique%20Specific/Precious%20Metal%20Clay"},{"level":3,"text":"Goldsmithing","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/Technique%20Specific/Goldsmithing"},{"level":3,"text":"Beading","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/Technique%20Specific/Beading"}],"text":"Technique Specific","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/Technique%20Specific"},{"level":2,"text":"Visiting Artists","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/Visiting%20Artists"},{"level":2,"text":"Workshops","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry/Workshops"}],"text":"Jewelry","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Jewelry"},{"level":1,"items":[{"level":2,"text":"Broadway at 92Y","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Broadway%20at%2092Y"},{"level":2,"items":[{"level":3,"text":"Faculty Concerts","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Concerts%20&%20Recitals/Faculty%20Concerts"},{"level":3,"text":"School Concerts","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Concerts%20&%20Recitals/School%20Concerts"}],"text":"Concerts & Recitals","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Concerts%20&%20Recitals"},{"level":2,"text":"Early Childhood Music ","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Early%20Childhood%20Music%20"},{"level":2,"text":"Group Instruction","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Group%20Instruction"},{"level":2,"text":"Jazz Studies","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Jazz%20Studies"},{"level":2,"items":[{"level":3,"text":"Music with Louis Rosen","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Music%20Appreciation/Music%20with%20Louis%20Rosen"}],"text":"Music Appreciation","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Music%20Appreciation"},{"level":2,"text":"Music Ensembles","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Music%20Ensembles"},{"level":2,"text":"Music Technology","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Music%20Technology"},{"level":2,"items":[{"level":3,"text":"Theory with Louis Rosen","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Music%20Theory/Theory%20with%20Louis%20Rosen"}],"text":"Music Theory","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Music%20Theory"},{"level":2,"text":"Presto Music: Fast, Fun Classes","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Presto%20Music:%20Fast,%20Fun%20Classes"},{"level":2,"text":"Private Instruction","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Private%20Instruction"},{"level":2,"text":"Vocal","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music/Vocal"}],"text":"Music","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance/Music"}],"text":"School of Art, Music, Dance","href":"http://127.0.0.1:8080/ProgramFinder.html#/School%20of%20Art,%20Music,%20Dance"},{"level":0,"items":[{"level":1,"text":"7 Days of Genius ","href":"http://127.0.0.1:8080/ProgramFinder.html#/Special%20Events/7%20Days%20of%20Genius%20"}],"text":"Special Events","href":"http://127.0.0.1:8080/ProgramFinder.html#/Special%20Events"},{"level":0,"items":[{"level":1,"items":[{"level":2,"text":"Entertainment","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Arts%20&%20Culture/Entertainment"},{"level":2,"items":[{"level":3,"text":"Funny People","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Arts%20&%20Culture/Comedy/Funny%20People"}],"text":"Comedy","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Arts%20&%20Culture/Comedy"},{"level":2,"text":"Dance","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Arts%20&%20Culture/Dance"},{"level":2,"text":"Theater","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Arts%20&%20Culture/Theater"},{"level":2,"text":"Art ","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Arts%20&%20Culture/Art%20"},{"level":2,"items":[{"level":3,"text":"Fashion Icons with Fern Mallis","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Arts%20&%20Culture/Fashion/Fashion%20Icons%20with%20Fern%20Mallis"}],"text":"Fashion","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Arts%20&%20Culture/Fashion"},{"level":2,"items":[{"level":3,"text":"Reel Pieces","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Arts%20&%20Culture/Film/Reel%20Pieces"}],"text":"Film","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Arts%20&%20Culture/Film"},{"level":2,"text":"Music","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Arts%20&%20Culture/Music"}],"text":"Arts & Culture","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Arts%20&%20Culture"},{"level":1,"items":[{"level":2,"text":"Money & Investments","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Business%20&%20Leadership/Money%20&%20Investments"}],"text":"Business & Leadership","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Business%20&%20Leadership"},{"level":1,"items":[{"level":2,"text":"Psychobiography with Dr. Gail Saltz","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks/Psychobiography%20with%20Dr.%20Gail%20Saltz"},{"level":2,"text":"Art & Culture","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks/Art%20&%20Culture"},{"level":2,"text":"Entertainment","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks/Entertainment"},{"level":2,"items":[{"level":3,"text":"Public Policy and History with the Brookings Institute","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks/History,%20Politics%20&%20Current%20Events/Public%20Policy%20and%20History%20with%20the%20Brookings%20Institute"}],"text":"History, Politics & Current Events","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks/History,%20Politics%20&%20Current%20Events"},{"level":2,"items":[{"level":3,"text":"Everett Institute","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks/Jewish%20Interest/Everett%20Institute"},{"level":3,"text":"Museum of Jewish Heritage","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks/Jewish%20Interest/Museum%20of%20Jewish%20Heritage"}],"text":"Jewish Interest","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks/Jewish%20Interest"},{"level":2,"text":"Life & Style","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks/Life%20&%20Style"},{"level":2,"items":[{"level":3,"text":"Behind the Music with Louis Rosen","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks/Music/Behind%20the%20Music%20with%20Louis%20Rosen"},{"level":3,"text":"Songs and Stories","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks/Music/Songs%20and%20Stories"}],"text":"Music","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks/Music"},{"level":2,"text":"Science & Technology","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks/Science%20&%20Technology"},{"level":2,"text":"Understanding Our World","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks/Understanding%20Our%20World"}],"text":"Daytime Talks","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Daytime%20Talks"},{"level":1,"text":"History","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/History"},{"level":1,"items":[{"level":2,"text":"Jewish History & Culture","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Jewish%20Interest/Jewish%20History%20&%20Culture"},{"level":2,"text":"The Future of Faith","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Jewish%20Interest/The%20Future%20of%20Faith"}],"text":"Jewish Interest","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Jewish%20Interest"},{"level":1,"items":[{"level":2,"items":[{"level":3,"text":"Food Talks with Kitchen Arts & Letters","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Life%20&%20Style/Food%20&%20Wine/Food%20Talks%20with%20Kitchen%20Arts%20&%20Letters"}],"text":"Food & Wine","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Life%20&%20Style/Food%20&%20Wine"},{"level":2,"text":"Health","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Life%20&%20Style/Health"},{"level":2,"text":"Parenting","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Life%20&%20Style/Parenting"},{"level":2,"text":"Style","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Life%20&%20Style/Style"},{"level":2,"text":"Local NYC","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Life%20&%20Style/Local%20NYC"},{"level":2,"text":"Self-Help","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Life%20&%20Style/Self-Help"},{"level":2,"text":"Travel","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Life%20&%20Style/Travel"}],"text":"Life & Style","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Life%20&%20Style"},{"level":1,"items":[{"level":2,"text":"Books and Bagels","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Readings/Books%20and%20Bagels"},{"level":2,"text":"Main Reading Series","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Readings/Main%20Reading%20Series"},{"level":2,"text":"National Poetry Month","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Readings/National%20Poetry%20Month"}],"text":"Readings","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Readings"},{"level":1,"text":"Philosophy & Religion","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Philosophy%20&%20Religion"},{"level":1,"items":[{"level":2,"text":"American Conversation","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Politics%20&%20Current%20Events/American%20Conversation"},{"level":2,"text":"Behind the Headlines","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Politics%20&%20Current%20Events/Behind%20the%20Headlines"},{"level":2,"text":"Economics","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Politics%20&%20Current%20Events/Economics"},{"level":2,"text":"In the News with Jeff Greenfield","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Politics%20&%20Current%20Events/In%20the%20News%20with%20Jeff%20Greenfield"},{"level":2,"text":"Trials & Error With Thane Rosenbaum","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Politics%20&%20Current%20Events/Trials%20&%20Error%20With%20Thane%20Rosenbaum"},{"level":2,"text":"World Politics with Ralph Buuljens","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Politics%20&%20Current%20Events/World%20Politics%20with%20Ralph%20Buuljens"}],"text":"Politics & Current Events","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Politics%20&%20Current%20Events"},{"level":1,"text":"Science & Technology","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings/Science%20&%20Technology"}],"text":"Talks & Readings","href":"http://127.0.0.1:8080/ProgramFinder.html#/Talks%20&%20Readings"}];

        $scope.$watch(function () {
            return self.allClasses;
        }, function (allClasses) {
            if (allClasses.length > 1) {
                // var str = JSON.stringify(self.buildMenuItems(allClasses));
                // console.log(str);
                //$scope.mainMenuItems = self.buildMenuItems(allClasses);
            }
        });

        $scope.$watch(function () {
            return self.location.path();
        }, function (locationPath) {
            if (INITIALIZING) {
                $timeout(function () { INITIALIZING = false; });
                self.progressbar.set(self.progressbar.status() + 4);
            } else {
                var locationObj = seperateSlicersFromUrl(locationPath);
                locationPath = locationObj.path;
                var locationRemoved = locationObj.removed;
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
                            for (var x = 0; x < numOfSlashesLastLocation - numOfSlashesLocation; x++) {
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
                            for (var x = self.activeBreadcrumb.length - 1; x >= 0; x--) {
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
                        if (self.activeBreadcrumb.length === 0) {
                            //if this is undefined then we are probably doing a global search from the start so need to build up the breadcrumb
                            self.activeBreadcrumb.push(_.clone(self.arrCategory[0][0]));
                        }
                        break;
                    default:
                        if (locationRemoved.indexOf('search__') >= 0) {
                            var locRemSplit = locationRemoved.split('/');
                            var locRemFilter = _.find(locRemSplit, function (ar) {
                                return ar.indexOf('search__') >= 0;
                            });
                            self.searchTerm = locRemFilter.substring(locRemFilter.indexOf('search__') + 8);
                        } else {
                            self.searchTerm = '';
                        }
                        // if browser back and forward buttons or global search used for unpredictable jumps
                        var subfolders;
                        if ((self.arrCategory.length === 0 || self.arrCategory[0].length === 0) && numOfSlashesLocation > 0) {
                            subfolders = locationPath.substring(1).split('/');
                            self.fetchResults(subfolders[0], false, navConfig);
                        } else {
                            subfolders = locationPath.substring(1).split('/');
                            var rootFolder = subfolders[0];
                            //if logo clicked to reset let's just skip this
                            if (rootFolder.length > 0) {
                                //if the url's root folder doesn't match the last recorded folder from the url, let's build it up from scratch
                                var currentRootFolder = self.arrCategory[0][0].Name;
                                if (currentRootFolder !== rootFolder) {
                                    self.fetchResults(rootFolder, true, navConfig);
                                }
                            }
                        }
                        self.buildCurrentObj();
                        break;
                }
                self.displayTiles();
                self.lastLocationPath = locationPath + locationRemoved;
                self.JumpNav = {};
                self.limit = self.origLimit;
                self.affixed = false;
                self.showNoGlobalResults = false;
                self.progressbar.set(self.progressbar.status() + 4);
                $timeout(function () {
                    self.progressbar.complete();
                }, 100);
            }
        });
    };

    NavListController.prototype.buildMenuItems = function (nodes, storeLevels, level, tmp) {
        var self = this;
        var gottenLevels = storeLevels || [];
        var curLevel = level || 0;
        for (var property in nodes) {
            if (typeof nodes[property] === "object") {
                if (!Array.isArray(nodes[property])) {
                    tmp = { level: curLevel };
                    var lastObject = gottenLevels[gottenLevels.length - 1];
                    if (typeof lastObject === 'undefined' || lastObject.level === curLevel) {
                        gottenLevels.push(tmp);
                    } else {
                        var stop = false;
                        while (!stop) {
                            if ((lastObject.level + 1) < curLevel) {
                                lastObject = lastObject.items[lastObject.items.length - 1];
                            } else {
                                stop = true;
                            }
                        }
                        if (typeof lastObject.items === 'undefined') {
                            lastObject.items = [];
                        }
                        lastObject.items.push(tmp);
                    }
                } else {
                    curLevel++;
                }
                self.buildMenuItems(nodes[property], gottenLevels, curLevel, tmp);
                if (Array.isArray(nodes[property])) {
                    --curLevel;
                }
            } else {
                if (property === 'Name') {
                    tmp.text = nodes[property];
                }
                if (property === 'NodeID') {
                    var nodeid = nodes[property];
                    var builtUrl = self.buildUrlFromFetch(self.allClasses, nodeid);
                    tmp.href = builtUrl;
                }
            }
        }
        return gottenLevels;
    };

    NavListController.prototype.buildUrlFromFetch = function (nodes, id) {
        var self = this;
        var absUrl = self.location.absUrl().toLowerCase();
        var baseUrl = absUrl.substring(0, absUrl.indexOf(SCRIPTNAME.toLowerCase())) + SCRIPTNAME;
        var resultArray = [];

        function traverse(value) {
            var result;
            if (value.hasOwnProperty('NodeID') && value.NodeID === id) {
                result = value;
            } else {
                _.forEach(value, function (val) {
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
        var stop = false;
        while (!stop) {
            var returnedResult = traverse(nodes);
            resultArray.push(returnedResult.Name);
            if (returnedResult.NodeLevel <= 2) {
                stop = true;
            }
            id = returnedResult.ParentNodeID;
        }
        var finalUrl = baseUrl + '#';
        _.forEachRight(resultArray, function (val) {
            finalUrl += '/' + val;
        });
        return encodeURI(finalUrl);
    };

    NavListController.prototype.fetchResults = function (interest, adjustArr, navConfig) {
        var self = this;
        if (_.isUndefined(self.navsDict[interest])) {
            self.isFetching = true;
            self.tileInfoSrv.getAll('/webservices/categoryproduction.svc/FilterNodes/' + navConfig.FilterNodeNum + '/', self.navCache, 'navigation').then(function (data) {
                self.getInterestItems(self.getAllInitialClasses, data);
            }, function (respData) {
                if (!self.allClasses.length || (self.allClasses.length && self.allClasses[0].Name === '')) {
                    self.allClasses = [{ Name: 'Error loading data.  Click to refresh.', NodeID: ERRORLOADINGNODEID}];
                }
            });
        }
        if (adjustArr) {
            adjustLevelArray(self.arrCategory, 0, self.arrCategory.length, true);
        }
        var classIndex = _.findIndex(self.allClasses, { 'Name': interest });
        var classesByInterest = [self.allClasses[classIndex]];
        self.getValues(classesByInterest, 0, self.navsDict[interest]);
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
                            kwStringArr.push(kw.Level + ':  ' + kw.Keywords);
                        });
                        var levelAndKeywords = kwStringArr.toString();
                        var uniqid = n.ProductionNumber === 0 ? n.PackageNo : n.ProductionNumber;
                        var prodNo = n.ProductionNumber;
                        var packageNo = n.PackageNo;
                        var foundArr = _.find(kwArr, { 'uniqid': uniqid });
                        if (_.isUndefined(foundArr)) {
                            var kws = '';
                            _.forEach(keywords, function (kw, ind) {
                                kws += kw.Keywords;
                                if (ind + 1 < keywords.length) {
                                    kws += ',';
                                }
                            });
                            kwArr.push({ uniqid: uniqid, prodid: prodNo, packid: packageNo, name: n.Title, keywords: kws, kws_0: levelAndKeywords });
                        } else {
                            var foundKeywords = foundArr.keywords;
                            var kws = '';
                            _.forEach(keywords, function (kw, ind) {
                                kws += kw.Keywords;
                                if (ind + 1 < keywords.length) {
                                    kws += ',';
                                }
                            });
                            var keywordArr = (kws + ',' + foundKeywords).split(',');
                            var kwUniq = _.uniq(keywordArr).toString();
                            foundArr.keywords = kwUniq;
                            for (var x = 1; x <= 10; x++) {
                                if (_.isUndefined(foundArr['kws_' + x])) {
                                    foundArr['kws_' + x] = levelAndKeywords;
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
            return _.filter(self.arrCategory[level + 1], { 'Parent': nodeid });

        } else {
            return;
        }
    };

    NavListController.prototype.chunkSublevels = function () {
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
            var classesByInterest = [_.find(self.allClasses, { 'Name': interestFolder })];
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

        var classIndex = _.findIndex(self.allClasses, { 'Name': currentName });
        var classesByInterest = [self.allClasses[classIndex]];
        self.getValues(classesByInterest, 0, self.navsDict[currentName]);
        if (printNow) {
            self.printStatus = 'Printing ' + self.printNum + ' of ' + self.allClasses.length + ' reports';
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
        var currentSearch = subLevel.SearchTerm;
        var currentId = subLevel.NodeID;
        if (!_.isUndefined(self.currentObj) && currentName === self.currentObj.Name && currentId === self.currentObj.NodeID || (_.isUndefined(self.currentObj) && currentId === LOADINGNODEID)) {
            return;
        }
        if (_.isUndefined(self.currentObj) && currentId === ERRORLOADINGNODEID) {
            self.navCache.removeAll();
            location.reload();
        }
        adjustLevelArray(self.arrCategory, 0, self.arrCategory.length, true);

        var classIndex = _.findIndex(self.allClasses, { 'Name': currentName });
        var classesByInterest = [self.allClasses[classIndex]];
        self.getValues(classesByInterest, 0, self.navsDict[currentName]);

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
        self.currentObj.NodeID = currentId;
        self.currentObj.Current = true;
        self.currentObj.FeaturedItemsHeader = '';
        if (_.isUndefined(currentSearch)) {
            self.JumpNav = { To: currentName, Type: 'linkTo' };
        } else {
            self.JumpNav = { To: currentName, Type: 'sliceBy' };
        }
        self.setUrl(currentName, 'replace', 0, currentSearch);
    };

    NavListController.prototype.displayMicroSites = function (currentUrl) {
        var self = this;
        if (currentUrl.indexOf('School Of The Arts') >= 0) {
            if (_.isUndefined(self.microsites) || self.microsites.length === 0) {
                self.microsites = _.clone(MICROSITELIST);
                if (currentUrl.indexOf('/Dance') >= 0) {
                    _.pull(self.microsites,
                        _.find(self.microsites, { 'id': 'fineart' }),
                        _.find(self.microsites, { 'id': 'ceramics' }),
                        _.find(self.microsites, { 'id': 'jewelry' }),
                        _.find(self.microsites, { 'id': 'music' }),
                        _.find(self.microsites, { 'id': 'instruct' })
                    );
                }
                if (currentUrl.indexOf('/Fine Art & Design') >= 0) {
                    _.pull(self.microsites,
                        _.find(self.microsites, { 'id': 'dance' }),
                        _.find(self.microsites, { 'id': 'ceramics' }),
                        _.find(self.microsites, { 'id': 'jewelry' }),
                        _.find(self.microsites, { 'id': 'music' }),
                        _.find(self.microsites, { 'id': 'instruct' })
                    );
                }
                if (currentUrl.indexOf('/Ceramics') >= 0) {
                    _.pull(self.microsites,
                        _.find(self.microsites, { 'id': 'fineart' }),
                        _.find(self.microsites, { 'id': 'dance' }),
                        _.find(self.microsites, { 'id': 'jewelry' }),
                        _.find(self.microsites, { 'id': 'music' }),
                        _.find(self.microsites, { 'id': 'instruct' })
                    );
                }
                if (currentUrl.indexOf('/Music') >= 0) {
                    _.pull(self.microsites,
                        _.find(self.microsites, { 'id': 'fineart' }),
                        _.find(self.microsites, { 'id': 'dance' }),
                        _.find(self.microsites, { 'id': 'jewelry' }),
                        _.find(self.microsites, { 'id': 'ceramics' })
                    );
                }
                if (currentUrl.indexOf('/Jewelry') >= 0) {
                    _.pull(self.microsites,
                        _.find(self.microsites, { 'id': 'fineart' }),
                        _.find(self.microsites, { 'id': 'dance' }),
                        _.find(self.microsites, { 'id': 'ceramics' }),
                        _.find(self.microsites, { 'id': 'music' }),
                        _.find(self.microsites, { 'id': 'instruct' })
                    );
                }
            } else {
                var subFolderPresent = false;
                if (currentUrl.indexOf('/Dance') >= 0) {
                    subFolderPresent = true;
                    var fineart = _.find(self.microsites, { 'id': 'fineart' });
                    if (_.isObject(fineart)) {
                        _.pull(self.microsites, fineart);
                    }
                    var ceramics = _.find(self.microsites, { 'id': 'ceramics' });
                    if (_.isObject(ceramics)) {
                        _.pull(self.microsites, ceramics);
                    }
                    var jewelry = _.find(self.microsites, { 'id': 'jewelry' });
                    if (_.isObject(jewelry)) {
                        _.pull(self.microsites, jewelry);
                    }
                    var music = _.find(self.microsites, { 'id': 'music' });
                    if (_.isObject(music)) {
                        _.pull(self.microsites, music);
                    }
                    var instruct = _.find(self.microsites, { 'id': 'instruct' });
                    if (_.isObject(instruct)) {
                        _.pull(self.microsites, instruct);
                    }
                }
                if (currentUrl.indexOf('/Fine Art & Design') >= 0) {
                    subFolderPresent = true;
                    var dance = _.find(self.microsites, { 'id': 'dance' });
                    if (_.isObject(dance)) {
                        _.pull(self.microsites, dance);
                    }
                    var ceramics = _.find(self.microsites, { 'id': 'ceramics' });
                    if (_.isObject(ceramics)) {
                        _.pull(self.microsites, ceramics);
                    }
                    var jewelry = _.find(self.microsites, { 'id': 'jewelry' });
                    if (_.isObject(jewelry)) {
                        _.pull(self.microsites, jewelry);
                    }
                    var music = _.find(self.microsites, { 'id': 'music' });
                    if (_.isObject(music)) {
                        _.pull(self.microsites, music);
                    }
                    var instruct = _.find(self.microsites, { 'id': 'instruct' });
                    if (_.isObject(instruct)) {
                        _.pull(self.microsites, instruct);
                    }
                }
                if (currentUrl.indexOf('/Ceramics') >= 0) {
                    subFolderPresent = true;
                    var fineart = _.find(self.microsites, { 'id': 'fineart' });
                    if (_.isObject(fineart)) {
                        _.pull(self.microsites, fineart);
                    }
                    var dance = _.find(self.microsites, { 'id': 'dance' });
                    if (_.isObject(dance)) {
                        _.pull(self.microsites, dance);
                    }
                    var jewelry = _.find(self.microsites, { 'id': 'jewelry' });
                    if (_.isObject(jewelry)) {
                        _.pull(self.microsites, jewelry);
                    }
                    var music = _.find(self.microsites, { 'id': 'music' });
                    if (_.isObject(music)) {
                        _.pull(self.microsites, music);
                    }
                    var instruct = _.find(self.microsites, { 'id': 'instruct' });
                    if (_.isObject(instruct)) {
                        _.pull(self.microsites, instruct);
                    }
                }
                if (currentUrl.indexOf('/Jewelry') >= 0) {
                    subFolderPresent = true;
                    var fineart = _.find(self.microsites, { 'id': 'fineart' });
                    if (_.isObject(fineart)) {
                        _.pull(self.microsites, fineart);
                    }
                    var dance = _.find(self.microsites, { 'id': 'dance' });
                    if (_.isObject(dance)) {
                        _.pull(self.microsites, dance);
                    }
                    var ceramics = _.find(self.microsites, { 'id': 'ceramics' });
                    if (_.isObject(ceramics)) {
                        _.pull(self.microsites, ceramics);
                    }
                    var music = _.find(self.microsites, { 'id': 'music' });
                    if (_.isObject(music)) {
                        _.pull(self.microsites, music);
                    }
                    var instruct = _.find(self.microsites, { 'id': 'instruct' });
                    if (_.isObject(instruct)) {
                        _.pull(self.microsites, instruct);
                    }
                }
                if (currentUrl.indexOf('/Music') >= 0) {
                    subFolderPresent = true;
                    var fineart = _.find(self.microsites, { 'id': 'fineart' });
                    if (_.isObject(fineart)) {
                        _.pull(self.microsites, fineart);
                    }
                    var ceramics = _.find(self.microsites, { 'id': 'ceramics' });
                    if (_.isObject(ceramics)) {
                        _.pull(self.microsites, ceramics);
                    }
                    var jewelry = _.find(self.microsites, { 'id': 'jewelry' });
                    if (_.isObject(jewelry)) {
                        _.pull(self.microsites, jewelry);
                    }
                    var dance = _.find(self.microsites, { 'id': 'dance' });
                    if (_.isObject(dance)) {
                        _.pull(self.microsites, dance);
                    }
                }
                if (!subFolderPresent) {
                    var fineart = _.find(self.microsites, { 'id': 'fineart' });
                    if (_.isUndefined(fineart)) {
                        self.microsites.push(MICROSITEFINEART);
                    }
                    var ceramics = _.find(self.microsites, { 'id': 'ceramics' });
                    if (_.isUndefined(ceramics)) {
                        self.microsites.push(MICROSITECERAMICS);
                    }
                    var jewelry = _.find(self.microsites, { 'id': 'jewelry' });
                    if (_.isUndefined(jewelry)) {
                        self.microsites.push(MICROSITEJEWELRY);
                    }
                    var dance = _.find(self.microsites, { 'id': 'dance' });
                    if (_.isUndefined(dance)) {
                        self.microsites.push(MICROSITEDANCE);
                    }
                    var music = _.find(self.microsites, { 'id': 'music' });
                    if (_.isUndefined(music)) {
                        self.microsites.push(MICROSITEMUSIC);
                    }
                    var instruct = _.find(self.microsites, { 'id': 'instruct' });
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

    NavListController.prototype.updateCheckedGroups = function (chkSlc, chkVal) {
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
        self.searchTerm = self.textboxSearch;
        if (!fromLink) {
            self.debounceSearch.cancel();
            if (self.textboxSearch.length) {
                self.applyScope();
            }
        }
    };

    NavListController.prototype.searchByWord = function () {
        var self = this;
        self.clearSearch(false);
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
            self.fetchSearchResults(self.textboxGlobalSearch, true);
        }
    };

    NavListController.prototype.prepareSearchRedirect = function (slName) {
        var self = this;
        self.navOpened = false;
        if (!_.isUndefined(self.textboxGlobalSearch)) {
            self.searchTerm = self.textboxGlobalSearch;
        }
        //if the search result that the user clicks on is in the same interest area that the user is in
        //then just redirect and do a word search as normal
        if (!_.isUndefined(self.currentObj) && slName === self.currentObj.Name) {
            self.textboxSearch = self.searchTerm;
            self.modifyUrlSearch(true);
            return;
        }
        var subLevel = _.find(self.allClasses, { 'Name': slName });
        subLevel.SearchTerm = self.textboxGlobalSearch;
        self.getInterestItems(self.interestClicked, subLevel);
    };

    NavListController.prototype.clearSearch = function (all) {
        var self = this;
        self.displaySearchResults = [];
        self.showNoGlobalResults = false;
        self.textboxGlobalSearch = '';
        if (all) {
            self.textboxSearch = '';
        }
    };

    NavListController.prototype.fetchSearchResults = function (searchTerm, isGlobal) {
        var self = this;
        self.showNoGlobalResults = false;
        self.displaySearchResults = [];
        if (!_.isUndefined(searchTerm) && searchTerm.length) {
            self.tileInfoSrv.getAll('/webservices/categoryproduction.svc/Search/' + searchTerm + '/', self.navCache, 'globalSearch').then(function (data) {
                var results = data.data;
                if (results.length) {
                    _.forEach(results, function (result) {
                        var interestAreas = _.uniq(result.InterestAreas);
                        var keywords = _.uniq(result.Keywords);
                        var lcKeywords = _.map(keywords, function (kw) {
                            return kw.toLowerCase();
                        });
                        _.forEach(interestAreas, function (interest) {
                            var sublevel = _.find(self.allClasses, function (ac) {
                                return ac.JSONDataURL.toLowerCase().indexOf('/' + interest) > 0;
                            });
                            if (_.isUndefined(sublevel)) {
                                logErrorToServer('JSON for "' + interest + '" not found.');
                            } else {
                                var subLevelName = sublevel.Name;
                                var subLevelKeywords = sublevel.Keywords.toLowerCase();
                                var slkwarr = subLevelKeywords.split(',');
                                if (_.intersection(slkwarr, lcKeywords).length) {
                                    if (!_.isUndefined(sublevel)) {
                                        var foundLevel = _.find(self.allClasses, { 'Name': subLevelName });
                                        var subLevelId = foundLevel.NodeID;
                                        self.tileInfoSrv.getItems(subLevelId, self.allClasses, self.navCache).then(function (items) {
                                            self.navsDict[subLevelName] = items.data;
                                            var absUrl = self.location.absUrl().toLowerCase();
                                            var baseUrl = absUrl.substring(0, absUrl.indexOf(SCRIPTNAME.toLowerCase())) + SCRIPTNAME;
                                            var href = baseUrl + '#/' + subLevelName + '/search__' + searchTerm;
                                            if (_.isUndefined(_.find(self.displaySearchResults, { 'interestArea': subLevelName }))) {
                                                self.displaySearchResults.push({
                                                    searchTerm: searchTerm,
                                                    interestArea: subLevelName,
                                                    href: encodeURI(href)
                                                });
                                                self.showGlobalSpinner = false;
                                                self.showNoGlobalResults = false;
                                            }
                                        });
                                    }
                                } else {
                                    logErrorToServer('Global search "' + searchTerm + '" found results in "' + subLevelName + '" but does not have keywords "' + subLevelKeywords + '" to show up there.');
                                }
                            }
                        });
                    });
                    if (self.showGlobalSpinner) {
                        //search finds no results
                        self.showGlobalSpinner = false;
                        self.showNoGlobalResults = isGlobal;
                    }
                } else {
                    //search finds no results
                    self.showGlobalSpinner = false;
                    self.showNoGlobalResults = isGlobal;
                }
            }, function (reason) {
                //search throws error
                self.showGlobalSpinner = false;
                self.showNoGlobalResults = isGlobal;
            });
        } else {
            self.showGlobalSpinner = false;
            self.showNoGlobalResults = false;
            if (isGlobal) {
                self.debounceGlobalSearch.cancel();
            }
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
                    var foundClass = _.find(onscreenResultsQueue, { 'ProdNo': prodNo });
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
                        var foundClass = _.find(onscreenResultsQueue, { 'ProdNo': prodNo });
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
        try {
            var locationPath = self.location.path();
            self.virtualPageUrl = locationPath;
            var breadcrumbs = self.getBreadcrumbs(false);
            if (breadcrumbs.length) {
                self.virtualPageTitle = (self.getBreadcrumbs(false))[0].Name;
            } else {
                self.virtualPageTitle = (self.getBreadcrumbs(true)).Name;
            }

            //      var lastLocationPath = self.lastLocationPath;
            //      lastLocationPath = seperateSlicersFromUrl(lastLocationPath).path;
            //      var lastLocArr = lastLocationPath.split("/");

            //      var locationParts = seperateSlicersFromUrl(locationPath);
            //      locationPath = locationParts.path;
            //      var locationPathRemoved = locationParts.removed;
            //      var locArr = locationPath.split("/");

            //note:  until we get a proper top-down pattern with the keywords, we can't use this code
            // if (_.difference(locArr, lastLocArr).length === 1) {
            //  if (self.onscreenResults.length) {
            //      _.forEach(_.clone(self.onscreenResults), function (arr) {
            //          var checkPropExists = _.find(onscreenResultsQueue, { 'ProdNo': arr.ProdNo });
            //          if (_.isUndefined(checkPropExists)) {
            //              _.pull(self.onscreenResults, arr);
            //          }
            //      });
            //  } else {
            //      self.onscreenResults = _.clone(onscreenResultsQueue);
            //  }
            // } else {
            self.onscreenResults = _.clone(onscreenResultsQueue);
            // }

            if ((!_.isUndefined(self.sdateSlice) && self.sdateSlice !== self.initSdateSlice) || (!_.isUndefined(self.edateSlice) && self.edateSlice !== self.initEdateSlice)) {
                self.onscreenResults = filterListByDateRange(self.onscreenResults, self.sdateSlice, self.edateSlice);
                self.dateApplyClicked = true;
            } else {
                self.dateApplyClicked = false;
            }

            if ((!_.isUndefined(self.daySlice) && self.daySlice !== self.initDaySlice) || (!_.isUndefined(self.timeSlice) && self.timeSlice !== self.initTimeSlice)) {
                self.onscreenResults = filterListWithFutureDates(self.onscreenResults, self.daySlice, self.timeSlice);
                self.dateApplyClicked = true;
            }

            if (!_.isUndefined(self.typeSlice) && self.typeSlice !== 'all') {
                self.onscreenResults = _.filter(self.onscreenResults, function (res) {
                    return res.ItemType.toLowerCase() === self.typeSlice;
                });
            }
            if (!_.isUndefined(self.ageSlice) && self.ageSlice !== self.initAgeSlice) {
                self.onscreenResults = filterListByKeywords(self.onscreenResults, self.ageSlice);
                self.ageApplyClicked = true;
            } else {
                self.ageApplyClicked = false;
            }
            //self.searchTerm = self.textboxSearch;
            if (self.searchTerm.length === 0) {
                if (_.isUndefined(self.textboxGlobalSearch) || self.textboxGlobalSearch.length === 0) {
                    self.searchTerm = self.textboxSearch;
                } else {
                    self.searchTerm = self.textboxGlobalSearch;
                    self.textboxSearch = self.searchTerm;
                }
            } else {
                self.textboxSearch = self.searchTerm;
            }
            self.onscreenResults = checkListContainsWords(self.onscreenResults, self.searchTerm);
            if (self.onscreenResults.length === 0 && !self.isFetching) {
                self.fetchSearchResults(self.textboxSearch, false);
            }

            // var sortBy;
            // var sortUrlLocation = locationPathRemoved.indexOf(SORTSLICEURL);
            // if (sortUrlLocation < 0) {
            //  sortBy = 'all';
            // } else {
            //  var endSlashLocation = locationPathRemoved.indexOf("/", sortUrlLocation + 1);
            //  if (endSlashLocation < 0) {
            //      endSlashLocation = locationPathRemoved.length;
            //  }
            //  sortBy = locationPathRemoved.substring(sortUrlLocation + 7, endSlashLocation);
            // }
            // switch (sortBy) {
            //  case 'progress':
            //      self.onscreenResults = _.sortByOrder(self.onscreenResults, ['InProgress', 'SortDate1', 'SortDate2'], [false, true, true]);
            //      break;
            //  case 'featured':
            //      self.onscreenResults = _.sortByOrder(self.onscreenResults, ['Featured', 'SortDate1', 'SortDate2'], [false, true, true]);
            //      break;
            //  default:
            //      self.onscreenResults = _.sortByAll(self.onscreenResults, ['SortDate1', 'SortDate2']);
            //      break;
            // }
            // self.sortOrder = sortBy;

            self.onscreenResults = _.sortByOrder(self.onscreenResults, ['Featured', 'SortDate1', 'SortDate2'], [false, true, true]);

            self.showSpinner = false;
            self.initialized = true;
        }
        catch (err) {
            logErrorToServer(err);
        }
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
        try {
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
                                var findAllPossibleParents = _.where(self.arrCategory[index - 1], { 'Name': subfolders[index - 1] });
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
        }
        catch (err) {
            logErrorToServer(err);
        }
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

    NavListController.prototype.setUrl = function (currentId, urlMethod, jumpTo, globalSearch) {
        var self = this;
        var location = self.location;
        var locationPath = location.path();
        var locationObj = seperateSlicersFromUrl(locationPath);
        locationPath = locationObj.path;
        var locationPathRemoved = locationObj.removed;
        if (!_.isUndefined(globalSearch)) {
            locationPathRemoved = '/search__' + globalSearch;
        }
        if (!isActualNumber(currentId)) {
            //protect against any links with a forward-slash, like Beginner/Advanced
            //this is so the slash doesn't get interpreted as another level
            currentId = currentId.replace(/\//g, '%2F');
        }
        var newLocationPath;
        switch (urlMethod) {
            case 'parse':
                var folderPosition = locationPath.indexOf('/' + currentId + '/');
                locationPath = locationPath.substr(0, folderPosition + currentId.length + 1);
                newLocationPath = fixUrl(locationPath + locationPathRemoved);
                break;
            case 'build':
                var newLocation = '';
                for (var x = 1; x <= currentId; x++) {
                    newLocation += ('/' + self.activeBreadcrumb[x].Name);
                }
                newLocationPath = fixUrl(newLocation === '' ? '/' + newLocation : newLocation + locationPathRemoved);
                break;
            case 'replace':
                newLocationPath = fixUrl('/' + currentId + locationPathRemoved);
                break;
            case 'jump':
                var folderSplit = locationPath.split("/");
                var newLocation = '';
                for (var x = 0; x <= jumpTo; x++) {
                    newLocation += ('/' + folderSplit[x]);
                }
                newLocationPath = fixUrl(newLocation + '/' + currentId + locationPathRemoved);
                break;
            default:
                if (locationPath === '/') {
                    locationPath = '';
                }
                newLocationPath = fixUrl(locationPath + '/' + currentId + locationPathRemoved);
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
            //prevents repopulating the nav from global search jump
            if (!_.some(self.arrCategory[level], tempArr[0])) {
                self.arrCategory[level] = self.arrCategory[level].concat(tempArr);
            }
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
                var textVal = (index >= 4 && index <= 5) ? formatDateOutput(new Date(Number(sliceValues)), true) : formatCommaString(sliceValues.toString());
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
            self.cookieStore.put('savedSearches', self.savedSearches);
        }
    };

    NavListController.prototype.saveProgram = function (title, img, url, target) {
        var self = this;
        var savedProgram = {
            Url: url,
            UrlTarget: target,
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
            self.cookieStore.put('savedPrograms', self.savedPrograms);
        }
    };

    NavListController.prototype.deleteSaved = function (index, savedItems, type) {
        var self = this;
        savedItems.splice(index, 1);
        self.cookieStore.put(type, savedItems);
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
                break;
            case 'datetimeage':
                sliceUrl = [DAYSLICEURL, TIMESLICEURL, SDATESLICEURL, EDATESLICEURL, AGESLICEURL];
                sliceArr = [self.daySlice, self.timeSlice, Date.parse(self.sdateSlice), Date.parse(self.edateSlice), self.ageSlice];
                break;
            case 'datetimeagetypesearch':
                sliceUrl = [DAYSLICEURL, TIMESLICEURL, SDATESLICEURL, EDATESLICEURL, AGESLICEURL, TYPESLICEURL, SEARCHSLICEURL];
                sliceArr = [self.daySlice, self.timeSlice, Date.parse(self.sdateSlice), Date.parse(self.edateSlice), self.ageSlice, self.typeSlice, self.textboxSearch];
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
            self.origDaySlice = _.clone(self.daySlice);
            self.origTimeSlice = _.clone(self.timeSlice);
            self.origSdateSlice = self.sdateSlice;
            self.origEdateSlice = self.edateSlice;
            self.opened.dayOrTime = true;
            self.dateClearClicked = false;
        } else {
            //if popup closes and apply not clicked then it resets
            if (!self.dateApplyClicked && !self.dateClearClicked) {
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
        return (self.sdateSlice === self.initSdateSlice && self.edateSlice === self.initEdateSlice && _.isEqual(self.daySlice, self.initDaySlice)
            && _.isEqual(self.timeSlice, self.initTimeSlice) && (_.isUndefined(self.dateApplyClicked) || !self.dateApplyClicked));
    };

    NavListController.prototype.checkAgeInit = function () {
        var self = this;
        return (_.isEqual(self.ageSlice, self.initAgeSlice) && (_.isUndefined(self.ageApplyClicked) || !self.ageApplyClicked));
    };

    NavListController.prototype.clearDropDown = function (clearWhich) {
        var self = this;
        if (clearWhich.indexOf('datetime') >= 0) {
            self.daySlice = self.initDaySlice;
            self.timeSlice = self.initTimeSlice;
            self.sdateSlice = self.initSdateSlice;
            self.edateSlice = self.initEdateSlice;
            self.dateClearClicked = true;
        }
        if (clearWhich.indexOf('age') >= 0) {
            self.ageSlice = self.initAgeSlice;
            self.ageClearClicked = true;
        }
        if (clearWhich.indexOf('type') >= 0) {
            self.typeSlice = 'all';
        }
        if (clearWhich.indexOf('search') >= 0) {
            self.textboxSearch = '';
            self.searchTerm = '';
        }
        //var sliceBy = clearWhich.indexOf('datetime') >= 0 && clearWhich.indexOf('age') >=0 ? 'datetimeage' : clearWhich;
        self.sliceBy(clearWhich);
    };

    NavListController.prototype.checkAgeState = function (open) {
        var self = this;
        if (open) {
            self.origAgeSlice = _.clone(self.ageSlice);
            self.opened.ageRange = true;
            self.ageClearClicked = false;
        } else {
            if (!self.ageApplyClicked && !self.ageClearClicked) {
                self.ageSlice = _.clone(self.origAgeSlice);
            }
            self.opened.ageRange = false;
        }
    };

    NavListController.prototype.checkSearchSaved = function () {
        var self = this;
        var isSearchSaved = !_.isUndefined(_.find(self.savedSearches, { 'url': self.location.absUrl() }));
        return isSearchSaved;
    };

    NavListController.prototype.checkProgramSaved = function (title) {
        var self = this;
        var isSearchSaved = !_.isUndefined(_.find(self.savedPrograms, { 'Title': title }));
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
                    if (arr.ind === (_.size(self.enabledFilters) - 1)) {
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
        if (_.size(self.enabledFilters) === 0) {
            return false;
        }
        var okToShow = false;
        if ((self.dateApplyClicked && self.initialized) || self.typeSlice !== 'all' || (self.ageApplyClicked && self.initialized) || self.searchTerm !== '') {
            okToShow = true;
        }
        return okToShow;
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

    NavListController.prototype.mobileDetect = function () {
        // User-agent search for common mobile device header text, (common OR lesser common devices AND does it have "mobi", if found then this is a mobile device
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
            || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4)) && /Mobi/i.test(navigator.userAgent)) {
            //Sets isMobile to true
            //alert("Mobile Device detected: " + navigator.userAgent);
            isMobile = true;

        } else {
            //Sets isMobile to false
            //alert("Not a Mobile Device: " + navigator.userAgent);
            isMobile = false;
        }
    };

    var pluckAllKeys = function (obj, res) {
        var res = res || [];
        _.forOwn(obj, function (v, k) {
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
        if (sliceUrlStartLocation >= 0) {
            var sliceUrlEndLocation = locationPath.indexOf('/', sliceUrlStartLocation + 1);
            var sliceStringToReplace = sliceUrlEndLocation >= 0 ? locationPath.substring(sliceUrlStartLocation, sliceUrlEndLocation) : locationPath.substring(sliceUrlStartLocation);
            //clear from url if field is deselected or value is for 'all' or value is erroneous
            if (!sliceVal.toString().length || _.isNaN(sliceVal) || sliceVal === 'all') {
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
        if (!_.isUndefined(searchVal) && searchVal.length) {
            var filteredNavs = [];
            _.forEach(results, function (result) {
                if (getRank(result.Title, searchVal) > 0 || getRank(result.DescText, searchVal) > 0 || getRank(result.Teachers, searchVal) > 0 || getRank(result.KeyWord.toString(), searchVal) > 0) {
                    filteredNavs.push(result);
                }
            });
        } else {
            filteredNavs = results;
        }
        return filteredNavs;
    };

    var getRank = function (itemToSearchIn, searchItem) {
        var entirePhrase = searchItem.trim().toLowerCase();
        var spacesInPhrase = entirePhrase.match(/\s/g);
        var countSpaces = 0;
        if (spacesInPhrase != null) {
            countSpaces = spacesInPhrase.length;
        }
        var splitPhrase = entirePhrase.split(' ');
        var strippedPhraseArr = _.filter(splitPhrase, function (word) {
            if (!_.includes(STOPWORDS, word.toLowerCase())) {
                return word;
            }
        });
        var item = itemToSearchIn.toLowerCase();
        if (item.indexOf(entirePhrase) >= 0) {
            //if exact phrase is found and phrase is more than one word
            if (countSpaces > 0) {
                return 1;
            } else {
                //if exact phrase is found and phrase is just one word
                //then strip it to insure it's not matching a common word
                if (!_.includes(STOPWORDS, item.toLowerCase())) {
                    return 1;
                }
            }
        }
        if (strippedPhraseArr.length) {
            //strip item of weird characters
            var cleanedItem = item.replace(/[^\w\s]/gi, ' ');
            //divide string into an array using whitespace removing any empty elements
            var itemList = _.compact(cleanedItem.split(' '));
            var itemCount = 0;
            _.forEach(strippedPhraseArr, function (word) {
                if (_.includes(itemList, word.toLowerCase())) {
                    ++itemCount;
                }
            });
            //if all parts of the phrase are found
            if (itemCount === strippedPhraseArr.length) {
                return 2;
            }
            //if any parts of the phrase are found
            //if (itemCount > 0) {
            //    return 3;
            //}
        }
        return 0;
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
                var filtered = _.filter(daySlices, function (daySlice) {
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
                var filtered = _.filter(keywords, function (keyword) {
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
        var packageNo = arr.PackageNo;
        var prodNo = arr.ProductionSeasonNumber === 0 ? packageNo : arr.ProductionSeasonNumber;
        var keyWords = _.pluck(arr.CategoryProductionKeywords, 'keyword');
        var futurePerformanceDates = _.pluck(arr.FuturePerformances, 'perf_dt');
        var itemTypes = _.remove(keyWords, function (n) {
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
        var instructors = _.map(arr.ProdSeasonInstructors, function (arr) {
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
                _.forEach(performances, function (p, ind) {
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
                        _.forEach(teachArr, function (tch, index) {
                            classInstructors += tch;
                            if ((index + 1) < teachArr.length) {
                                classInstructors += ', ';
                            }
                        });
                        var rawDaysOfWeek = p.days_of_week;
                        if (!_.isNull(rawDaysOfWeek)) {
                            dowArr = rawDaysOfWeek.split(',');
                            var daysOfWeek = '';
                            _.forEach(dowArr, function (dow, index) {
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
                        shortDesc += "<td width='100'><img src=\"http://www.92y.org" + p.thumbnail + "\" border=\"0\" alt=\"" + p.title + "\" / style=\"width: 105px;\">";
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
            _.forEach(arr.ThisIsPartOfSeries, function (series, index) {
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
                _.forEach(moreLinks, function (ml) {
                    shortDesc += "<div class='morelink'>" + ml + "</div>";
                });
                shortDesc += "</div>";
            }
            shortDesc += "</div>";
        }

        var arrUrl = arr.URL;
        var urlTarget = '_blank';
        if (!_.startsWith(arrUrl, 'http')) {
            arrUrl = 'http://www.92y.org' + arrUrl;
            urlTarget = '_self';
            if (itemType.toLowerCase() === 'event' && isMobile == true) {
                arrUrl = 'http://m.92y.org' + '/Event/' + prodNo;
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
            Url: arrUrl,
            UrlTarget: urlTarget,
            Warning: warning,
            ItemType: itemType,
            Teachers: teachers,
            InProgress: inProgress,
            Featured: featured,
            FutureDates: futurePerformanceDates
        };
        return classInfoObj;
    };

    var formatCommaString = function (uglyString) {
        uglyString = uglyString.replace(/,(.)/g, function ($0, $1) {
            return ', ' + _.capitalize($1);
        });
        return _.capitalize(uglyString);
    };

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
        return self.http.get(url, { cache: self.cacheFactory.get(cache.info().id) }).success(function (data) {
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
            return self.http.get(jsonFile, { cache: self.cacheFactory.get(cache.info().id), timeout: 4000 }).then(function (data) {
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
            return { data: [] };
        });
    };

    navApp.service('tileInfoSrv', TileInfoService);

    //Added so we can inject our customized progress bar into NavListController
    navApp.factory("progressBar", ['ngProgressFactory', function (ngProgressFactory) {
        //Creates new instance, sets the color, then returns progress bar instance as a variable
        var progressBar = ngProgressFactory.createInstance();
        progressBar.setColor('#C747B8');
        return progressBar;
    } ]);

    NavListController.$inject = ['$scope', 'tileInfoSrv', '$location', '$timeout', '$window', '$cookieStore', 'navConfig', 'progressBar'];
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

    //Added to the top level interest navigation
    navApp.directive('progressBarIncrement', function ($timeout, progressBar) {
        return function (scope, element, attrs) {
            element.bind("click", function (e) {
                e.preventDefault();
                progressBar.set(progressBar.status() + 4);
                $timeout(function () {
                    progressBar.complete();
                }, 500);
            });
        };
    });

    navApp.directive('getElementPosition', function () {
        return {
            link: function (scope, element, attrs) {
                var raw = element[0];
                scope.$watch(function () {
                    return raw.offsetTop;
                }, function (newValue, oldValue) {
                    var winHeight = angular.element(window).height();
                    var headerHeight;
                    if (attrs.skipHeader == "true") {
                        headerHeight = 0;
                    } else {
                        headerHeight = angular.element('header').height();
                    }
                    var containerHeight = winHeight - (newValue + headerHeight);
                    scope.navListCtrl.bottomContainerStyle.height = containerHeight + 'px';

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
                scope.$watch(function () {
                    return scope.navListCtrl.affixed;
                }, function (newValue, oldValue) {
                    if (newValue === false) {
                        angular.element("#bottomContainer").scrollTop(0);
                    }
                });
            }
        };
    });

    navApp.directive('enableSearchEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.navListCtrl.searchGlobal();
                    });
                    event.preventDefault();
                }
            });
        };
    });

    navApp.directive('toggleSlide', function ($timeout) {
        return function (scope, element) {
            $timeout(function () {
                var expandBtn = angular.element(element).find("a.expand-collapse");
                expandBtn.bind('click', function () {
                    angular.element(this).next(".expand-collapse-container").slideToggle('800');
                });
            });
        };
    });

    navApp.directive('browseButton', function () {
        return function (scope, element) {
            element.bind("click", function (e) {
                e.preventDefault();
                angular.element("#browseSidebar").toggleClass('in');
                angular.element("body").toggleClass('sidebar-open');
                angular.element(".qp-ui-mask-modal").addClass('qp-ui-mask-visible');
                angular.element("#filterSidebar, #savedSidebar").removeClass('in inMobile');
            });
        };
    });

    navApp.directive('filterSidebar', function () {
        return function (scope, element) {
            element.bind("click", function (e) {
                e.preventDefault();
                angular.element("body").toggleClass('sidebar-open');
                angular.element(".qp-ui-mask-modal").addClass('qp-ui-mask-visible');
                angular.element("#filterSidebar").toggleClass('in');
                angular.element("#browseSidebar, #savedSidebar").removeClass('in inMobile');
            });
        };
    });

    navApp.directive('filterSidebarClose', function () {
        return function (scope, element) {
            element.bind("click", function (e) {
                e.preventDefault();
                angular.element("#filterSidebar").removeClass('in');
                angular.element(".qp-ui-mask-modal").removeClass('qp-ui-mask-visible');
                angular.element("body").removeClass('sidebar-open');
            });
        };
    });

    navApp.directive('wishList', function () {
        return function (scope, element) {
            element.bind("click", function (e) {
                e.preventDefault();
                angular.element("#navSavedBtn, #floatSavedBtn").toggleClass('out');
                angular.element("#savedSidebar").toggleClass('in');
                angular.element("#site-container").toggleClass('out-left');
                angular.element("body").toggleClass('sidebar-open');
                angular.element(".qp-ui-mask-modal").addClass('qp-ui-mask-visible');
                angular.element("#browseSidebar, #filterSidebar").removeClass('in inMobile');
            });
        };
    });

    navApp.directive('wishListClose', function () {
        return function (scope, element) {
            element.bind("click", function (e) {
                e.preventDefault();
                angular.element("#savedSidebar").removeClass('in');
                angular.element(".qp-ui-mask-modal").removeClass('qp-ui-mask-visible');
                angular.element("body").removeClass('sidebar-open');
            });
        };
    });

    //Clicking modal window closes sidebar and removes self
    navApp.directive('maskModal', function ($timeout) {
        return function (scope, element) {
            element.bind("click", function () {
                angular.element("body").toggleClass('sidebar-open');
                angular.element("#browseSidebar, #filterSidebar, #savedSidebar").removeClass('in inMobile');
                $timeout(function () {
                    angular.element(".qp-ui-mask-modal").toggleClass('qp-ui-mask-visible');
                }, 50);
            });
        };
    });

    //Close these sidebars when they are clicked
    navApp.directive('browseSidebar', function ($timeout) {
        return function (scope, element) {
            element.bind("click", function () {
                angular.element("#browseSidebar, #filterSidebar").removeClass('in');
                angular.element("body").removeClass('sidebar-open');
                $timeout(function () {
                    angular.element(".qp-ui-mask-modal").removeClass('qp-ui-mask-visible');
                }, 50);
            });
        };
    });

    navApp.directive('closeSubmit', function ($timeout) {
        return function (scope, element) {
            element.bind("click", function (e) {
                e.preventDefault();
                angular.element("#browseSidebar, #filterSidebar").removeClass('in');
                angular.element("body").removeClass('sidebar-open');
                $timeout(function () {
                    angular.element(".qp-ui-mask-modal").removeClass('qp-ui-mask-visible');
                }, 50);
            });
        };
    });

    navApp.filter('unsafe', function ($sce) {
        return function (val) {
            return $sce.trustAsHtml(val);
        };
    });

    navApp.config(['$analyticsProvider', function ($analyticsProvider) {
        $analyticsProvider.registerPageTrack(function (path) {
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
                        virtualPageUrl = '/' + p;
                    } else {
                        virtualPageUrl = '';
                    }
                    virtualPageTitle = p;
                    return;
                }
                //if virtualPageUrl has been initialized, add in the rest of the path to it
                if (!_.isUndefined(virtualPageUrl)) {
                    virtualPageUrl += '/' + p;
                }
            });
            var dataLayer = window.dataLayer = window.dataLayer || [];
            dataLayer.push({
                'event': 'VirtualPageview',
                'virtual-page-URL': virtualPageUrl,
                'virtual-page-title': virtualPageTitle
            });
        });
    } ]);

    navApp.config(function ($provide) {
        $provide.decorator("$exceptionHandler", function ($delegate) {
            return function (exception, cause) {
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