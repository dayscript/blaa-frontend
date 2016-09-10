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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC1jb25maWd1cmUuanMiLCJhcHAtcm91dGUuanMiLCJBcHBDb250cm9sbGVyLmpzIiwiQmFubmVyUHJpbmNpcGFsQ29udHJvbGxlci5qcyIsIkJyZWFkQ3J1bWJDb250cm9sbGVyLmpzIiwiRXZlbnRvc0NvbnRyb2xsZXIuanMiLCJMaW5lYURlVGllbXBvQ29udHJvbGxlci5qcyIsIk1lbW9yaWFzT3JhbGVzQ29udHJvbGxlci5qcyIsIk1lbnVDb250cm9sbGVyLmpzIiwiTm90aWNpYXNDb250cm9sbGVyLmpzIiwiT3B1c0NvbnRyb2xsZXIuanMiLCJQYWdlQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG52YXIgYmxhYUFwcCA9IGFuZ3VsYXIubW9kdWxlKCdibGFhQXBwJywgWyduZ1Nhbml0aXplJywnbmdSb3V0ZScsJ25jeS1hbmd1bGFyLWJyZWFkY3J1bWInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdQcmV0dHlKc29uJywnY2hpZWZmYW5jeXBhbnRzLmxvYWRpbmdCYXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdBbmltYXRlJywnbmdQcmV0dHlKc29uJ10pXG4gICAgLmNvbnN0YW50KCdFTlZJUk9OTUVOVCcsICdodHRwOi8vYmxhYS5kZW1vZGF5c2NyaXB0LmNvbS8nKVxuICAgIC5jb25zdGFudCgnRU5WSVJPTk1FTlRGUk9OVCcsICcvJylcbiAgICAuY29uZmlnKGZ1bmN0aW9uKGNmcExvYWRpbmdCYXJQcm92aWRlcikge1xuICAgICAgY2ZwTG9hZGluZ0JhclByb3ZpZGVyLmluY2x1ZGVTcGlubmVyID0gdHJ1ZTtcbiAgICB9KTtcblxuXG5mdW5jdGlvbiBwcmludCh0ZXh0LHZhcmlhYmxlKXtcbiAgICBjb25zb2xlLmxvZyh0ZXh0Kyc6Jyt2YXJpYWJsZSk7XG59IiwiYmxhYUFwcC5jb25maWcoWyckcm91dGVQcm92aWRlcicsJyRsb2NhdGlvblByb3ZpZGVyJyxmdW5jdGlvbigkcm91dGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCchJyk7XG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuXG4gICAgJHJvdXRlUHJvdmlkZXIud2hlbignLycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdob21lLmh0bWwnXG4gICAgfSlcbiAgICAud2hlbignL2JpYmxpb3RlY2FzL21lbW9yaWFzLW9yYWxlcycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICcvYmlibGlvdGVjYXMvbWVtb3JpYXMtb3JhbGVzL21lbW9yaWFzLW9yYWxlcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ01lbW9yaWFzT3JhbGVzQ29udHJvbGxlcidcbiAgICB9KVxuICAgICAgICAud2hlbignL2JpYmxpb3RlY2FzL21lbW9yaWFzLW9yYWxlcy9ub3RpY2lhcycsIHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnbm90aWNpYXMuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnTWVtb3JpYXNPcmFsZXNDb250cm9sbGVyJ1xuICAgICAgICB9KVxuICAgIC5vdGhlcndpc2Uoe1xuICAgICAgICByZWRpcmVjdFRvOiAnLzQwNCdcbiAgICB9KTtcbiAgICAvLyBjb25maWd1cmUgaHRtbDUgdG8gZ2V0IGxpbmtzIHdvcmtpbmcgb24ganNmaWRkbGVcbn1dKTtcblxuLypibGFhQXBwLnJ1bihbJyRsb2NhdGlvbicsIGZ1bmN0aW9uIEFwcFJ1bigkbG9jYXRpb24pIHtcbiAgICBkZWJ1Z2dlcjtcbn1dKTsqL1xuIiwiYmxhYUFwcC5jb250cm9sbGVyKCdTdWN1cnNhbENvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCckc3RhdGVQYXJhbXMnLCAnJHN0YXRlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCwgJHJvb3RTY29wZSwkc3RhdGVQYXJhbXMsICRzdGF0ZSl7XG4gICAgJHNjb3BlLmJyZWFkY3J1bWJzID0gW11cbiAgICAkc3RhdGVQYXJhbXMuc3VjdXJzYWwgPyAgJHJvb3RTY29wZS5zdWN1cnNhbCA9ICRzdGF0ZVBhcmFtcy5zdWN1cnNhbDokcm9vdFNjb3BlLnN1Y3Vyc2FsID0gJ0JvZ290w6EnO1xuICAgICRzY29wZS5icmVhZGNydW1icyA9ICdBY3RpdmlkYWQgQ3VsdHVyYWwnXG4gICAgY29uc29sZS5sb2coJ1N1Y3Vyc2FsOicrICRyb290U2NvcGUuc3VjdXJzYWwpO1xufV0pXG4iLCJibGFhQXBwLmNvbnRyb2xsZXIoJ0Jhbm5lclByaW5jaXBhbENvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCckdGltZW91dCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUsJHRpbWVvdXQpe1xyXG4gICAgdmFyIHBhdGggPSAnYmFubmVyL2pzb24nO1xyXG4gICAgdmFyIG5vZGU7XHJcbiAgICAkc2NvcGUuYmFubmVycyA9IHt9O1xyXG4gICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGgpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICRzY29wZS5iYW5uZXJzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXS5ub2RlXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufV0pO1xyXG4iLCIvKlNFQ0NJT04gQlJFQURDUlVNQiovXHJcbmJsYWFBcHAuY29udHJvbGxlcignQnJlYWRjcnVtYkNvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCRyb290U2NvcGUpIHtcclxuICAgIHByaW50KCdicmVhZGNydW1iJywkbG9jYXRpb24ucGF0aCgpKTtcclxuICAgIHZhciBwYXRocyA9IHt9O1xyXG4gICAgcGF0aHMgPSAkbG9jYXRpb24ucGF0aCgpXHJcbiAgICAkc2NvcGUuYnJlYWRjcnVtYiA9IHt9O1xyXG4gICAgcGF0aHMgPSBwYXRocy5zcGxpdCgnLycpO1xyXG4gICAgcGF0aHMuc2hpZnQoKTtcclxuICAgIGZvciggdmFyIGkgPSAwOyBpIDw9IHBhdGhzLmxlbmd0aC0xOyBpKysgKXtcclxuICAgICAgICBwYXRocyA9PSBcIlwiPyAkc2NvcGUuYnJlYWRjcnVtYltpXSA9IHBhdGhzWzBdOiRzY29wZS5icmVhZGNydW1iW2ldID0gcGF0aHNbaV07XHJcbiAgICB9XHJcbiAgICAkcm9vdFNjb3BlLmJyZWFkY3J1bWIgPSAkc2NvcGUuYnJlYWRjcnVtYjtcclxufV0pOyBcclxuIiwiLypTRUNDSU9OIFNMSURFUiBFVkVOVE9TKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdFdmVudG9zQ29udHJvbGxlcicsWyckc2NvcGUnLCckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUpe1xyXG4gICB2YXIgcGF0aCA9ICdldmVudG9zSlNPTic7XHJcbiAgIHZhciBub2RlO1xyXG4gICAkc2NvcGUuZXZlbnRzID0ge307XHJcbiAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAkc2NvcGUuZXZlbnRzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICB9XHJcbiAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuZXZlbnRzKVxyXG4gICB9KVxyXG59XSk7XHJcbiIsIi8qU0VDQ0lPTiBTTElERVIgRVZFTlRPUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignTGluZWFEZVRpZW1wb0NvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQpe1xyXG4gICB2YXIgcGF0aCA9ICdldmVudG9zSlNPTic7XHJcbiAgIHZhciBwYXRoVGlwb0V2ZW50byA9ICd0YXhvbm9taWFzL3RpcG9kZWV2ZW50by9qc29uJztcclxuICAgdmFyIG5vZGU7XHJcbiAgICRzY29wZS5ldmVudHMgPSB7fTtcclxuICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGgpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICRzY29wZS5ldmVudHNbbm9kZV0gPSBkYXRhLm5vZGVzW25vZGVdWydub2RlJ11cclxuICAgICAgIH1cclxuICAgfSlcclxuICAgJHNjb3BlLnRpcG9FdmVudG9zID0ge307XHJcbiAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoVGlwb0V2ZW50bykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgJHNjb3BlLnRpcG9FdmVudG9zW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICB9XHJcbiAgIH0pXHJcbn1dKTtcclxuIiwiLypcbiAgQmxhYSAtIERheXNjcmlwdFxuICBCaWJsaW90ZWNhIGRlIGNsYXNlcyBwYXJhIGVzdGlsb3NcbiAgY29weXJpZ3RoIDIwMTYgLSBCb2dvdGEtQ29sb21iaWFcbiovXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ01lbW9yaWFzT3JhbGVzQ29udHJvbGxlcicsWyckc2NvcGUnLCAnJGh0dHAnLCAnRU5WSVJPTk1FTlQnLCckdGltZW91dCcsICckcScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIEVOVklST05NRU5ULCAkdGltZW91dCwgJHEpIHtcblxuICAkc2NvcGUuY29sbGVjdGlvbnMgPSBbXTtcblxuICB2YXIgcHJvbWlzZXMgPSBbXTtcbiAgcHJvbWlzZXMucHVzaCgkaHR0cC5nZXQoRU5WSVJPTk1FTlQrJ2NvbGVjY2lvbmVzL2pzb24vbWFzLXJlY2llbnRlcy9NZW1vcmlhIG9yYWwnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgdGVtcG9yYWwgPSBbXTtcbiAgICB2YXIgc2xpZGVyID0ge1xuICAgICAgXCJ0aXRsZVwiOiBcIkxvIG3DoXMgUmVjaWVudGVcIixcbiAgICAgIFwibm9kZXNcIjogW11cbiAgICB9O1xuXG4gICAgYW5ndWxhci5mb3JFYWNoKGRhdGEubm9kZXMsIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGtleSkge1xuICAgICAgY29uc29sZS5sb2coa2V5KVxuICAgICAgaWYoIChrZXkrMSkgJSAgNCA9PSAwIHx8IGtleSA9PSBkYXRhLm5vZGVzLmxlbmd0aCl7XG4gICAgICAgIHNsaWRlci5ub2Rlcy5wdXNoKHRlbXBvcmFsKTtcbiAgICAgICAgdGVtcG9yYWwgPSBbXTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0ZW1wb3JhbC5wdXNoKGNvbGxlY3Rpb24pO1xuICAgICAgfSAgICBcbiAgICB9KTtcblxuICAgICRzY29wZS5jb2xsZWN0aW9ucy5wdXNoKHNsaWRlcik7XG5cbiAgfSkpO1xuXG4gIHByb21pc2VzLnB1c2goJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb2xlY2Npb25lcy9qc29uL21hcy1kZXN0YWNhZG9zL01lbW9yaWEgb3JhbCcpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciB0ZW1wb3JhbCA9IFtdO1xuICAgIHZhciBzbGlkZXIgPSB7XG4gICAgICBcInRpdGxlXCI6IFwiTG8gbcOhcyBEZXN0YWNhZG9cIixcbiAgICAgIFwibm9kZXNcIjogW11cbiAgICB9O1xuXG4gICAgYW5ndWxhci5mb3JFYWNoKGRhdGEubm9kZXMsIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGtleSkge1xuICAgICAgaWYoKGtleSsxKSAlIDQgPT0gMCB8fCBrZXkgPT0gZGF0YS5ub2Rlcy5sZW5ndGgpe1xuICAgICAgICBzbGlkZXIubm9kZXMucHVzaCh0ZW1wb3JhbCk7XG4gICAgICAgIHRlbXBvcmFsID0gW107XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGVtcG9yYWwucHVzaChjb2xsZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAkc2NvcGUuY29sbGVjdGlvbnMucHVzaChzbGlkZXIpO1xuICB9KSk7XG5cbiAgcHJvbWlzZXMucHVzaCgkaHR0cC5nZXQoRU5WSVJPTk1FTlQrJ2NvbGVjY2lvbmVzL2pzb24vbWFzLXBvcHVsYXJlcy9NZW1vcmlhIG9yYWwnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgdGVtcG9yYWwgPSBbXTtcbiAgICB2YXIgc2xpZGVyID0ge1xuICAgICAgXCJ0aXRsZVwiOiBcIkxvIG3DoXMgUG9wdWxhclwiLFxuICAgICAgXCJub2Rlc1wiOiBbXVxuICAgIH07XG5cbiAgICBhbmd1bGFyLmZvckVhY2goZGF0YS5ub2RlcywgZnVuY3Rpb24oY29sbGVjdGlvbiwga2V5KSB7XG4gICAgICBpZigoa2V5KzEpICUgNCA9PSAwIHx8IGtleSA9PSBkYXRhLm5vZGVzLmxlbmd0aCl7XG4gICAgICAgIHNsaWRlci5ub2Rlcy5wdXNoKHRlbXBvcmFsKTtcbiAgICAgICAgdGVtcG9yYWwgPSBbXTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0ZW1wb3JhbC5wdXNoKGNvbGxlY3Rpb24pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHNjb3BlLmNvbGxlY3Rpb25zLnB1c2goc2xpZGVyKTtcbiAgICBjb25zb2xlLmxvZygkc2NvcGUuY29sbGVjdGlvbnMpO1xuICB9KSk7XG5cbiAgLy8gd2FpdCB0byBhbGwgcHJvbWlzZXMgcmVzb2x2ZVxuICB2YXIgYWxsID0gJHEuYWxsKHByb21pc2VzKTtcblxuICBhbGwudGhlbihmdW5jdGlvbigpe1xuXG4gICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAkKGRvY3VtZW50KS5mb3VuZGF0aW9uKCk7XG4gICAgfSwgMCk7XG5cbiAgfSk7XG5cblxufV0pO1xuIiwiLypTRUNDSU9OIE1FTlVTKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdNZW51Q29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywgJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnRU5WSVJPTk1FTlRGUk9OVCcsJyRyb290U2NvcGUnLFxyXG4gICAgZnVuY3Rpb24gKCAkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sRU5WSVJPTk1FTlQsRU5WSVJPTk1FTlRGUk9OVCwkcm9vdFNjb3BlKSB7XHJcbiAgICAgICAgdmFyIGJyZWFkY3J1bWI7XHJcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoKSA9PSAnLycgPyAkc2NvcGUucGF0aCA9ICcvJzokc2NvcGUucGF0aCA9ICRsb2NhdGlvbi5wYXRoKClcclxuICAgICAgICBcclxuICAgICAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlRGUk9OVCsnYXNzZXRzL2RhdGEvTWVudV9wcmluY2lwYWwuanMnKS5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5tZW51ID0gZGF0YS5ub2Rlc1swXTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJHNjb3BlLm1lbnUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRodHRwLmdldChFTlZJUk9OTUVOVCsnc3VjdXJzYWxlcy9qc29uJykuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICBkZWxldGUgZGF0YS5ub2Rlc1syXTtcclxuICAgICAgICAgICAgJHNjb3BlLnN1Y3Vyc2FsZXMgPSBbXTtcclxuICAgICAgICAgICAgdmFyIGNvdW50ID0gMDtcclxuICAgICAgICAgICAgdmFyIG5vZGU7XHJcbiAgICAgICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3VjdXJzYWxlc1tjb3VudF0gPSBkYXRhLm5vZGVzW25vZGVdO1xyXG4gICAgICAgICAgICAgICAgY291bnQgKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJHJvb3RTY29wZS5zdWN1cnNhbGVzID0gJHNjb3BlLnN1Y3Vyc2FsZXM7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJHNjb3BlLm9uQ2hhbmdlQ2l1ZGFkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXRocz17fVxyXG4gICAgICAgICAgICB2YXIgcGF0aDtcclxuICAgICAgICAgICAgcGF0aCA9ICRsb2NhdGlvbi5wYXRoKClcclxuICAgICAgICAgICAgJHJvb3RTY29wZS5zdWN1cnNhbCA9ICRzY29wZS5zdWN1cnNhbDtcclxuICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgocGF0aCArICRyb290U2NvcGUuc3VjdXJzYWwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgfV0pO1xyXG4iLCIvKlNFQ0NJT04gTk9USUNJQVMqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ05vdGljaWFzQ29udHJvbGxlcicsWyckc2NvcGUnLCckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUpe1xyXG4gICAgdmFyIHBhdGggPSAnYXJ0aWN1bG9zSlNPTic7XHJcbiAgICB2YXIgbm9kZTtcclxuICAgICRzY29wZS5hcnRpY2xlcyA9IHt9O1xyXG4gICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGgpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAgJHNjb3BlLmFydGljbGVzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufV0pO1xyXG4iLCIvKlNFQ0NJT04gT1BVUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignT3B1c0NvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsJ0VOVklST05NRU5UJywgZnVuY3Rpb24gKCRzY29wZSwgJGh0dHAsIEVOVklST05NRU5UKSB7XHJcbiAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrJ2NvbmNpZXJ0b3MvanNvbicpLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAkc2NvcGUuY29uY2VydHMgPSBkYXRhLm5vZGVzO1xyXG4gICAgfSk7XHJcblxyXG59XSk7XHJcbiIsIi8qXG4gIEJsYWEgLSBEYXlzY3JpcHRcbiAgQmlibGlvdGVjYSBkZSBjbGFzZXMgcGFyYSBlc3RpbG9zXG4gIGNvcHlyaWd0aCAyMDE2IC0gQm9nb3RhLUNvbG9tYmlhXG4qL1xuYmxhYUFwcC5jb250cm9sbGVyKCdQYWdlQ29udHJvbGxlcicsWyckc2NvcGUnLCckbG9nJywnJGxvY2F0aW9uJywgJyR0aW1lb3V0JyAsZnVuY3Rpb24oJHNjb3BlLCAkbG9nLCAkbG9jYXRpb24sICR0aW1lb3V0KSB7XG5cbiAgdmFyIGNvbG91ck1hcCA9IHtcbiAgICBpbmRleCA6ICdjSW5kZXgnLFxuICAgIGJpYmxpb3RlY2FzOiBcImNCaWJsaW9cIixcbiAgfTtcblxuICAkc2NvcGUuR2V0Q2xhc3MgPSBmdW5jdGlvbigpe1xuICAgIHZhciBwYXRoQ2xhc3MgPSAkbG9jYXRpb24ucGF0aCgpXG4gICAgLy9jb25zb2xlLmxvZyhwYXRoQ2xhc3MpXG4gICAgcGF0aENsYXNzID0gcGF0aENsYXNzLnNwbGl0KCcvJylcbiAgICBwYXRoQ2xhc3Muc2hpZnQoKVxuICAgIHJldHVybiBjb2xvdXJNYXBbcGF0aENsYXNzWzBdXTtcbiAgfVxuXG4gICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgJChkb2N1bWVudCkuZm91bmRhdGlvbigpO1xuICB9LCAzMDAwKTtcbn1dKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
