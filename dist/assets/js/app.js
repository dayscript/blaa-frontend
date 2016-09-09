'use strict';
var blaaApp = angular.module('blaaApp', ['ngSanitize','ngRoute','ncy-angular-breadcrumb',
                                         'ngPrettyJson','chieffancypants.loadingBar',
                                         'ngAnimate','ngPrettyJson'])
    .constant('ENVIRONMENT', 'http://blaa.demodayscript.com/')
    .constant('ENVIRONMENTFRONT', '/')
    .config(function(cfpLoadingBarProvider) {
      cfpLoadingBarProvider.includeSpinner = true;
    });


function print(text,variable){
    console.log(text+':'+variable);
}
blaaApp.config(['$routeProvider','$locationProvider',function($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('!');
    $locationProvider.html5Mode(true);

    $routeProvider.when('/', {
        templateUrl: 'home.html'
    })
    .when('/bibliotecas/memorias-orales', {
        templateUrl: 'memorias-orales.html',
        controller: 'MemoriasOralesController'
    })
        .when('/bibliotecas/memorias-orales/noticias', {
            templateUrl: 'noticias.html',
            controller: 'MemoriasOralesController'
        })
    .otherwise({
        redirectTo: '/404'
    });
    // configure html5 to get links working on jsfiddle
}]);

/*blaaApp.run(['$location', function AppRun($location) {
    debugger;
}]);*/

blaaApp.controller('SucursalController',['$scope','$http','$location','ENVIRONMENT','$rootScope','$stateParams', '$state', function($scope, $http, $location, ENVIRONMENT, $rootScope,$stateParams, $state){
    $scope.breadcrumbs = []
    $stateParams.sucursal ?  $rootScope.sucursal = $stateParams.sucursal:$rootScope.sucursal = 'Bogotá';
    $scope.breadcrumbs = 'Actividad Cultural'
    console.log('Sucursal:'+ $rootScope.sucursal);
}])

blaaApp.controller('BannerPrincipalController',['$scope','$http','$location','ENVIRONMENT','$rootScope','$timeout', function($scope, $http, $location, ENVIRONMENT, $rootScope,$timeout){
    var path = 'banner/json';
    var node;
    $scope.banners = {};
    $http.get(ENVIRONMENT+path).success(function(data){
        for( node in data.nodes ){
          $scope.banners[node] = data.nodes[node].node
        }
    })
}]);

/*SECCION BREADCRUMB*/
blaaApp.controller('BreadcrumbController', ['$scope', '$http','$location','ENVIRONMENT','$rootScope', function ($scope, $http, $location, ENVIRONMENT,$rootScope) {
    print('breadcrumb',$location.path());
    var paths = {};
    paths = $location.path()
    $scope.breadcrumb = {};
    paths = paths.split('/');
    paths.shift();
    for( var i = 0; i <= paths.length-1; i++ ){
        paths == ""? $scope.breadcrumb[i] = paths[0]:$scope.breadcrumb[i] = paths[i];
    }
    $rootScope.breadcrumb = $scope.breadcrumb;
}]); 

/*SECCION SLIDER EVENTOS*/
blaaApp.controller('EventosController',['$scope','$http','$location','ENVIRONMENT','$rootScope', function($scope, $http, $location, ENVIRONMENT, $rootScope){
   var path = 'eventosJSON';
   var node;
   $scope.events = {};
   $http.get(ENVIRONMENT+path).success(function(data){
       for( node in data.nodes ){
           $scope.events[node] = data.nodes[node]['node']
       }
       console.log($scope.events)
   })
}]);

/*SECCION SLIDER EVENTOS*/
blaaApp.controller('LineaDeTiempoController',['$scope','$http','$location','ENVIRONMENT', function($scope, $http, $location, ENVIRONMENT){
   var path = 'eventosJSON';
   var pathTipoEvento = 'taxonomias/tipodeevento/json';
   var node;
   $scope.events = {};
   $http.get(ENVIRONMENT+path).success(function(data){
       for( node in data.nodes ){
           $scope.events[node] = data.nodes[node]['node']
       }
   })
   $scope.tipoEventos = {};
   $http.get(ENVIRONMENT+pathTipoEvento).success(function(data){
       for( node in data.nodes ){
           $scope.tipoEventos[node] = data.nodes[node]['node']
       }
   })
}]);

/*
  Blaa - Dayscript
  Biblioteca de clases para estilos
  copyrigth 2016 - Bogota-Colombia
*/
blaaApp.controller('MemoriasOralesController',['$scope', '$http', 'ENVIRONMENT','$timeout', '$q', function($scope, $http, ENVIRONMENT, $timeout, $q) {

  $scope.collections = [];

  var promises = [];
  promises.push($http.get(ENVIRONMENT+'colecciones/json/mas-recientes/Memoria oral').success(function(data) {
    var temporal = [];
    var slider = {
      "title": "Lo más Reciente",
      "nodes": []
    };

    angular.forEach(data.nodes, function(collection, key) {
      console.log(key)
      if( (key+1) %  4 == 0 || key == data.nodes.length){
        slider.nodes.push(temporal);
        temporal = [];
      }else{
        temporal.push(collection);
      }    
    });

    $scope.collections.push(slider);

  }));

  promises.push($http.get(ENVIRONMENT+'colecciones/json/mas-destacados/Memoria oral').success(function(data) {
    var temporal = [];
    var slider = {
      "title": "Lo más Destacado",
      "nodes": []
    };

    angular.forEach(data.nodes, function(collection, key) {
      if((key+1) % 4 == 0 || key == data.nodes.length){
        slider.nodes.push(temporal);
        temporal = [];
      }else{
        temporal.push(collection);
      }
    });
    $scope.collections.push(slider);
  }));

  promises.push($http.get(ENVIRONMENT+'colecciones/json/mas-populares/Memoria oral').success(function(data) {
    var temporal = [];
    var slider = {
      "title": "Lo más Popular",
      "nodes": []
    };

    angular.forEach(data.nodes, function(collection, key) {
      if((key+1) % 4 == 0 || key == data.nodes.length){
        slider.nodes.push(temporal);
        temporal = [];
      }else{
        temporal.push(collection);
      }
    });

    $scope.collections.push(slider);
    console.log($scope.collections);
  }));

  // wait to all promises resolve
  var all = $q.all(promises);

  all.then(function(){

    $timeout(function() {
      $(document).foundation();
    }, 0);

  });


}]);

/*SECCION MENUS*/
blaaApp.controller('MenuController', ['$scope', '$http', '$location','ENVIRONMENT',
                                      'ENVIRONMENTFRONT','$rootScope',
    function ( $scope, $http, $location,ENVIRONMENT,ENVIRONMENTFRONT,$rootScope) {
        var breadcrumb;
        $location.path() == '/' ? $scope.path = '/':$scope.path = $location.path()
        
        $http.get(ENVIRONMENTFRONT+'assets/data/Menu_principal.js').success(function (data) {
            $scope.menu = data.nodes[0];
            console.log($scope.menu);
        });
        $http.get(ENVIRONMENT+'sucursales/json').success(function (data) {
            delete data.nodes[2];
            $scope.sucursales = [];
            var count = 0;
            var node;
            for( node in data.nodes ){
                $scope.sucursales[count] = data.nodes[node];
                count ++;
            }
            $rootScope.sucursales = $scope.sucursales;
        });
        $scope.onChangeCiudad = function() {
            var paths={}
            var path;
            path = $location.path()
            $rootScope.sucursal = $scope.sucursal;
            $location.path(path + $rootScope.sucursal);
        }

  }]);

/*SECCION NOTICIAS*/
blaaApp.controller('NoticiasController',['$scope','$http','$location','ENVIRONMENT','$rootScope', function($scope, $http, $location, ENVIRONMENT, $rootScope){
    var path = 'articulosJSON';
    var node;
    $scope.articles = {};
    $http.get(ENVIRONMENT+path).success(function(data){
        for( node in data.nodes ){
            $scope.articles[node] = data.nodes[node]['node']
        }
    })
}]);

/*SECCION OPUS*/
blaaApp.controller('OpusController', ['$scope', '$http','ENVIRONMENT', function ($scope, $http, ENVIRONMENT) {
    $http.get(ENVIRONMENT+'conciertos/json').success(function (data) {
        $scope.concerts = data.nodes;
    });

}]);

/*
  Blaa - Dayscript
  Biblioteca de clases para estilos
  copyrigth 2016 - Bogota-Colombia
*/
blaaApp.controller('PageController',['$scope','$log','$location', '$timeout' ,function($scope, $log, $location, $timeout) {

  var colourMap = {
    index : 'cIndex',
    bibliotecas: "cBiblio",
  };

  $scope.GetClass = function(){
    var pathClass = $location.path()
    //console.log(pathClass)
    pathClass = pathClass.split('/')
    pathClass.shift()
    return colourMap[pathClass[0]];
  }

  $timeout(function(){
    $(document).foundation();
  }, 3000);
}]);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC1jb25maWd1cmUuanMiLCJhcHAtcm91dGUuanMiLCJBcHBDb250cm9sbGVyLmpzIiwiQmFubmVyUHJpbmNpcGFsQ29udHJvbGxlci5qcyIsIkJyZWFkQ3J1bWJDb250cm9sbGVyLmpzIiwiRXZlbnRvc0NvbnRyb2xsZXIuanMiLCJMaW5lYURlVGllbXBvQ29udHJvbGxlci5qcyIsIk1lbW9yaWFzT3JhbGVzQ29udHJvbGxlci5qcyIsIk1lbnVDb250cm9sbGVyLmpzIiwiTm90aWNpYXNDb250cm9sbGVyLmpzIiwiT3B1c0NvbnRyb2xsZXIuanMiLCJQYWdlQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG52YXIgYmxhYUFwcCA9IGFuZ3VsYXIubW9kdWxlKCdibGFhQXBwJywgWyduZ1Nhbml0aXplJywnbmdSb3V0ZScsJ25jeS1hbmd1bGFyLWJyZWFkY3J1bWInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdQcmV0dHlKc29uJywnY2hpZWZmYW5jeXBhbnRzLmxvYWRpbmdCYXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdBbmltYXRlJywnbmdQcmV0dHlKc29uJ10pXG4gICAgLmNvbnN0YW50KCdFTlZJUk9OTUVOVCcsICdodHRwOi8vYmxhYS5kZW1vZGF5c2NyaXB0LmNvbS8nKVxuICAgIC5jb25zdGFudCgnRU5WSVJPTk1FTlRGUk9OVCcsICcvJylcbiAgICAuY29uZmlnKGZ1bmN0aW9uKGNmcExvYWRpbmdCYXJQcm92aWRlcikge1xuICAgICAgY2ZwTG9hZGluZ0JhclByb3ZpZGVyLmluY2x1ZGVTcGlubmVyID0gdHJ1ZTtcbiAgICB9KTtcblxuXG5mdW5jdGlvbiBwcmludCh0ZXh0LHZhcmlhYmxlKXtcbiAgICBjb25zb2xlLmxvZyh0ZXh0Kyc6Jyt2YXJpYWJsZSk7XG59IiwiYmxhYUFwcC5jb25maWcoWyckcm91dGVQcm92aWRlcicsJyRsb2NhdGlvblByb3ZpZGVyJyxmdW5jdGlvbigkcm91dGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCchJyk7XG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuXG4gICAgJHJvdXRlUHJvdmlkZXIud2hlbignLycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdob21lLmh0bWwnXG4gICAgfSlcbiAgICAud2hlbignL2JpYmxpb3RlY2FzL21lbW9yaWFzLW9yYWxlcycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdtZW1vcmlhcy1vcmFsZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdNZW1vcmlhc09yYWxlc0NvbnRyb2xsZXInXG4gICAgfSlcbiAgICAgICAgLndoZW4oJy9iaWJsaW90ZWNhcy9tZW1vcmlhcy1vcmFsZXMvbm90aWNpYXMnLCB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ25vdGljaWFzLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ01lbW9yaWFzT3JhbGVzQ29udHJvbGxlcidcbiAgICAgICAgfSlcbiAgICAub3RoZXJ3aXNlKHtcbiAgICAgICAgcmVkaXJlY3RUbzogJy80MDQnXG4gICAgfSk7XG4gICAgLy8gY29uZmlndXJlIGh0bWw1IHRvIGdldCBsaW5rcyB3b3JraW5nIG9uIGpzZmlkZGxlXG59XSk7XG5cbi8qYmxhYUFwcC5ydW4oWyckbG9jYXRpb24nLCBmdW5jdGlvbiBBcHBSdW4oJGxvY2F0aW9uKSB7XG4gICAgZGVidWdnZXI7XG59XSk7Ki9cbiIsImJsYWFBcHAuY29udHJvbGxlcignU3VjdXJzYWxDb250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywnJHN0YXRlUGFyYW1zJywgJyRzdGF0ZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUsJHN0YXRlUGFyYW1zLCAkc3RhdGUpe1xuICAgICRzY29wZS5icmVhZGNydW1icyA9IFtdXG4gICAgJHN0YXRlUGFyYW1zLnN1Y3Vyc2FsID8gICRyb290U2NvcGUuc3VjdXJzYWwgPSAkc3RhdGVQYXJhbXMuc3VjdXJzYWw6JHJvb3RTY29wZS5zdWN1cnNhbCA9ICdCb2dvdMOhJztcbiAgICAkc2NvcGUuYnJlYWRjcnVtYnMgPSAnQWN0aXZpZGFkIEN1bHR1cmFsJ1xuICAgIGNvbnNvbGUubG9nKCdTdWN1cnNhbDonKyAkcm9vdFNjb3BlLnN1Y3Vyc2FsKTtcbn1dKVxuIiwiYmxhYUFwcC5jb250cm9sbGVyKCdCYW5uZXJQcmluY2lwYWxDb250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywnJHRpbWVvdXQnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlLCR0aW1lb3V0KXtcclxuICAgIHZhciBwYXRoID0gJ2Jhbm5lci9qc29uJztcclxuICAgIHZhciBub2RlO1xyXG4gICAgJHNjb3BlLmJhbm5lcnMgPSB7fTtcclxuICAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAkc2NvcGUuYmFubmVyc1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV0ubm9kZVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1dKTtcclxuIiwiLypTRUNDSU9OIEJSRUFEQ1JVTUIqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ0JyZWFkY3J1bWJDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCwkcm9vdFNjb3BlKSB7XHJcbiAgICBwcmludCgnYnJlYWRjcnVtYicsJGxvY2F0aW9uLnBhdGgoKSk7XHJcbiAgICB2YXIgcGF0aHMgPSB7fTtcclxuICAgIHBhdGhzID0gJGxvY2F0aW9uLnBhdGgoKVxyXG4gICAgJHNjb3BlLmJyZWFkY3J1bWIgPSB7fTtcclxuICAgIHBhdGhzID0gcGF0aHMuc3BsaXQoJy8nKTtcclxuICAgIHBhdGhzLnNoaWZ0KCk7XHJcbiAgICBmb3IoIHZhciBpID0gMDsgaSA8PSBwYXRocy5sZW5ndGgtMTsgaSsrICl7XHJcbiAgICAgICAgcGF0aHMgPT0gXCJcIj8gJHNjb3BlLmJyZWFkY3J1bWJbaV0gPSBwYXRoc1swXTokc2NvcGUuYnJlYWRjcnVtYltpXSA9IHBhdGhzW2ldO1xyXG4gICAgfVxyXG4gICAgJHJvb3RTY29wZS5icmVhZGNydW1iID0gJHNjb3BlLmJyZWFkY3J1bWI7XHJcbn1dKTsgXHJcbiIsIi8qU0VDQ0lPTiBTTElERVIgRVZFTlRPUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignRXZlbnRvc0NvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlKXtcclxuICAgdmFyIHBhdGggPSAnZXZlbnRvc0pTT04nO1xyXG4gICB2YXIgbm9kZTtcclxuICAgJHNjb3BlLmV2ZW50cyA9IHt9O1xyXG4gICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aCkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgJHNjb3BlLmV2ZW50c1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV1bJ25vZGUnXVxyXG4gICAgICAgfVxyXG4gICAgICAgY29uc29sZS5sb2coJHNjb3BlLmV2ZW50cylcclxuICAgfSlcclxufV0pO1xyXG4iLCIvKlNFQ0NJT04gU0xJREVSIEVWRU5UT1MqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ0xpbmVhRGVUaWVtcG9Db250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5UKXtcclxuICAgdmFyIHBhdGggPSAnZXZlbnRvc0pTT04nO1xyXG4gICB2YXIgcGF0aFRpcG9FdmVudG8gPSAndGF4b25vbWlhcy90aXBvZGVldmVudG8vanNvbic7XHJcbiAgIHZhciBub2RlO1xyXG4gICAkc2NvcGUuZXZlbnRzID0ge307XHJcbiAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAkc2NvcGUuZXZlbnRzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICB9XHJcbiAgIH0pXHJcbiAgICRzY29wZS50aXBvRXZlbnRvcyA9IHt9O1xyXG4gICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aFRpcG9FdmVudG8pLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICRzY29wZS50aXBvRXZlbnRvc1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV1bJ25vZGUnXVxyXG4gICAgICAgfVxyXG4gICB9KVxyXG59XSk7XHJcbiIsIi8qXG4gIEJsYWEgLSBEYXlzY3JpcHRcbiAgQmlibGlvdGVjYSBkZSBjbGFzZXMgcGFyYSBlc3RpbG9zXG4gIGNvcHlyaWd0aCAyMDE2IC0gQm9nb3RhLUNvbG9tYmlhXG4qL1xuYmxhYUFwcC5jb250cm9sbGVyKCdNZW1vcmlhc09yYWxlc0NvbnRyb2xsZXInLFsnJHNjb3BlJywgJyRodHRwJywgJ0VOVklST05NRU5UJywnJHRpbWVvdXQnLCAnJHEnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCBFTlZJUk9OTUVOVCwgJHRpbWVvdXQsICRxKSB7XG5cbiAgJHNjb3BlLmNvbGxlY3Rpb25zID0gW107XG5cbiAgdmFyIHByb21pc2VzID0gW107XG4gIHByb21pc2VzLnB1c2goJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb2xlY2Npb25lcy9qc29uL21hcy1yZWNpZW50ZXMvTWVtb3JpYSBvcmFsJykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHRlbXBvcmFsID0gW107XG4gICAgdmFyIHNsaWRlciA9IHtcbiAgICAgIFwidGl0bGVcIjogXCJMbyBtw6FzIFJlY2llbnRlXCIsXG4gICAgICBcIm5vZGVzXCI6IFtdXG4gICAgfTtcblxuICAgIGFuZ3VsYXIuZm9yRWFjaChkYXRhLm5vZGVzLCBmdW5jdGlvbihjb2xsZWN0aW9uLCBrZXkpIHtcbiAgICAgIGNvbnNvbGUubG9nKGtleSlcbiAgICAgIGlmKCAoa2V5KzEpICUgIDQgPT0gMCB8fCBrZXkgPT0gZGF0YS5ub2Rlcy5sZW5ndGgpe1xuICAgICAgICBzbGlkZXIubm9kZXMucHVzaCh0ZW1wb3JhbCk7XG4gICAgICAgIHRlbXBvcmFsID0gW107XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGVtcG9yYWwucHVzaChjb2xsZWN0aW9uKTtcbiAgICAgIH0gICAgXG4gICAgfSk7XG5cbiAgICAkc2NvcGUuY29sbGVjdGlvbnMucHVzaChzbGlkZXIpO1xuXG4gIH0pKTtcblxuICBwcm9taXNlcy5wdXNoKCRodHRwLmdldChFTlZJUk9OTUVOVCsnY29sZWNjaW9uZXMvanNvbi9tYXMtZGVzdGFjYWRvcy9NZW1vcmlhIG9yYWwnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgdGVtcG9yYWwgPSBbXTtcbiAgICB2YXIgc2xpZGVyID0ge1xuICAgICAgXCJ0aXRsZVwiOiBcIkxvIG3DoXMgRGVzdGFjYWRvXCIsXG4gICAgICBcIm5vZGVzXCI6IFtdXG4gICAgfTtcblxuICAgIGFuZ3VsYXIuZm9yRWFjaChkYXRhLm5vZGVzLCBmdW5jdGlvbihjb2xsZWN0aW9uLCBrZXkpIHtcbiAgICAgIGlmKChrZXkrMSkgJSA0ID09IDAgfHwga2V5ID09IGRhdGEubm9kZXMubGVuZ3RoKXtcbiAgICAgICAgc2xpZGVyLm5vZGVzLnB1c2godGVtcG9yYWwpO1xuICAgICAgICB0ZW1wb3JhbCA9IFtdO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRlbXBvcmFsLnB1c2goY29sbGVjdGlvbik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgJHNjb3BlLmNvbGxlY3Rpb25zLnB1c2goc2xpZGVyKTtcbiAgfSkpO1xuXG4gIHByb21pc2VzLnB1c2goJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb2xlY2Npb25lcy9qc29uL21hcy1wb3B1bGFyZXMvTWVtb3JpYSBvcmFsJykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHRlbXBvcmFsID0gW107XG4gICAgdmFyIHNsaWRlciA9IHtcbiAgICAgIFwidGl0bGVcIjogXCJMbyBtw6FzIFBvcHVsYXJcIixcbiAgICAgIFwibm9kZXNcIjogW11cbiAgICB9O1xuXG4gICAgYW5ndWxhci5mb3JFYWNoKGRhdGEubm9kZXMsIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGtleSkge1xuICAgICAgaWYoKGtleSsxKSAlIDQgPT0gMCB8fCBrZXkgPT0gZGF0YS5ub2Rlcy5sZW5ndGgpe1xuICAgICAgICBzbGlkZXIubm9kZXMucHVzaCh0ZW1wb3JhbCk7XG4gICAgICAgIHRlbXBvcmFsID0gW107XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGVtcG9yYWwucHVzaChjb2xsZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgICRzY29wZS5jb2xsZWN0aW9ucy5wdXNoKHNsaWRlcik7XG4gICAgY29uc29sZS5sb2coJHNjb3BlLmNvbGxlY3Rpb25zKTtcbiAgfSkpO1xuXG4gIC8vIHdhaXQgdG8gYWxsIHByb21pc2VzIHJlc29sdmVcbiAgdmFyIGFsbCA9ICRxLmFsbChwcm9taXNlcyk7XG5cbiAgYWxsLnRoZW4oZnVuY3Rpb24oKXtcblxuICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgJChkb2N1bWVudCkuZm91bmRhdGlvbigpO1xuICAgIH0sIDApO1xuXG4gIH0pO1xuXG5cbn1dKTtcbiIsIi8qU0VDQ0lPTiBNRU5VUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignTWVudUNvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsICckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0VOVklST05NRU5URlJPTlQnLCckcm9vdFNjb3BlJyxcclxuICAgIGZ1bmN0aW9uICggJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLEVOVklST05NRU5ULEVOVklST05NRU5URlJPTlQsJHJvb3RTY29wZSkge1xyXG4gICAgICAgIHZhciBicmVhZGNydW1iO1xyXG4gICAgICAgICRsb2NhdGlvbi5wYXRoKCkgPT0gJy8nID8gJHNjb3BlLnBhdGggPSAnLyc6JHNjb3BlLnBhdGggPSAkbG9jYXRpb24ucGF0aCgpXHJcbiAgICAgICAgXHJcbiAgICAgICAgJGh0dHAuZ2V0KEVOVklST05NRU5URlJPTlQrJ2Fzc2V0cy9kYXRhL01lbnVfcHJpbmNpcGFsLmpzJykuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAkc2NvcGUubWVudSA9IGRhdGEubm9kZXNbMF07XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5tZW51KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrJ3N1Y3Vyc2FsZXMvanNvbicpLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgZGVsZXRlIGRhdGEubm9kZXNbMl07XHJcbiAgICAgICAgICAgICRzY29wZS5zdWN1cnNhbGVzID0gW107XHJcbiAgICAgICAgICAgIHZhciBjb3VudCA9IDA7XHJcbiAgICAgICAgICAgIHZhciBub2RlO1xyXG4gICAgICAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnN1Y3Vyc2FsZXNbY291bnRdID0gZGF0YS5ub2Rlc1tub2RlXTtcclxuICAgICAgICAgICAgICAgIGNvdW50ICsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuc3VjdXJzYWxlcyA9ICRzY29wZS5zdWN1cnNhbGVzO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRzY29wZS5vbkNoYW5nZUNpdWRhZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgcGF0aHM9e31cclxuICAgICAgICAgICAgdmFyIHBhdGg7XHJcbiAgICAgICAgICAgIHBhdGggPSAkbG9jYXRpb24ucGF0aCgpXHJcbiAgICAgICAgICAgICRyb290U2NvcGUuc3VjdXJzYWwgPSAkc2NvcGUuc3VjdXJzYWw7XHJcbiAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKHBhdGggKyAkcm9vdFNjb3BlLnN1Y3Vyc2FsKTtcclxuICAgICAgICB9XHJcblxyXG4gIH1dKTtcclxuIiwiLypTRUNDSU9OIE5PVElDSUFTKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdOb3RpY2lhc0NvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlKXtcclxuICAgIHZhciBwYXRoID0gJ2FydGljdWxvc0pTT04nO1xyXG4gICAgdmFyIG5vZGU7XHJcbiAgICAkc2NvcGUuYXJ0aWNsZXMgPSB7fTtcclxuICAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgICRzY29wZS5hcnRpY2xlc1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV1bJ25vZGUnXVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1dKTtcclxuIiwiLypTRUNDSU9OIE9QVVMqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ09wdXNDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCdFTlZJUk9OTUVOVCcsIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwLCBFTlZJUk9OTUVOVCkge1xyXG4gICAgJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb25jaWVydG9zL2pzb24nKS5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgJHNjb3BlLmNvbmNlcnRzID0gZGF0YS5ub2RlcztcclxuICAgIH0pO1xyXG5cclxufV0pO1xyXG4iLCIvKlxuICBCbGFhIC0gRGF5c2NyaXB0XG4gIEJpYmxpb3RlY2EgZGUgY2xhc2VzIHBhcmEgZXN0aWxvc1xuICBjb3B5cmlndGggMjAxNiAtIEJvZ290YS1Db2xvbWJpYVxuKi9cbmJsYWFBcHAuY29udHJvbGxlcignUGFnZUNvbnRyb2xsZXInLFsnJHNjb3BlJywnJGxvZycsJyRsb2NhdGlvbicsICckdGltZW91dCcgLGZ1bmN0aW9uKCRzY29wZSwgJGxvZywgJGxvY2F0aW9uLCAkdGltZW91dCkge1xuXG4gIHZhciBjb2xvdXJNYXAgPSB7XG4gICAgaW5kZXggOiAnY0luZGV4JyxcbiAgICBiaWJsaW90ZWNhczogXCJjQmlibGlvXCIsXG4gIH07XG5cbiAgJHNjb3BlLkdldENsYXNzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgcGF0aENsYXNzID0gJGxvY2F0aW9uLnBhdGgoKVxuICAgIC8vY29uc29sZS5sb2cocGF0aENsYXNzKVxuICAgIHBhdGhDbGFzcyA9IHBhdGhDbGFzcy5zcGxpdCgnLycpXG4gICAgcGF0aENsYXNzLnNoaWZ0KClcbiAgICByZXR1cm4gY29sb3VyTWFwW3BhdGhDbGFzc1swXV07XG4gIH1cblxuICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICQoZG9jdW1lbnQpLmZvdW5kYXRpb24oKTtcbiAgfSwgMzAwMCk7XG59XSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
