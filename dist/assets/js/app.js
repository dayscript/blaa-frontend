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
blaaApp.controller('MemoriasOralesController',['$scope', '$http', 'ENVIRONMENT', function($scope, $http, ENVIRONMENT) {
  
  $scope.collections = [];

  $http.get(ENVIRONMENT+'colecciones/json').success(function(data) {
    var temporal = [];

    $scope.collections.push({
      "title": "Lo más Reciente",
      "nodes": [],
    });

    angular.forEach(data.nodes, function(collection, key) {
      if((key+1) % 4 == 0 || key == data.nodes.length){
        $scope.collections[0].nodes.push(temporal);
        temporal = [];
      }else{
        temporal.push(collection);
      }
    });
  }); 
   
  $http.get(ENVIRONMENT+'colecciones/json/destacados').success(function(data) {
    var temporal = [];

    $scope.collections.push({
      "title": "Lo más Destacado",
      "nodes": [],
    });

    angular.forEach(data.nodes, function(collection, key) {
      if((key+1) % 4 == 0 || key == data.nodes.length){
        $scope.collections[1].nodes.push(temporal);
        temporal = [];
      }else{
        temporal.push(collection);
      }
    });
  });   

  $http.get(ENVIRONMENT+'colecciones/json/populares').success(function(data) {
    var temporal = [];

    $scope.collections.push({
      "title": "Lo más Popular",
      "nodes": [],
    });

    angular.forEach(data.nodes, function(collection, key) {
      if((key+1) % 4 == 0 || key == data.nodes.length){
        $scope.collections[2].nodes.push(temporal);
        temporal = [];
      }else{
        temporal.push(collection);
      }
    });

    console.log($scope.collections);
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
    console.log(pathClass)
    pathClass = pathClass.split('/')
    pathClass.shift()
    return colourMap[pathClass[0]];
  }

  $timeout(function(){
    $(document).foundation();
  }, 3000);
}]);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC1jb25maWd1cmUuanMiLCJhcHAtcm91dGUuanMiLCJBcHBDb250cm9sbGVyLmpzIiwiQmFubmVyUHJpbmNpcGFsQ29udHJvbGxlci5qcyIsIkJyZWFkQ3J1bWJDb250cm9sbGVyLmpzIiwiRXZlbnRvc0NvbnRyb2xsZXIuanMiLCJMaW5lYURlVGllbXBvQ29udHJvbGxlci5qcyIsIk1lbW9yaWFzT3JhbGVzQ29udHJvbGxlci5qcyIsIk1lbnVDb250cm9sbGVyLmpzIiwiTm90aWNpYXNDb250cm9sbGVyLmpzIiwiT3B1c0NvbnRyb2xsZXIuanMiLCJQYWdlQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG52YXIgYmxhYUFwcCA9IGFuZ3VsYXIubW9kdWxlKCdibGFhQXBwJywgWyduZ1Nhbml0aXplJywnbmdSb3V0ZScsJ25jeS1hbmd1bGFyLWJyZWFkY3J1bWInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICduZ1ByZXR0eUpzb24nLCdjaGllZmZhbmN5cGFudHMubG9hZGluZ0JhcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25nQW5pbWF0ZScsJ25nUHJldHR5SnNvbiddKVxyXG4gICAgLmNvbnN0YW50KCdFTlZJUk9OTUVOVCcsICdodHRwOi8vYmxhYS5kZW1vZGF5c2NyaXB0LmNvbS8nKVxyXG4gICAgLmNvbnN0YW50KCdFTlZJUk9OTUVOVEZST05UJywgJy8nKVxyXG4gICAgLmNvbmZpZyhmdW5jdGlvbihjZnBMb2FkaW5nQmFyUHJvdmlkZXIpIHtcclxuICAgICAgY2ZwTG9hZGluZ0JhclByb3ZpZGVyLmluY2x1ZGVTcGlubmVyID0gdHJ1ZTtcclxuICAgIH0pO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHByaW50KHRleHQsdmFyaWFibGUpe1xyXG4gICAgY29uc29sZS5sb2codGV4dCsnOicrdmFyaWFibGUpO1xyXG59IiwiYmxhYUFwcC5jb25maWcoWyckcm91dGVQcm92aWRlcicsJyRsb2NhdGlvblByb3ZpZGVyJyxmdW5jdGlvbigkcm91dGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCchJyk7XG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuXG4gICAgJHJvdXRlUHJvdmlkZXIud2hlbignLycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdob21lLmh0bWwnXG4gICAgfSlcbiAgICAud2hlbignL2JpYmxpb3RlY2FzL21lbW9yaWFzLW9yYWxlcycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdtZW1vcmlhcy1vcmFsZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdNZW1vcmlhc09yYWxlc0NvbnRyb2xsZXInXG4gICAgfSlcbiAgICAub3RoZXJ3aXNlKHtcbiAgICAgICAgcmVkaXJlY3RUbzogJy80MDQnXG4gICAgfSk7XG4gICAgLy8gY29uZmlndXJlIGh0bWw1IHRvIGdldCBsaW5rcyB3b3JraW5nIG9uIGpzZmlkZGxlXG59XSk7XG5cbi8qYmxhYUFwcC5ydW4oWyckbG9jYXRpb24nLCBmdW5jdGlvbiBBcHBSdW4oJGxvY2F0aW9uKSB7XG4gICAgZGVidWdnZXI7XG59XSk7Ki9cbiIsImJsYWFBcHAuY29udHJvbGxlcignU3VjdXJzYWxDb250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywnJHN0YXRlUGFyYW1zJywgJyRzdGF0ZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUsJHN0YXRlUGFyYW1zLCAkc3RhdGUpe1xyXG4gICAgJHNjb3BlLmJyZWFkY3J1bWJzID0gW11cclxuICAgICRzdGF0ZVBhcmFtcy5zdWN1cnNhbCA/ICAkcm9vdFNjb3BlLnN1Y3Vyc2FsID0gJHN0YXRlUGFyYW1zLnN1Y3Vyc2FsOiRyb290U2NvcGUuc3VjdXJzYWwgPSAnQm9nb3TDoSc7XHJcbiAgICAkc2NvcGUuYnJlYWRjcnVtYnMgPSAnQWN0aXZpZGFkIEN1bHR1cmFsJ1xyXG4gICAgY29uc29sZS5sb2coJ1N1Y3Vyc2FsOicrICRyb290U2NvcGUuc3VjdXJzYWwpO1xyXG59XSlcclxuIiwiYmxhYUFwcC5jb250cm9sbGVyKCdCYW5uZXJQcmluY2lwYWxDb250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywnJHRpbWVvdXQnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlLCR0aW1lb3V0KXtcclxuICAgIHZhciBwYXRoID0gJ2Jhbm5lci9qc29uJztcclxuICAgIHZhciBub2RlO1xyXG4gICAgJHNjb3BlLmJhbm5lcnMgPSB7fTtcclxuICAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAkc2NvcGUuYmFubmVyc1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV0ubm9kZVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1dKTtcclxuIiwiLypTRUNDSU9OIEJSRUFEQ1JVTUIqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ0JyZWFkY3J1bWJDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCwkcm9vdFNjb3BlKSB7XHJcbiAgICBwcmludCgnYnJlYWRjcnVtYicsJGxvY2F0aW9uLnBhdGgoKSk7XHJcbiAgICB2YXIgcGF0aHMgPSB7fTtcclxuICAgIHBhdGhzID0gJGxvY2F0aW9uLnBhdGgoKVxyXG4gICAgJHNjb3BlLmJyZWFkY3J1bWIgPSB7fTtcclxuICAgIHBhdGhzID0gcGF0aHMuc3BsaXQoJy8nKTtcclxuICAgIHBhdGhzLnNoaWZ0KCk7XHJcbiAgICBmb3IoIHZhciBpID0gMDsgaSA8PSBwYXRocy5sZW5ndGgtMTsgaSsrICl7XHJcbiAgICAgICAgcGF0aHMgPT0gXCJcIj8gJHNjb3BlLmJyZWFkY3J1bWJbaV0gPSBwYXRoc1swXTokc2NvcGUuYnJlYWRjcnVtYltpXSA9IHBhdGhzW2ldO1xyXG4gICAgfVxyXG4gICAgJHJvb3RTY29wZS5icmVhZGNydW1iID0gJHNjb3BlLmJyZWFkY3J1bWI7XHJcbn1dKTsgXHJcbiIsIi8qU0VDQ0lPTiBTTElERVIgRVZFTlRPUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignRXZlbnRvc0NvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlKXtcclxuICAgdmFyIHBhdGggPSAnZXZlbnRvc0pTT04nO1xyXG4gICB2YXIgbm9kZTtcclxuICAgJHNjb3BlLmV2ZW50cyA9IHt9O1xyXG4gICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aCkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgJHNjb3BlLmV2ZW50c1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV1bJ25vZGUnXVxyXG4gICAgICAgfVxyXG4gICAgICAgY29uc29sZS5sb2coJHNjb3BlLmV2ZW50cylcclxuICAgfSlcclxufV0pO1xyXG4iLCIvKlNFQ0NJT04gU0xJREVSIEVWRU5UT1MqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ0xpbmVhRGVUaWVtcG9Db250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5UKXtcclxuICAgdmFyIHBhdGggPSAnZXZlbnRvc0pTT04nO1xyXG4gICB2YXIgcGF0aFRpcG9FdmVudG8gPSAndGF4b25vbWlhcy90aXBvZGVldmVudG8vanNvbic7XHJcbiAgIHZhciBub2RlO1xyXG4gICAkc2NvcGUuZXZlbnRzID0ge307XHJcbiAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAkc2NvcGUuZXZlbnRzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICB9XHJcbiAgIH0pXHJcbiAgICRzY29wZS50aXBvRXZlbnRvcyA9IHt9O1xyXG4gICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aFRpcG9FdmVudG8pLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICRzY29wZS50aXBvRXZlbnRvc1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV1bJ25vZGUnXVxyXG4gICAgICAgfVxyXG4gICB9KVxyXG59XSk7XHJcbiIsIi8qXHJcbiAgQmxhYSAtIERheXNjcmlwdFxyXG4gIEJpYmxpb3RlY2EgZGUgY2xhc2VzIHBhcmEgZXN0aWxvc1xyXG4gIGNvcHlyaWd0aCAyMDE2IC0gQm9nb3RhLUNvbG9tYmlhXHJcbiovXHJcbmJsYWFBcHAuY29udHJvbGxlcignTWVtb3JpYXNPcmFsZXNDb250cm9sbGVyJyxbJyRzY29wZScsICckaHR0cCcsICdFTlZJUk9OTUVOVCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIEVOVklST05NRU5UKSB7XHJcbiAgXHJcbiAgJHNjb3BlLmNvbGxlY3Rpb25zID0gW107XHJcblxyXG4gICRodHRwLmdldChFTlZJUk9OTUVOVCsnY29sZWNjaW9uZXMvanNvbicpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgdmFyIHRlbXBvcmFsID0gW107XHJcblxyXG4gICAgJHNjb3BlLmNvbGxlY3Rpb25zLnB1c2goe1xyXG4gICAgICBcInRpdGxlXCI6IFwiTG8gbcOhcyBSZWNpZW50ZVwiLFxyXG4gICAgICBcIm5vZGVzXCI6IFtdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgYW5ndWxhci5mb3JFYWNoKGRhdGEubm9kZXMsIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGtleSkge1xyXG4gICAgICBpZigoa2V5KzEpICUgNCA9PSAwIHx8IGtleSA9PSBkYXRhLm5vZGVzLmxlbmd0aCl7XHJcbiAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb25zWzBdLm5vZGVzLnB1c2godGVtcG9yYWwpO1xyXG4gICAgICAgIHRlbXBvcmFsID0gW107XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIHRlbXBvcmFsLnB1c2goY29sbGVjdGlvbik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pOyBcclxuICAgXHJcbiAgJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb2xlY2Npb25lcy9qc29uL2Rlc3RhY2Fkb3MnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgIHZhciB0ZW1wb3JhbCA9IFtdO1xyXG5cclxuICAgICRzY29wZS5jb2xsZWN0aW9ucy5wdXNoKHtcclxuICAgICAgXCJ0aXRsZVwiOiBcIkxvIG3DoXMgRGVzdGFjYWRvXCIsXHJcbiAgICAgIFwibm9kZXNcIjogW10sXHJcbiAgICB9KTtcclxuXHJcbiAgICBhbmd1bGFyLmZvckVhY2goZGF0YS5ub2RlcywgZnVuY3Rpb24oY29sbGVjdGlvbiwga2V5KSB7XHJcbiAgICAgIGlmKChrZXkrMSkgJSA0ID09IDAgfHwga2V5ID09IGRhdGEubm9kZXMubGVuZ3RoKXtcclxuICAgICAgICAkc2NvcGUuY29sbGVjdGlvbnNbMV0ubm9kZXMucHVzaCh0ZW1wb3JhbCk7XHJcbiAgICAgICAgdGVtcG9yYWwgPSBbXTtcclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgdGVtcG9yYWwucHVzaChjb2xsZWN0aW9uKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7ICAgXHJcblxyXG4gICRodHRwLmdldChFTlZJUk9OTUVOVCsnY29sZWNjaW9uZXMvanNvbi9wb3B1bGFyZXMnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgIHZhciB0ZW1wb3JhbCA9IFtdO1xyXG5cclxuICAgICRzY29wZS5jb2xsZWN0aW9ucy5wdXNoKHtcclxuICAgICAgXCJ0aXRsZVwiOiBcIkxvIG3DoXMgUG9wdWxhclwiLFxyXG4gICAgICBcIm5vZGVzXCI6IFtdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgYW5ndWxhci5mb3JFYWNoKGRhdGEubm9kZXMsIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGtleSkge1xyXG4gICAgICBpZigoa2V5KzEpICUgNCA9PSAwIHx8IGtleSA9PSBkYXRhLm5vZGVzLmxlbmd0aCl7XHJcbiAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb25zWzJdLm5vZGVzLnB1c2godGVtcG9yYWwpO1xyXG4gICAgICAgIHRlbXBvcmFsID0gW107XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIHRlbXBvcmFsLnB1c2goY29sbGVjdGlvbik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCRzY29wZS5jb2xsZWN0aW9ucyk7XHJcbiAgfSk7XHJcblxyXG5cclxufV0pO1xyXG4iLCIvKlNFQ0NJT04gTUVOVVMqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ01lbnVDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCAnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdFTlZJUk9OTUVOVEZST05UJywnJHJvb3RTY29wZScsXHJcbiAgICBmdW5jdGlvbiAoICRzY29wZSwgJGh0dHAsICRsb2NhdGlvbixFTlZJUk9OTUVOVCxFTlZJUk9OTUVOVEZST05ULCRyb290U2NvcGUpIHtcclxuICAgICAgICB2YXIgYnJlYWRjcnVtYjtcclxuICAgICAgICAkbG9jYXRpb24ucGF0aCgpID09ICcvJyA/ICRzY29wZS5wYXRoID0gJy8nOiRzY29wZS5wYXRoID0gJGxvY2F0aW9uLnBhdGgoKVxyXG4gICAgICAgIFxyXG4gICAgICAgICRodHRwLmdldChFTlZJUk9OTUVOVEZST05UKydhc3NldHMvZGF0YS9NZW51X3ByaW5jaXBhbC5qcycpLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgJHNjb3BlLm1lbnUgPSBkYXRhLm5vZGVzWzBdO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUubWVudSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJGh0dHAuZ2V0KEVOVklST05NRU5UKydzdWN1cnNhbGVzL2pzb24nKS5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhLm5vZGVzWzJdO1xyXG4gICAgICAgICAgICAkc2NvcGUuc3VjdXJzYWxlcyA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgICAgICAgICB2YXIgbm9kZTtcclxuICAgICAgICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAgICAgICRzY29wZS5zdWN1cnNhbGVzW2NvdW50XSA9IGRhdGEubm9kZXNbbm9kZV07XHJcbiAgICAgICAgICAgICAgICBjb3VudCArKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLnN1Y3Vyc2FsZXMgPSAkc2NvcGUuc3VjdXJzYWxlcztcclxuICAgICAgICB9KTtcclxuICAgICAgICAkc2NvcGUub25DaGFuZ2VDaXVkYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIHBhdGhzPXt9XHJcbiAgICAgICAgICAgIHZhciBwYXRoO1xyXG4gICAgICAgICAgICBwYXRoID0gJGxvY2F0aW9uLnBhdGgoKVxyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLnN1Y3Vyc2FsID0gJHNjb3BlLnN1Y3Vyc2FsO1xyXG4gICAgICAgICAgICAkbG9jYXRpb24ucGF0aChwYXRoICsgJHJvb3RTY29wZS5zdWN1cnNhbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICB9XSk7XHJcbiIsIi8qU0VDQ0lPTiBOT1RJQ0lBUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignTm90aWNpYXNDb250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCwgJHJvb3RTY29wZSl7XHJcbiAgICB2YXIgcGF0aCA9ICdhcnRpY3Vsb3NKU09OJztcclxuICAgIHZhciBub2RlO1xyXG4gICAgJHNjb3BlLmFydGljbGVzID0ge307XHJcbiAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aCkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICAkc2NvcGUuYXJ0aWNsZXNbbm9kZV0gPSBkYXRhLm5vZGVzW25vZGVdWydub2RlJ11cclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XSk7XHJcbiIsIi8qU0VDQ0lPTiBPUFVTKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdPcHVzQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywnRU5WSVJPTk1FTlQnLCBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCwgRU5WSVJPTk1FTlQpIHtcclxuICAgICRodHRwLmdldChFTlZJUk9OTUVOVCsnY29uY2llcnRvcy9qc29uJykuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICRzY29wZS5jb25jZXJ0cyA9IGRhdGEubm9kZXM7XHJcbiAgICB9KTtcclxuXHJcbn1dKTtcclxuIiwiLypcclxuICBCbGFhIC0gRGF5c2NyaXB0XHJcbiAgQmlibGlvdGVjYSBkZSBjbGFzZXMgcGFyYSBlc3RpbG9zXHJcbiAgY29weXJpZ3RoIDIwMTYgLSBCb2dvdGEtQ29sb21iaWFcclxuKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdQYWdlQ29udHJvbGxlcicsWyckc2NvcGUnLCckbG9nJywnJGxvY2F0aW9uJywgJyR0aW1lb3V0JyAsZnVuY3Rpb24oJHNjb3BlLCAkbG9nLCAkbG9jYXRpb24sICR0aW1lb3V0KSB7XHJcblxyXG4gIHZhciBjb2xvdXJNYXAgPSB7XHJcbiAgICBpbmRleCA6ICdjSW5kZXgnLFxyXG4gICAgYmlibGlvdGVjYXM6IFwiY0JpYmxpb1wiLFxyXG4gIH07XHJcblxyXG4gICRzY29wZS5HZXRDbGFzcyA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgcGF0aENsYXNzID0gJGxvY2F0aW9uLnBhdGgoKVxyXG4gICAgY29uc29sZS5sb2cocGF0aENsYXNzKVxyXG4gICAgcGF0aENsYXNzID0gcGF0aENsYXNzLnNwbGl0KCcvJylcclxuICAgIHBhdGhDbGFzcy5zaGlmdCgpXHJcbiAgICByZXR1cm4gY29sb3VyTWFwW3BhdGhDbGFzc1swXV07XHJcbiAgfVxyXG5cclxuICAkdGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgJChkb2N1bWVudCkuZm91bmRhdGlvbigpO1xyXG4gIH0sIDMwMDApO1xyXG59XSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
