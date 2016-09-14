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
        templateUrl: '/bibliotecas/memorias-orales/memorias-orales.html',
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
      if( (key+1) %  4 == 0 || key == data.nodes.length){
        slider.nodes.push(temporal);
        temporal = [];
      }else{
        collection.links = collection.links.split(',')
        collection.color = {'background-color':collection.color}
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
        collection.links = collection.links.split(',')
        collection.color = {'background-color':collection.color}

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
        collection.links = collection.links.split(',')
        collection.color = {'background-color':collection.color}
        temporal.push(collection);
      }
    });
    $scope.collections.push(slider);

  }));
  console.log($scope.collections)

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
            //console.log($scope.menu);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC1jb25maWd1cmUuanMiLCJhcHAtcm91dGUuanMiLCJBcHBDb250cm9sbGVyLmpzIiwiQmFubmVyUHJpbmNpcGFsQ29udHJvbGxlci5qcyIsIkJyZWFkQ3J1bWJDb250cm9sbGVyLmpzIiwiRXZlbnRvc0NvbnRyb2xsZXIuanMiLCJMaW5lYURlVGllbXBvQ29udHJvbGxlci5qcyIsIk1lbW9yaWFzT3JhbGVzQ29udHJvbGxlci5qcyIsIk1lbnVDb250cm9sbGVyLmpzIiwiTm90aWNpYXNDb250cm9sbGVyLmpzIiwiT3B1c0NvbnRyb2xsZXIuanMiLCJQYWdlQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG52YXIgYmxhYUFwcCA9IGFuZ3VsYXIubW9kdWxlKCdibGFhQXBwJywgWyduZ1Nhbml0aXplJywnbmdSb3V0ZScsJ25jeS1hbmd1bGFyLWJyZWFkY3J1bWInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdQcmV0dHlKc29uJywnY2hpZWZmYW5jeXBhbnRzLmxvYWRpbmdCYXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdBbmltYXRlJywnbmdQcmV0dHlKc29uJ10pXG4gICAgLmNvbnN0YW50KCdFTlZJUk9OTUVOVCcsICdodHRwOi8vYmxhYS5kZW1vZGF5c2NyaXB0LmNvbS8nKVxuICAgIC5jb25zdGFudCgnRU5WSVJPTk1FTlRGUk9OVCcsICcvJylcbiAgICAuY29uZmlnKGZ1bmN0aW9uKGNmcExvYWRpbmdCYXJQcm92aWRlcikge1xuICAgICAgY2ZwTG9hZGluZ0JhclByb3ZpZGVyLmluY2x1ZGVTcGlubmVyID0gdHJ1ZTtcbiAgICB9KTtcblxuXG5mdW5jdGlvbiBwcmludCh0ZXh0LHZhcmlhYmxlKXtcbiAgICBjb25zb2xlLmxvZyh0ZXh0Kyc6Jyt2YXJpYWJsZSk7XG59IiwiYmxhYUFwcC5jb25maWcoWyckcm91dGVQcm92aWRlcicsJyRsb2NhdGlvblByb3ZpZGVyJyxmdW5jdGlvbigkcm91dGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCchJyk7XG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuXG4gICAgJHJvdXRlUHJvdmlkZXIud2hlbignLycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdob21lLmh0bWwnXG4gICAgfSlcbiAgICAud2hlbignL2JpYmxpb3RlY2FzL21lbW9yaWFzLW9yYWxlcycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICcvYmlibGlvdGVjYXMvbWVtb3JpYXMtb3JhbGVzL21lbW9yaWFzLW9yYWxlcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ01lbW9yaWFzT3JhbGVzQ29udHJvbGxlcidcbiAgICB9KVxuICAgICAgICAud2hlbignL2JpYmxpb3RlY2FzL21lbW9yaWFzLW9yYWxlcy9ub3RpY2lhcycsIHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnbm90aWNpYXMuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnTWVtb3JpYXNPcmFsZXNDb250cm9sbGVyJ1xuICAgICAgICB9KVxuICAgIC5vdGhlcndpc2Uoe1xuICAgICAgICByZWRpcmVjdFRvOiAnLzQwNCdcbiAgICB9KTtcbiAgICAvLyBjb25maWd1cmUgaHRtbDUgdG8gZ2V0IGxpbmtzIHdvcmtpbmcgb24ganNmaWRkbGVcbn1dKTtcblxuLypibGFhQXBwLnJ1bihbJyRsb2NhdGlvbicsIGZ1bmN0aW9uIEFwcFJ1bigkbG9jYXRpb24pIHtcbiAgICBkZWJ1Z2dlcjtcbn1dKTsqL1xuIiwiYmxhYUFwcC5jb250cm9sbGVyKCdTdWN1cnNhbENvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCckc3RhdGVQYXJhbXMnLCAnJHN0YXRlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCwgJHJvb3RTY29wZSwkc3RhdGVQYXJhbXMsICRzdGF0ZSl7XG4gICAgJHNjb3BlLmJyZWFkY3J1bWJzID0gW11cbiAgICAkc3RhdGVQYXJhbXMuc3VjdXJzYWwgPyAgJHJvb3RTY29wZS5zdWN1cnNhbCA9ICRzdGF0ZVBhcmFtcy5zdWN1cnNhbDokcm9vdFNjb3BlLnN1Y3Vyc2FsID0gJ0JvZ290w6EnO1xuICAgICRzY29wZS5icmVhZGNydW1icyA9ICdBY3RpdmlkYWQgQ3VsdHVyYWwnXG4gICAgY29uc29sZS5sb2coJ1N1Y3Vyc2FsOicrICRyb290U2NvcGUuc3VjdXJzYWwpO1xufV0pXG4iLCJibGFhQXBwLmNvbnRyb2xsZXIoJ0Jhbm5lclByaW5jaXBhbENvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCckdGltZW91dCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUsJHRpbWVvdXQpe1xyXG4gICAgdmFyIHBhdGggPSAnYmFubmVyL2pzb24nO1xyXG4gICAgdmFyIG5vZGU7XHJcbiAgICAkc2NvcGUuYmFubmVycyA9IHt9O1xyXG4gICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGgpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICRzY29wZS5iYW5uZXJzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXS5ub2RlXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufV0pO1xyXG4iLCIvKlNFQ0NJT04gQlJFQURDUlVNQiovXHJcbmJsYWFBcHAuY29udHJvbGxlcignQnJlYWRjcnVtYkNvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCRyb290U2NvcGUpIHtcclxuICAgIHByaW50KCdicmVhZGNydW1iJywkbG9jYXRpb24ucGF0aCgpKTtcclxuICAgIHZhciBwYXRocyA9IHt9O1xyXG4gICAgcGF0aHMgPSAkbG9jYXRpb24ucGF0aCgpXHJcbiAgICAkc2NvcGUuYnJlYWRjcnVtYiA9IHt9O1xyXG4gICAgcGF0aHMgPSBwYXRocy5zcGxpdCgnLycpO1xyXG4gICAgcGF0aHMuc2hpZnQoKTtcclxuICAgIGZvciggdmFyIGkgPSAwOyBpIDw9IHBhdGhzLmxlbmd0aC0xOyBpKysgKXtcclxuICAgICAgICBwYXRocyA9PSBcIlwiPyAkc2NvcGUuYnJlYWRjcnVtYltpXSA9IHBhdGhzWzBdOiRzY29wZS5icmVhZGNydW1iW2ldID0gcGF0aHNbaV07XHJcbiAgICB9XHJcbiAgICAkcm9vdFNjb3BlLmJyZWFkY3J1bWIgPSAkc2NvcGUuYnJlYWRjcnVtYjtcclxufV0pOyBcclxuIiwiLypTRUNDSU9OIFNMSURFUiBFVkVOVE9TKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdFdmVudG9zQ29udHJvbGxlcicsWyckc2NvcGUnLCckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUpe1xyXG4gICB2YXIgcGF0aCA9ICdldmVudG9zSlNPTic7XHJcbiAgIHZhciBub2RlO1xyXG4gICAkc2NvcGUuZXZlbnRzID0ge307XHJcbiAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAkc2NvcGUuZXZlbnRzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICB9XHJcbiAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuZXZlbnRzKVxyXG4gICB9KVxyXG59XSk7XHJcbiIsIi8qU0VDQ0lPTiBTTElERVIgRVZFTlRPUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignTGluZWFEZVRpZW1wb0NvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQpe1xyXG4gICB2YXIgcGF0aCA9ICdldmVudG9zSlNPTic7XHJcbiAgIHZhciBwYXRoVGlwb0V2ZW50byA9ICd0YXhvbm9taWFzL3RpcG9kZWV2ZW50by9qc29uJztcclxuICAgdmFyIG5vZGU7XHJcbiAgICRzY29wZS5ldmVudHMgPSB7fTtcclxuICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGgpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICRzY29wZS5ldmVudHNbbm9kZV0gPSBkYXRhLm5vZGVzW25vZGVdWydub2RlJ11cclxuICAgICAgIH1cclxuICAgfSlcclxuICAgJHNjb3BlLnRpcG9FdmVudG9zID0ge307XHJcbiAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoVGlwb0V2ZW50bykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgJHNjb3BlLnRpcG9FdmVudG9zW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICB9XHJcbiAgIH0pXHJcbn1dKTtcclxuIiwiLypcbiAgQmxhYSAtIERheXNjcmlwdFxuICBCaWJsaW90ZWNhIGRlIGNsYXNlcyBwYXJhIGVzdGlsb3NcbiAgY29weXJpZ3RoIDIwMTYgLSBCb2dvdGEtQ29sb21iaWFcbiovXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ01lbW9yaWFzT3JhbGVzQ29udHJvbGxlcicsWyckc2NvcGUnLCAnJGh0dHAnLCAnRU5WSVJPTk1FTlQnLCckdGltZW91dCcsICckcScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIEVOVklST05NRU5ULCAkdGltZW91dCwgJHEpIHtcblxuICAkc2NvcGUuY29sbGVjdGlvbnMgPSBbXTtcblxuICB2YXIgcHJvbWlzZXMgPSBbXTtcbiAgcHJvbWlzZXMucHVzaCgkaHR0cC5nZXQoRU5WSVJPTk1FTlQrJ2NvbGVjY2lvbmVzL2pzb24vbWFzLXJlY2llbnRlcy9NZW1vcmlhIG9yYWwnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgdGVtcG9yYWwgPSBbXTtcbiAgICB2YXIgc2xpZGVyID0ge1xuICAgICAgXCJ0aXRsZVwiOiBcIkxvIG3DoXMgUmVjaWVudGVcIixcbiAgICAgIFwibm9kZXNcIjogW11cbiAgICB9O1xuXG4gICAgYW5ndWxhci5mb3JFYWNoKGRhdGEubm9kZXMsIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGtleSkge1xuICAgICAgaWYoIChrZXkrMSkgJSAgNCA9PSAwIHx8IGtleSA9PSBkYXRhLm5vZGVzLmxlbmd0aCl7XG4gICAgICAgIHNsaWRlci5ub2Rlcy5wdXNoKHRlbXBvcmFsKTtcbiAgICAgICAgdGVtcG9yYWwgPSBbXTtcbiAgICAgIH1lbHNle1xuICAgICAgICBjb2xsZWN0aW9uLmxpbmtzID0gY29sbGVjdGlvbi5saW5rcy5zcGxpdCgnLCcpXG4gICAgICAgIGNvbGxlY3Rpb24uY29sb3IgPSB7J2JhY2tncm91bmQtY29sb3InOmNvbGxlY3Rpb24uY29sb3J9XG4gICAgICAgIHRlbXBvcmFsLnB1c2goY29sbGVjdGlvbik7XG5cbiAgICAgIH1cbiAgICB9KTtcblxuICAgICRzY29wZS5jb2xsZWN0aW9ucy5wdXNoKHNsaWRlcik7XG4gIH0pKTtcblxuICBwcm9taXNlcy5wdXNoKCRodHRwLmdldChFTlZJUk9OTUVOVCsnY29sZWNjaW9uZXMvanNvbi9tYXMtZGVzdGFjYWRvcy9NZW1vcmlhIG9yYWwnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgdGVtcG9yYWwgPSBbXTtcbiAgICB2YXIgc2xpZGVyID0ge1xuICAgICAgXCJ0aXRsZVwiOiBcIkxvIG3DoXMgRGVzdGFjYWRvXCIsXG4gICAgICBcIm5vZGVzXCI6IFtdXG4gICAgfTtcblxuICAgIGFuZ3VsYXIuZm9yRWFjaChkYXRhLm5vZGVzLCBmdW5jdGlvbihjb2xsZWN0aW9uLCBrZXkpIHtcbiAgICAgIGlmKChrZXkrMSkgJSA0ID09IDAgfHwga2V5ID09IGRhdGEubm9kZXMubGVuZ3RoKXtcbiAgICAgICAgc2xpZGVyLm5vZGVzLnB1c2godGVtcG9yYWwpO1xuICAgICAgICB0ZW1wb3JhbCA9IFtdO1xuICAgICAgfWVsc2V7XG4gICAgICAgIGNvbGxlY3Rpb24ubGlua3MgPSBjb2xsZWN0aW9uLmxpbmtzLnNwbGl0KCcsJylcbiAgICAgICAgY29sbGVjdGlvbi5jb2xvciA9IHsnYmFja2dyb3VuZC1jb2xvcic6Y29sbGVjdGlvbi5jb2xvcn1cblxuICAgICAgICB0ZW1wb3JhbC5wdXNoKGNvbGxlY3Rpb24pO1xuICAgICAgfVxuICAgIH0pO1xuICAgICRzY29wZS5jb2xsZWN0aW9ucy5wdXNoKHNsaWRlcik7XG4gIH0pKTtcblxuICBwcm9taXNlcy5wdXNoKCRodHRwLmdldChFTlZJUk9OTUVOVCsnY29sZWNjaW9uZXMvanNvbi9tYXMtcG9wdWxhcmVzL01lbW9yaWEgb3JhbCcpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciB0ZW1wb3JhbCA9IFtdO1xuICAgIHZhciBzbGlkZXIgPSB7XG4gICAgICBcInRpdGxlXCI6IFwiTG8gbcOhcyBQb3B1bGFyXCIsXG4gICAgICBcIm5vZGVzXCI6IFtdXG4gICAgfTtcblxuICAgIGFuZ3VsYXIuZm9yRWFjaChkYXRhLm5vZGVzLCBmdW5jdGlvbihjb2xsZWN0aW9uLCBrZXkpIHtcbiAgICAgIGlmKChrZXkrMSkgJSA0ID09IDAgfHwga2V5ID09IGRhdGEubm9kZXMubGVuZ3RoKXtcbiAgICAgICAgc2xpZGVyLm5vZGVzLnB1c2godGVtcG9yYWwpO1xuICAgICAgICB0ZW1wb3JhbCA9IFtdO1xuICAgICAgfWVsc2V7XG4gICAgICAgIGNvbGxlY3Rpb24ubGlua3MgPSBjb2xsZWN0aW9uLmxpbmtzLnNwbGl0KCcsJylcbiAgICAgICAgY29sbGVjdGlvbi5jb2xvciA9IHsnYmFja2dyb3VuZC1jb2xvcic6Y29sbGVjdGlvbi5jb2xvcn1cbiAgICAgICAgdGVtcG9yYWwucHVzaChjb2xsZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAkc2NvcGUuY29sbGVjdGlvbnMucHVzaChzbGlkZXIpO1xuXG4gIH0pKTtcbiAgY29uc29sZS5sb2coJHNjb3BlLmNvbGxlY3Rpb25zKVxuXG4gIC8vIHdhaXQgdG8gYWxsIHByb21pc2VzIHJlc29sdmVcbiAgdmFyIGFsbCA9ICRxLmFsbChwcm9taXNlcyk7XG5cbiAgYWxsLnRoZW4oZnVuY3Rpb24oKXtcblxuICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgJChkb2N1bWVudCkuZm91bmRhdGlvbigpO1xuICAgIH0sIDApO1xuXG4gIH0pO1xuXG5cbn1dKTtcbiIsIi8qU0VDQ0lPTiBNRU5VUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignTWVudUNvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsICckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0VOVklST05NRU5URlJPTlQnLCckcm9vdFNjb3BlJyxcclxuICAgIGZ1bmN0aW9uICggJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLEVOVklST05NRU5ULEVOVklST05NRU5URlJPTlQsJHJvb3RTY29wZSkge1xyXG4gICAgICAgIHZhciBicmVhZGNydW1iO1xyXG4gICAgICAgICRsb2NhdGlvbi5wYXRoKCkgPT0gJy8nID8gJHNjb3BlLnBhdGggPSAnLyc6JHNjb3BlLnBhdGggPSAkbG9jYXRpb24ucGF0aCgpXHJcblxyXG4gICAgICAgICRodHRwLmdldChFTlZJUk9OTUVOVEZST05UKydhc3NldHMvZGF0YS9NZW51X3ByaW5jaXBhbC5qcycpLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgJHNjb3BlLm1lbnUgPSBkYXRhLm5vZGVzWzBdO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCRzY29wZS5tZW51KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrJ3N1Y3Vyc2FsZXMvanNvbicpLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgZGVsZXRlIGRhdGEubm9kZXNbMl07XHJcbiAgICAgICAgICAgICRzY29wZS5zdWN1cnNhbGVzID0gW107XHJcbiAgICAgICAgICAgIHZhciBjb3VudCA9IDA7XHJcbiAgICAgICAgICAgIHZhciBub2RlO1xyXG4gICAgICAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnN1Y3Vyc2FsZXNbY291bnRdID0gZGF0YS5ub2Rlc1tub2RlXTtcclxuICAgICAgICAgICAgICAgIGNvdW50ICsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuc3VjdXJzYWxlcyA9ICRzY29wZS5zdWN1cnNhbGVzO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRzY29wZS5vbkNoYW5nZUNpdWRhZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgcGF0aHM9e31cclxuICAgICAgICAgICAgdmFyIHBhdGg7XHJcbiAgICAgICAgICAgIHBhdGggPSAkbG9jYXRpb24ucGF0aCgpXHJcbiAgICAgICAgICAgICRyb290U2NvcGUuc3VjdXJzYWwgPSAkc2NvcGUuc3VjdXJzYWw7XHJcbiAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKHBhdGggKyAkcm9vdFNjb3BlLnN1Y3Vyc2FsKTtcclxuICAgICAgICB9XHJcblxyXG4gIH1dKTtcclxuIiwiLypTRUNDSU9OIE5PVElDSUFTKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdOb3RpY2lhc0NvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlKXtcclxuICAgIHZhciBwYXRoID0gJ2FydGljdWxvc0pTT04nO1xyXG4gICAgdmFyIG5vZGU7XHJcbiAgICAkc2NvcGUuYXJ0aWNsZXMgPSB7fTtcclxuICAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgICRzY29wZS5hcnRpY2xlc1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV1bJ25vZGUnXVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1dKTtcclxuIiwiLypTRUNDSU9OIE9QVVMqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ09wdXNDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCdFTlZJUk9OTUVOVCcsIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwLCBFTlZJUk9OTUVOVCkge1xyXG4gICAgJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb25jaWVydG9zL2pzb24nKS5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgJHNjb3BlLmNvbmNlcnRzID0gZGF0YS5ub2RlcztcclxuICAgIH0pO1xyXG5cclxufV0pO1xyXG4iLCIvKlxuICBCbGFhIC0gRGF5c2NyaXB0XG4gIEJpYmxpb3RlY2EgZGUgY2xhc2VzIHBhcmEgZXN0aWxvc1xuICBjb3B5cmlndGggMjAxNiAtIEJvZ290YS1Db2xvbWJpYVxuKi9cbmJsYWFBcHAuY29udHJvbGxlcignUGFnZUNvbnRyb2xsZXInLFsnJHNjb3BlJywnJGxvZycsJyRsb2NhdGlvbicsICckdGltZW91dCcgLGZ1bmN0aW9uKCRzY29wZSwgJGxvZywgJGxvY2F0aW9uLCAkdGltZW91dCkge1xuXG4gIHZhciBjb2xvdXJNYXAgPSB7XG4gICAgaW5kZXggOiAnY0luZGV4JyxcbiAgICBiaWJsaW90ZWNhczogXCJjQmlibGlvXCIsXG4gIH07XG5cbiAgJHNjb3BlLkdldENsYXNzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgcGF0aENsYXNzID0gJGxvY2F0aW9uLnBhdGgoKVxuICAgIC8vY29uc29sZS5sb2cocGF0aENsYXNzKVxuICAgIHBhdGhDbGFzcyA9IHBhdGhDbGFzcy5zcGxpdCgnLycpXG4gICAgcGF0aENsYXNzLnNoaWZ0KClcbiAgICByZXR1cm4gY29sb3VyTWFwW3BhdGhDbGFzc1swXV07XG4gIH1cblxuICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICQoZG9jdW1lbnQpLmZvdW5kYXRpb24oKTtcbiAgfSwgMzAwMCk7XG59XSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
