'use strict';

var app = angular.module('kanjiAlive.controllers'); 

app.controller(
  'detailController', 
  ['$scope', '$http', '$sce', '$routeParams', '$location','$timeout','$modal', 'searchService', 'hotkeys',
  function($scope, $http, $sce, $routeParams, $location, $timeout, $modal, searchService, hotkeys) {

    $scope.setup = function() {
      $scope.detailMode = searchService.detailMode;
      $scope.results = searchService.sortedResults;
      $scope.currentIndex = searchService.currentIndex;
      $scope.query = searchService.query;
      $scope.lastSearch = (searchService.lastSearch === undefined) ? '/search' : searchService.lastSearch;
      $scope.sources = [];
    };

    $scope.setup();

    var typefaces = ['suzumushi', 'kanteiryu','hiragino','tensho','kyokasho','mincho','gothic', 'maru'];
    var typefacesDisplay = ['Suzumushi', 'Kanteiryu', 'Gyosho', 'Tensho', 'Kyokashotai', 'Mincho', 'Gothic', 'Maru'];
    //var typefaces = ['kyokasho', 'mincho', 'gothic', 'suzumushi', 'kanteiryu', 'hiragino', 'tensho'];
    //var typefacesDisplay = ['Kyokashotai', 'Mincho', 'Gothic', 'Suzumushi (<a href="http://kanjialive.com">info</a>)', 'Kanteiryu', 'Gyosho', 'Tensho'];
    $scope.typeface = typefaces[searchService.currentTypeface];
    $scope.typefaceDisplay = typefacesDisplay[searchService.currentTypeface];

    $scope.radicalFrame = 0;


    $scope.prevKanji = function(shouldReset) {
      searchService.currentIndex--;
      if (searchService.currentIndex < 0){
        searchService.currentIndex = searchService.sortedResults.length - 1;
      }
      showCurrentIndex(shouldReset);
    }; 

    $scope.nextKanji = function(shouldReset) {

      searchService.currentIndex++;
      if (searchService.currentIndex >= searchService.sortedResults.length){
        searchService.currentIndex =  0;
      }
      showCurrentIndex(shouldReset);

    };

    var showCurrentIndex = function(shouldReset) {
      if (shouldReset){
        searchService.detailMode = 'video';
        searchService.currentTypeface = 4;
      }
      var kanji = searchService.sortedResults[searchService.currentIndex];
      $location.path('/' + kanji.ka_utf);
    };

    var kanji = $routeParams['character']; 
    var endpoint = '/api/kanji/';
    if (kanji.indexOf('ka_') == 0) endpoint += 'id/'; 
    endpoint += kanji; 
    $http.get(endpoint)
      .success(function (data){

          if (searchService.sortedResults == undefined){
            searchService.sortedResults = [data];
            searchService.currentIndex = 0;
            searchService.query = kanji;
            $scope.setup();
          }

          $scope.doc = data;
          $scope.translations = new Array($scope.doc.examples.length);
          $scope.sources = [
            {src: $sce.trustAsResourceUrl($scope.doc.mp4_video_source), type: "video/mp4"},
            {src: $sce.trustAsResourceUrl($scope.doc.webm_video_source), type: "video/webm"}
          ];

    }).
      error(function(data, status, headers, config) {
        // show error page.
        $location.path('/');
      });

    $scope.togglePlayPause = function() {
      if ($scope.video != undefined){
        if ($scope.video.paused){ $scope.play(); }
        else { $scope.pause(); }
      }
    };

    $scope.play = function() {
      if ($scope.video != undefined){
        $scope.video.play();
        $scope.playPauseIcon = 'icon-pause';
      }
    };

    $scope.pause = function() {
      if ($scope.video != undefined) {
        $scope.video.pause();
        $scope.playPauseIcon = 'icon-play';
      }
    };

    $scope.seek = function(time) {
      if ($scope.video != undefined && $scope.detailMode != 'typeface') {
        $scope.pause();
        $scope.video.currentTime = time;
      }
    };

    $scope.toggleDetailMode = function() {
      if (searchService.detailMode !== 'typeface'){
        $scope.setDetailMode('typeface');
      } else {
        $scope.setDetailMode('video');
      }
    };


    $scope.stepForward = function () {
      // video paused in $scope.seek
      if ($scope.video != undefined) {
        var ct = $scope.video.currentTime;
        var seek_margin = 0.1;
        for (var i = 0; i < $scope.doc.stroketimes.length; i++) {
          if ($scope.doc.stroketimes[i] > (ct + seek_margin)) {
            $scope.seek($scope.doc.stroketimes[i]);
            return;
          }
        }
        $scope.seek($scope.video.duration);
      }
    };

    $scope.stepBackward = function () {
      // video paused in $scope.seek
      if ($scope.video != undefined) {
        var ct = $scope.video.currentTime;
        var seek_margin = 0.1;
        for (var i = $scope.doc.stroketimes.length - 1; i > 0; i--) {
          if (($scope.doc.stroketimes[i] < (ct - seek_margin)) && i != 0) {
            $scope.seek($scope.doc.stroketimes[i]);
            return;
          }
        }
      }
    };

    $scope.showTranslation = function(index) { $scope.translations[index] = true; };
    $scope.hideTranslation = function(index) {$scope.translations[index] = false; };

    $scope.renderHtml = function(html){ 
    	
    	switch(html) {
        case "東京都23区（とうきょうと23く）":
        	html = '<span class="example10"> 東京都23区（とうきょうと23く）</span>';
            break;
        case "机上の空論（きじょうのくうろん）":
        case "今昔物語（こんじゃくものがたり）":
        case "即席ラーメン（そくせきラーメン）":
        case "直情径行（ちょくじょうけいこう）":
        case "断腸の思い（だんちょうのおもい）":
        case "公衆浴場（こうしゅうよくじょう）":
        case "超自然的な（ちょうしぜんてきな）":
        case "駐停車する（ちゅうていしゃする）":
        case "珍紛漢紛な（ちんぷんかんぷんな）":
        case "開眼する（かいがん/かいげんする）":   
        	html = '<span class="example10">' + html.split('（')[0] + '</span><span class="example9">（' + html.split('（')[1] + '</span>';  	
        	break;
        	
        case "立ち往生する（たちおうじょうする）": 
        case "終身雇用制（しゅうしんこようせい）":  	
        case "沈着冷静な（ちんちゃくれいせいな）":  	
        case "沈思黙考する（ちんしもっこうする）":   	
        case "一泊二食付き（いっぱくにしょくつき）": 	    
        case "右往左往する（うおうさおうする）":
        	html = '<span class="example10">' + html.split('（')[0] + '</span><span class="example8">（' + html.split('（')[1] + '</span>';  
        	break;
        	
        case "清涼飲料水（せいりょういんりょうすい）":
        	html = '<span class="example10">' + html.split('（')[0] + '</span><span class="example7">（' + html.split('（')[1] + '</span>';  
        	break;
        default:
        
    }
    	return $sce.trustAsHtml(html);
    	
    	
    	
    	
    
    
    
    };

    $scope.startRadicalAnimation = function(){
      $timeout(function(){$scope.radicalFrame=1;$scope.$apply();}, 1250, false);
      $timeout(function(){$scope.radicalFrame=2;$scope.$apply();}, 2500, false);
      $timeout(function(){$scope.radicalFrame=0;$scope.$apply();}, 3750, false);
    };

    $scope.setDetailMode = function(mode){
      $scope.detailMode = mode;
      searchService.detailMode = mode;
    } ;

    $scope.nextTypeface = function(){
      searchService.currentTypeface = Math.min(searchService.currentTypeface + 1, typefaces.length-1);
      $scope.typeface = typefaces[searchService.currentTypeface % typefaces.length];
      $scope.typefaceDisplay = typefacesDisplay[searchService.currentTypeface % typefaces.length];
    };

    $scope.previousTypeface = function(){
      searchService.currentTypeface = Math.max(searchService.currentTypeface - 1, 0);
      $scope.typeface = typefaces[searchService.currentTypeface % typefaces.length];
      $scope.typefaceDisplay = typefacesDisplay[searchService.currentTypeface % typefaces.length];
    };

    $scope.showHelpModal = function (size) {
      $modal.open({
        templateUrl: 'partials/detail-help.html',
        controller:'modalController',
        size: size
      });
    };

    $scope.playPauseIcon = 'icon-play';

    hotkeys.bindTo($scope)
        .add({
          combo: 'up',
          description: 'Switch between animation/typeface view.',
          callback: function(){
            $scope.toggleDetailMode();
          }
        }).add({
          combo: 'down',
          description: 'Switch between animation/typeface view.',
          callback: function(){
            $scope.toggleDetailMode();
          }
        }).add({
          combo: 'left',
          description: 'Previous Kanji in results',
          callback: function() {
              $scope.prevKanji(false);
          }
        }).add({
        combo: 'shift+left',
        description: 'Previous typeface/Previous stroke',
        callback: function() {
          if ($scope.detailMode == 'typeface') {
            $scope.previousTypeface()
          } else {
            $scope.stepBackward();
          }
        }
      }).add({
        combo: 'right',
        description: 'Next Kanji in results.',
        callback: function() {
          $scope.nextKanji(false);
        }
      }).add({
          combo: 'shift+right',
          description: 'Next typeface.',
          callback: function() {
            if ($scope.detailMode == 'typeface'){
              $scope.nextTypeface()
            } else {
              $scope.stepForward();
            }
          }
        }).add({
          combo: 'space',
          description: 'Play/Pause animation video.',
          callback: function() {
            $scope.togglePlayPause();
          }
        });


    
    
    /*  added by TGJ 26/07/16 to support addition of search form in detail view */
    
    /* called when hidden submit button is triggered on enter key pressed */
    $scope.search = function() { parseQuery($scope.query); };

    var parseQuery = function(query) {

      searchService.query = query;

      var searchObj = {};
      if (query !== undefined && query.length > 0){
        var components = query.split(':');
        if (components.length >= 2){

          var searchingForKey = true;
          var lastSpaceIndex = - 1;
          var lastColonIndex = -1;
          var key = null;

          for (var i=0; i < query.length; i++){
            if (searchingForKey){
              if (query.charAt(i) === ':'){
                if (lastColonIndex !== -1 && key !== null){
                  searchObj[key] = query.substring(lastColonIndex+1, lastSpaceIndex);
                }
                key = query.substring(lastSpaceIndex + 1, i).toLowerCase();;
                searchingForKey = false;
                lastColonIndex = i;

              } else if (query.charAt(i) === ' '){
                lastSpaceIndex = i;
              }
            } else {
              if (query.charAt(i) === ' '){
                lastSpaceIndex = i;
                searchingForKey = true;
              }
            }
          }

          if (lastColonIndex !== -1){
            searchObj[key] = query.substring(lastColonIndex+1);
          }

          $location.path('/search/advanced').search(searchObj);

        } else {

          $location.path('/search/' + query).search({});

        }

        searchService.lastSearch = $location.url();

      }
    };

    
    
    
   
    
  }]);