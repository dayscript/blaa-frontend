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

  var path = 'colecciones/json'

  $http.get(ENVIRONMENT+path).success(function(data) {
    $scope.collections = [];
    var temporal = [];

    angular.forEach(data.nodes, function(collection, key) {

      console.log(key);
      if((key+1) % 4 == 0){
        $scope.collections.push(temporal);
        temporal = [];
      }else{
        temporal.push(collection);
      }

    });
    console.log($scope.collections);
  });

  // $timeout(function(){
  //   $(document).foundation();
  // }, 3000);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC1jb25maWd1cmUuanMiLCJhcHAtcm91dGUuanMiLCJBcHBDb250cm9sbGVyLmpzIiwiQmFubmVyUHJpbmNpcGFsQ29udHJvbGxlci5qcyIsIkJyZWFkQ3J1bWJDb250cm9sbGVyLmpzIiwiRXZlbnRvc0NvbnRyb2xsZXIuanMiLCJMaW5lYURlVGllbXBvQ29udHJvbGxlci5qcyIsIk1lbW9yaWFzT3JhbGVzQ29udHJvbGxlci5qcyIsIk1lbnVDb250cm9sbGVyLmpzIiwiTm90aWNpYXNDb250cm9sbGVyLmpzIiwiT3B1c0NvbnRyb2xsZXIuanMiLCJQYWdlQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG52YXIgYmxhYUFwcCA9IGFuZ3VsYXIubW9kdWxlKCdibGFhQXBwJywgWyduZ1Nhbml0aXplJywnbmdSb3V0ZScsJ25jeS1hbmd1bGFyLWJyZWFkY3J1bWInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICduZ1ByZXR0eUpzb24nLCdjaGllZmZhbmN5cGFudHMubG9hZGluZ0JhcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25nQW5pbWF0ZScsJ25nUHJldHR5SnNvbiddKVxyXG4gICAgLmNvbnN0YW50KCdFTlZJUk9OTUVOVCcsICdodHRwOi8vYmxhYS5kZW1vZGF5c2NyaXB0LmNvbS8nKVxyXG4gICAgLmNvbnN0YW50KCdFTlZJUk9OTUVOVEZST05UJywgJy8nKVxyXG4gICAgLmNvbmZpZyhmdW5jdGlvbihjZnBMb2FkaW5nQmFyUHJvdmlkZXIpIHtcclxuICAgICAgY2ZwTG9hZGluZ0JhclByb3ZpZGVyLmluY2x1ZGVTcGlubmVyID0gdHJ1ZTtcclxuICAgIH0pO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHByaW50KHRleHQsdmFyaWFibGUpe1xyXG4gICAgY29uc29sZS5sb2codGV4dCsnOicrdmFyaWFibGUpO1xyXG59IiwiYmxhYUFwcC5jb25maWcoWyckcm91dGVQcm92aWRlcicsJyRsb2NhdGlvblByb3ZpZGVyJyxmdW5jdGlvbigkcm91dGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCchJyk7XG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuXG4gICAgJHJvdXRlUHJvdmlkZXIud2hlbignLycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdob21lLmh0bWwnXG4gICAgfSlcbiAgICAud2hlbignL2JpYmxpb3RlY2FzL21lbW9yaWFzLW9yYWxlcycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdtZW1vcmlhcy1vcmFsZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdNZW1vcmlhc09yYWxlc0NvbnRyb2xsZXInXG4gICAgfSlcbiAgICAub3RoZXJ3aXNlKHtcbiAgICAgICAgcmVkaXJlY3RUbzogJy80MDQnXG4gICAgfSk7XG4gICAgLy8gY29uZmlndXJlIGh0bWw1IHRvIGdldCBsaW5rcyB3b3JraW5nIG9uIGpzZmlkZGxlXG59XSk7XG5cbi8qYmxhYUFwcC5ydW4oWyckbG9jYXRpb24nLCBmdW5jdGlvbiBBcHBSdW4oJGxvY2F0aW9uKSB7XG4gICAgZGVidWdnZXI7XG59XSk7Ki9cbiIsImJsYWFBcHAuY29udHJvbGxlcignU3VjdXJzYWxDb250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywnJHN0YXRlUGFyYW1zJywgJyRzdGF0ZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUsJHN0YXRlUGFyYW1zLCAkc3RhdGUpe1xyXG4gICAgJHNjb3BlLmJyZWFkY3J1bWJzID0gW11cclxuICAgICRzdGF0ZVBhcmFtcy5zdWN1cnNhbCA/ICAkcm9vdFNjb3BlLnN1Y3Vyc2FsID0gJHN0YXRlUGFyYW1zLnN1Y3Vyc2FsOiRyb290U2NvcGUuc3VjdXJzYWwgPSAnQm9nb3TDoSc7XHJcbiAgICAkc2NvcGUuYnJlYWRjcnVtYnMgPSAnQWN0aXZpZGFkIEN1bHR1cmFsJ1xyXG4gICAgY29uc29sZS5sb2coJ1N1Y3Vyc2FsOicrICRyb290U2NvcGUuc3VjdXJzYWwpO1xyXG59XSlcclxuIiwiYmxhYUFwcC5jb250cm9sbGVyKCdCYW5uZXJQcmluY2lwYWxDb250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywnJHRpbWVvdXQnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlLCR0aW1lb3V0KXtcclxuICAgIHZhciBwYXRoID0gJ2Jhbm5lci9qc29uJztcclxuICAgIHZhciBub2RlO1xyXG4gICAgJHNjb3BlLmJhbm5lcnMgPSB7fTtcclxuICAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAkc2NvcGUuYmFubmVyc1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV0ubm9kZVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1dKTtcclxuIiwiLypTRUNDSU9OIEJSRUFEQ1JVTUIqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ0JyZWFkY3J1bWJDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCwkcm9vdFNjb3BlKSB7XHJcbiAgICBwcmludCgnYnJlYWRjcnVtYicsJGxvY2F0aW9uLnBhdGgoKSk7XHJcbiAgICB2YXIgcGF0aHMgPSB7fTtcclxuICAgIHBhdGhzID0gJGxvY2F0aW9uLnBhdGgoKVxyXG4gICAgJHNjb3BlLmJyZWFkY3J1bWIgPSB7fTtcclxuICAgIHBhdGhzID0gcGF0aHMuc3BsaXQoJy8nKTtcclxuICAgIHBhdGhzLnNoaWZ0KCk7XHJcbiAgICBmb3IoIHZhciBpID0gMDsgaSA8PSBwYXRocy5sZW5ndGgtMTsgaSsrICl7XHJcbiAgICAgICAgcGF0aHMgPT0gXCJcIj8gJHNjb3BlLmJyZWFkY3J1bWJbaV0gPSBwYXRoc1swXTokc2NvcGUuYnJlYWRjcnVtYltpXSA9IHBhdGhzW2ldO1xyXG4gICAgfVxyXG4gICAgJHJvb3RTY29wZS5icmVhZGNydW1iID0gJHNjb3BlLmJyZWFkY3J1bWI7XHJcbn1dKTsgXHJcbiIsIi8qU0VDQ0lPTiBTTElERVIgRVZFTlRPUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignRXZlbnRvc0NvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlKXtcclxuICAgdmFyIHBhdGggPSAnZXZlbnRvc0pTT04nO1xyXG4gICB2YXIgbm9kZTtcclxuICAgJHNjb3BlLmV2ZW50cyA9IHt9O1xyXG4gICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aCkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgJHNjb3BlLmV2ZW50c1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV1bJ25vZGUnXVxyXG4gICAgICAgfVxyXG4gICAgICAgY29uc29sZS5sb2coJHNjb3BlLmV2ZW50cylcclxuICAgfSlcclxufV0pO1xyXG4iLCIvKlNFQ0NJT04gU0xJREVSIEVWRU5UT1MqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ0xpbmVhRGVUaWVtcG9Db250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5UKXtcclxuICAgdmFyIHBhdGggPSAnZXZlbnRvc0pTT04nO1xyXG4gICB2YXIgcGF0aFRpcG9FdmVudG8gPSAndGF4b25vbWlhcy90aXBvZGVldmVudG8vanNvbic7XHJcbiAgIHZhciBub2RlO1xyXG4gICAkc2NvcGUuZXZlbnRzID0ge307XHJcbiAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAkc2NvcGUuZXZlbnRzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICB9XHJcbiAgIH0pXHJcbiAgICRzY29wZS50aXBvRXZlbnRvcyA9IHt9O1xyXG4gICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aFRpcG9FdmVudG8pLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICRzY29wZS50aXBvRXZlbnRvc1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV1bJ25vZGUnXVxyXG4gICAgICAgfVxyXG4gICB9KVxyXG59XSk7XHJcbiIsIi8qXHJcbiAgQmxhYSAtIERheXNjcmlwdFxyXG4gIEJpYmxpb3RlY2EgZGUgY2xhc2VzIHBhcmEgZXN0aWxvc1xyXG4gIGNvcHlyaWd0aCAyMDE2IC0gQm9nb3RhLUNvbG9tYmlhXHJcbiovXHJcbmJsYWFBcHAuY29udHJvbGxlcignTWVtb3JpYXNPcmFsZXNDb250cm9sbGVyJyxbJyRzY29wZScsICckaHR0cCcsICdFTlZJUk9OTUVOVCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIEVOVklST05NRU5UKSB7XHJcblxyXG4gIHZhciBwYXRoID0gJ2NvbGVjY2lvbmVzL2pzb24nXHJcblxyXG4gICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICRzY29wZS5jb2xsZWN0aW9ucyA9IFtdO1xyXG4gICAgdmFyIHRlbXBvcmFsID0gW107XHJcblxyXG4gICAgYW5ndWxhci5mb3JFYWNoKGRhdGEubm9kZXMsIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGtleSkge1xyXG5cclxuICAgICAgY29uc29sZS5sb2coa2V5KTtcclxuICAgICAgaWYoKGtleSsxKSAlIDQgPT0gMCl7XHJcbiAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb25zLnB1c2godGVtcG9yYWwpO1xyXG4gICAgICAgIHRlbXBvcmFsID0gW107XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIHRlbXBvcmFsLnB1c2goY29sbGVjdGlvbik7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuICAgIGNvbnNvbGUubG9nKCRzY29wZS5jb2xsZWN0aW9ucyk7XHJcbiAgfSk7XHJcblxyXG4gIC8vICR0aW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgLy8gICAkKGRvY3VtZW50KS5mb3VuZGF0aW9uKCk7XHJcbiAgLy8gfSwgMzAwMCk7XHJcbn1dKTtcclxuIiwiLypTRUNDSU9OIE1FTlVTKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdNZW51Q29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywgJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnRU5WSVJPTk1FTlRGUk9OVCcsJyRyb290U2NvcGUnLFxyXG4gICAgZnVuY3Rpb24gKCAkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sRU5WSVJPTk1FTlQsRU5WSVJPTk1FTlRGUk9OVCwkcm9vdFNjb3BlKSB7XHJcbiAgICAgICAgdmFyIGJyZWFkY3J1bWI7XHJcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoKSA9PSAnLycgPyAkc2NvcGUucGF0aCA9ICcvJzokc2NvcGUucGF0aCA9ICRsb2NhdGlvbi5wYXRoKClcclxuICAgICAgICBcclxuICAgICAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlRGUk9OVCsnYXNzZXRzL2RhdGEvTWVudV9wcmluY2lwYWwuanMnKS5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5tZW51ID0gZGF0YS5ub2Rlc1swXTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJHNjb3BlLm1lbnUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRodHRwLmdldChFTlZJUk9OTUVOVCsnc3VjdXJzYWxlcy9qc29uJykuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICBkZWxldGUgZGF0YS5ub2Rlc1syXTtcclxuICAgICAgICAgICAgJHNjb3BlLnN1Y3Vyc2FsZXMgPSBbXTtcclxuICAgICAgICAgICAgdmFyIGNvdW50ID0gMDtcclxuICAgICAgICAgICAgdmFyIG5vZGU7XHJcbiAgICAgICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3VjdXJzYWxlc1tjb3VudF0gPSBkYXRhLm5vZGVzW25vZGVdO1xyXG4gICAgICAgICAgICAgICAgY291bnQgKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJHJvb3RTY29wZS5zdWN1cnNhbGVzID0gJHNjb3BlLnN1Y3Vyc2FsZXM7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJHNjb3BlLm9uQ2hhbmdlQ2l1ZGFkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXRocz17fVxyXG4gICAgICAgICAgICB2YXIgcGF0aDtcclxuICAgICAgICAgICAgcGF0aCA9ICRsb2NhdGlvbi5wYXRoKClcclxuICAgICAgICAgICAgJHJvb3RTY29wZS5zdWN1cnNhbCA9ICRzY29wZS5zdWN1cnNhbDtcclxuICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgocGF0aCArICRyb290U2NvcGUuc3VjdXJzYWwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgfV0pO1xyXG4iLCIvKlNFQ0NJT04gTk9USUNJQVMqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ05vdGljaWFzQ29udHJvbGxlcicsWyckc2NvcGUnLCckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUpe1xyXG4gICAgdmFyIHBhdGggPSAnYXJ0aWN1bG9zSlNPTic7XHJcbiAgICB2YXIgbm9kZTtcclxuICAgICRzY29wZS5hcnRpY2xlcyA9IHt9O1xyXG4gICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGgpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAgJHNjb3BlLmFydGljbGVzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufV0pO1xyXG4iLCIvKlNFQ0NJT04gT1BVUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignT3B1c0NvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsJ0VOVklST05NRU5UJywgZnVuY3Rpb24gKCRzY29wZSwgJGh0dHAsIEVOVklST05NRU5UKSB7XHJcbiAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrJ2NvbmNpZXJ0b3MvanNvbicpLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAkc2NvcGUuY29uY2VydHMgPSBkYXRhLm5vZGVzO1xyXG4gICAgfSk7XHJcblxyXG59XSk7XHJcbiIsIi8qXHJcbiAgQmxhYSAtIERheXNjcmlwdFxyXG4gIEJpYmxpb3RlY2EgZGUgY2xhc2VzIHBhcmEgZXN0aWxvc1xyXG4gIGNvcHlyaWd0aCAyMDE2IC0gQm9nb3RhLUNvbG9tYmlhXHJcbiovXHJcbmJsYWFBcHAuY29udHJvbGxlcignUGFnZUNvbnRyb2xsZXInLFsnJHNjb3BlJywnJGxvZycsJyRsb2NhdGlvbicsICckdGltZW91dCcgLGZ1bmN0aW9uKCRzY29wZSwgJGxvZywgJGxvY2F0aW9uLCAkdGltZW91dCkge1xyXG5cclxuICB2YXIgY29sb3VyTWFwID0ge1xyXG4gICAgaW5kZXggOiAnY0luZGV4JyxcclxuICAgIGJpYmxpb3RlY2FzOiBcImNCaWJsaW9cIixcclxuICB9O1xyXG5cclxuICAkc2NvcGUuR2V0Q2xhc3MgPSBmdW5jdGlvbigpe1xyXG4gICAgdmFyIHBhdGhDbGFzcyA9ICRsb2NhdGlvbi5wYXRoKClcclxuICAgIGNvbnNvbGUubG9nKHBhdGhDbGFzcylcclxuICAgIHBhdGhDbGFzcyA9IHBhdGhDbGFzcy5zcGxpdCgnLycpXHJcbiAgICBwYXRoQ2xhc3Muc2hpZnQoKVxyXG4gICAgcmV0dXJuIGNvbG91ck1hcFtwYXRoQ2xhc3NbMF1dO1xyXG4gIH1cclxuXHJcbiAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICQoZG9jdW1lbnQpLmZvdW5kYXRpb24oKTtcclxuICB9LCAzMDAwKTtcclxufV0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
