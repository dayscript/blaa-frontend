'use strict';
var blaaApp = angular.module('blaaApp', ['ngSanitize','ngRoute','ncy-angular-breadcrumb',
                                         'ngPrettyJson','chieffancypants.loadingBar',
                                         'ngAnimate','ngPrettyJson','angular-google-analytics'])
    .constant('ENVIRONMENT', 'http://blaa.demodayscript.com/')
    .constant('ENVIRONMENTFRONT', '/')
    .config(function(cfpLoadingBarProvider) {
      cfpLoadingBarProvider.includeSpinner = true;
    })


blaaApp.filter('extractNidString', function() {
  return function(string) {
      var regex = /\d+$/;
      var matches = string.match(regex);

      return (matches ? matches.shift() : 0);
  };
});


function print(text,variable){
    console.log(text+':'+variable);
}

blaaApp.config(['$routeProvider','$locationProvider','AnalyticsProvider',function($routeProvider, $locationProvider,AnalyticsProvider) {
    $locationProvider.hashPrefix('!');
    $locationProvider.html5Mode(true);
    
    AnalyticsProvider.useAnalytics(false);
    AnalyticsProvider.setAccount('UA-43463194-1');
    AnalyticsProvider.trackPages(true);

    $routeProvider.when('/', {
        templateUrl: 'home.html'
    })
    .when('/bibliotecas/memorias-orales', {
        templateUrl: '/bibliotecas/memorias-orales/memorias-orales.html',
        controller: 'MemoriasOralesController'
    })
    .when('/bibliotecas/memorias-orales/:titleId', {
        templateUrl: '/bibliotecas/memorias-orales/interna-colecciones.html',
        controller: 'NodeController'
      })
    .when('/bibliotecas/memorias-orales/noticias', {
        templateUrl: '/bibliotecas/memorias-orales/noticias-interna.html',
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

blaaApp.controller('NodeController',
  // ['$scope', '$http',
  ['$scope', '$http', '$routeParams', '$filter', '$timeout', '$state', '$sce', '$window', '$location', 'ENVIRONMENT',
  function ($scope, $http, $routeParams, $filter, $timeout, $state, $sce, $window, $location, ENVIRONMENT) {
  // function ($scope, $http) {

  if ($routeParams.hasOwnProperty('titleId')) {
    $scope.nid = $filter('extractNidString')($routeParams.titleId);
  }

  $http.get(ENVIRONMENT+'api/node/'+$scope.nid+'.json').success(function(data) {
    $scope.node = data;

    if('body' in $scope.node && 'und' in $scope.node.body){
      $scope.node.body.und[0].safe_value = $sce.trustAsHtml(data.body.und[0].safe_value);
    }

    console.log(data);
  });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC1jb25maWd1cmUuanMiLCJhcHAtcm91dGUuanMiLCJBcHBDb250cm9sbGVyLmpzIiwiQmFubmVyUHJpbmNpcGFsQ29udHJvbGxlci5qcyIsIkJyZWFkQ3J1bWJDb250cm9sbGVyLmpzIiwiRXZlbnRvc0NvbnRyb2xsZXIuanMiLCJMaW5lYURlVGllbXBvQ29udHJvbGxlci5qcyIsIk1lbW9yaWFzT3JhbGVzQ29udHJvbGxlci5qcyIsIk1lbnVDb250cm9sbGVyLmpzIiwiTm9kZUNvbnRyb2xsZXIuanMiLCJOb3RpY2lhc0NvbnRyb2xsZXIuanMiLCJPcHVzQ29udHJvbGxlci5qcyIsIlBhZ2VDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG52YXIgYmxhYUFwcCA9IGFuZ3VsYXIubW9kdWxlKCdibGFhQXBwJywgWyduZ1Nhbml0aXplJywnbmdSb3V0ZScsJ25jeS1hbmd1bGFyLWJyZWFkY3J1bWInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdQcmV0dHlKc29uJywnY2hpZWZmYW5jeXBhbnRzLmxvYWRpbmdCYXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdBbmltYXRlJywnbmdQcmV0dHlKc29uJywnYW5ndWxhci1nb29nbGUtYW5hbHl0aWNzJ10pXG4gICAgLmNvbnN0YW50KCdFTlZJUk9OTUVOVCcsICdodHRwOi8vYmxhYS5kZW1vZGF5c2NyaXB0LmNvbS8nKVxuICAgIC5jb25zdGFudCgnRU5WSVJPTk1FTlRGUk9OVCcsICcvJylcbiAgICAuY29uZmlnKGZ1bmN0aW9uKGNmcExvYWRpbmdCYXJQcm92aWRlcikge1xuICAgICAgY2ZwTG9hZGluZ0JhclByb3ZpZGVyLmluY2x1ZGVTcGlubmVyID0gdHJ1ZTtcbiAgICB9KVxuXG5cbmJsYWFBcHAuZmlsdGVyKCdleHRyYWN0TmlkU3RyaW5nJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIHZhciByZWdleCA9IC9cXGQrJC87XG4gICAgICB2YXIgbWF0Y2hlcyA9IHN0cmluZy5tYXRjaChyZWdleCk7XG5cbiAgICAgIHJldHVybiAobWF0Y2hlcyA/IG1hdGNoZXMuc2hpZnQoKSA6IDApO1xuICB9O1xufSk7XG5cblxuZnVuY3Rpb24gcHJpbnQodGV4dCx2YXJpYWJsZSl7XG4gICAgY29uc29sZS5sb2codGV4dCsnOicrdmFyaWFibGUpO1xufVxuIiwiYmxhYUFwcC5jb25maWcoWyckcm91dGVQcm92aWRlcicsJyRsb2NhdGlvblByb3ZpZGVyJywnQW5hbHl0aWNzUHJvdmlkZXInLGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcixBbmFseXRpY3NQcm92aWRlcikge1xuICAgICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJyEnKTtcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgXG4gICAgQW5hbHl0aWNzUHJvdmlkZXIudXNlQW5hbHl0aWNzKGZhbHNlKTtcbiAgICBBbmFseXRpY3NQcm92aWRlci5zZXRBY2NvdW50KCdVQS00MzQ2MzE5NC0xJyk7XG4gICAgQW5hbHl0aWNzUHJvdmlkZXIudHJhY2tQYWdlcyh0cnVlKTtcblxuICAgICRyb3V0ZVByb3ZpZGVyLndoZW4oJy8nLCB7XG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaG9tZS5odG1sJ1xuICAgIH0pXG4gICAgLndoZW4oJy9iaWJsaW90ZWNhcy9tZW1vcmlhcy1vcmFsZXMnLCB7XG4gICAgICAgIHRlbXBsYXRlVXJsOiAnL2JpYmxpb3RlY2FzL21lbW9yaWFzLW9yYWxlcy9tZW1vcmlhcy1vcmFsZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdNZW1vcmlhc09yYWxlc0NvbnRyb2xsZXInXG4gICAgfSlcbiAgICAud2hlbignL2JpYmxpb3RlY2FzL21lbW9yaWFzLW9yYWxlcy86dGl0bGVJZCcsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICcvYmlibGlvdGVjYXMvbWVtb3JpYXMtb3JhbGVzL2ludGVybmEtY29sZWNjaW9uZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdOb2RlQ29udHJvbGxlcidcbiAgICAgIH0pXG4gICAgLndoZW4oJy9iaWJsaW90ZWNhcy9tZW1vcmlhcy1vcmFsZXMvbm90aWNpYXMnLCB7XG4gICAgICAgIHRlbXBsYXRlVXJsOiAnL2JpYmxpb3RlY2FzL21lbW9yaWFzLW9yYWxlcy9ub3RpY2lhcy1pbnRlcm5hLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTWVtb3JpYXNPcmFsZXNDb250cm9sbGVyJ1xuICAgICAgfSlcbiAgICAub3RoZXJ3aXNlKHtcbiAgICAgICAgcmVkaXJlY3RUbzogJy80MDQnXG4gICAgfSk7XG4gICAgLy8gY29uZmlndXJlIGh0bWw1IHRvIGdldCBsaW5rcyB3b3JraW5nIG9uIGpzZmlkZGxlXG59XSk7XG5cbi8qYmxhYUFwcC5ydW4oWyckbG9jYXRpb24nLCBmdW5jdGlvbiBBcHBSdW4oJGxvY2F0aW9uKSB7XG4gICAgZGVidWdnZXI7XG59XSk7Ki9cbiIsImJsYWFBcHAuY29udHJvbGxlcignU3VjdXJzYWxDb250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywnJHN0YXRlUGFyYW1zJywgJyRzdGF0ZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUsJHN0YXRlUGFyYW1zLCAkc3RhdGUpe1xuICAgICRzY29wZS5icmVhZGNydW1icyA9IFtdXG4gICAgJHN0YXRlUGFyYW1zLnN1Y3Vyc2FsID8gICRyb290U2NvcGUuc3VjdXJzYWwgPSAkc3RhdGVQYXJhbXMuc3VjdXJzYWw6JHJvb3RTY29wZS5zdWN1cnNhbCA9ICdCb2dvdMOhJztcbiAgICAkc2NvcGUuYnJlYWRjcnVtYnMgPSAnQWN0aXZpZGFkIEN1bHR1cmFsJ1xuICAgIGNvbnNvbGUubG9nKCdTdWN1cnNhbDonKyAkcm9vdFNjb3BlLnN1Y3Vyc2FsKTtcbn1dKVxuIiwiYmxhYUFwcC5jb250cm9sbGVyKCdCYW5uZXJQcmluY2lwYWxDb250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywnJHRpbWVvdXQnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlLCR0aW1lb3V0KXtcclxuICAgIHZhciBwYXRoID0gJ2Jhbm5lci9qc29uJztcclxuICAgIHZhciBub2RlO1xyXG4gICAgJHNjb3BlLmJhbm5lcnMgPSB7fTtcclxuICAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAkc2NvcGUuYmFubmVyc1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV0ubm9kZVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1dKTtcclxuIiwiLypTRUNDSU9OIEJSRUFEQ1JVTUIqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ0JyZWFkY3J1bWJDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCwkcm9vdFNjb3BlKSB7XHJcbiAgICBwcmludCgnYnJlYWRjcnVtYicsJGxvY2F0aW9uLnBhdGgoKSk7XHJcbiAgICB2YXIgcGF0aHMgPSB7fTtcclxuICAgIHBhdGhzID0gJGxvY2F0aW9uLnBhdGgoKVxyXG4gICAgJHNjb3BlLmJyZWFkY3J1bWIgPSB7fTtcclxuICAgIHBhdGhzID0gcGF0aHMuc3BsaXQoJy8nKTtcclxuICAgIHBhdGhzLnNoaWZ0KCk7XHJcbiAgICBmb3IoIHZhciBpID0gMDsgaSA8PSBwYXRocy5sZW5ndGgtMTsgaSsrICl7XHJcbiAgICAgICAgcGF0aHMgPT0gXCJcIj8gJHNjb3BlLmJyZWFkY3J1bWJbaV0gPSBwYXRoc1swXTokc2NvcGUuYnJlYWRjcnVtYltpXSA9IHBhdGhzW2ldO1xyXG4gICAgfVxyXG4gICAgJHJvb3RTY29wZS5icmVhZGNydW1iID0gJHNjb3BlLmJyZWFkY3J1bWI7XHJcbn1dKTsgXHJcbiIsIi8qU0VDQ0lPTiBTTElERVIgRVZFTlRPUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignRXZlbnRvc0NvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlKXtcclxuICAgdmFyIHBhdGggPSAnZXZlbnRvc0pTT04nO1xyXG4gICB2YXIgbm9kZTtcclxuICAgJHNjb3BlLmV2ZW50cyA9IHt9O1xyXG4gICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aCkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgJHNjb3BlLmV2ZW50c1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV1bJ25vZGUnXVxyXG4gICAgICAgfVxyXG4gICAgICAgY29uc29sZS5sb2coJHNjb3BlLmV2ZW50cylcclxuICAgfSlcclxufV0pO1xyXG4iLCIvKlNFQ0NJT04gU0xJREVSIEVWRU5UT1MqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ0xpbmVhRGVUaWVtcG9Db250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5UKXtcclxuICAgdmFyIHBhdGggPSAnZXZlbnRvc0pTT04nO1xyXG4gICB2YXIgcGF0aFRpcG9FdmVudG8gPSAndGF4b25vbWlhcy90aXBvZGVldmVudG8vanNvbic7XHJcbiAgIHZhciBub2RlO1xyXG4gICAkc2NvcGUuZXZlbnRzID0ge307XHJcbiAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAkc2NvcGUuZXZlbnRzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICB9XHJcbiAgIH0pXHJcbiAgICRzY29wZS50aXBvRXZlbnRvcyA9IHt9O1xyXG4gICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aFRpcG9FdmVudG8pLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICRzY29wZS50aXBvRXZlbnRvc1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV1bJ25vZGUnXVxyXG4gICAgICAgfVxyXG4gICB9KVxyXG59XSk7XHJcbiIsIi8qXG4gIEJsYWEgLSBEYXlzY3JpcHRcbiAgQmlibGlvdGVjYSBkZSBjbGFzZXMgcGFyYSBlc3RpbG9zXG4gIGNvcHlyaWd0aCAyMDE2IC0gQm9nb3RhLUNvbG9tYmlhXG4qL1xuYmxhYUFwcC5jb250cm9sbGVyKCdNZW1vcmlhc09yYWxlc0NvbnRyb2xsZXInLFsnJHNjb3BlJywgJyRodHRwJywgJ0VOVklST05NRU5UJywnJHRpbWVvdXQnLCAnJHEnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCBFTlZJUk9OTUVOVCwgJHRpbWVvdXQsICRxKSB7XG5cbiAgJHNjb3BlLmNvbGxlY3Rpb25zID0gW107XG5cbiAgdmFyIHByb21pc2VzID0gW107XG4gIHByb21pc2VzLnB1c2goJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb2xlY2Npb25lcy9qc29uL21hcy1yZWNpZW50ZXMvTWVtb3JpYSBvcmFsJykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHRlbXBvcmFsID0gW107XG4gICAgdmFyIHNsaWRlciA9IHtcbiAgICAgIFwidGl0bGVcIjogXCJMbyBtw6FzIFJlY2llbnRlXCIsXG4gICAgICBcIm5vZGVzXCI6IFtdXG4gICAgfTtcblxuICAgIGFuZ3VsYXIuZm9yRWFjaChkYXRhLm5vZGVzLCBmdW5jdGlvbihjb2xsZWN0aW9uLCBrZXkpIHtcbiAgICAgIGlmKCAoa2V5KzEpICUgIDQgPT0gMCB8fCBrZXkgPT0gZGF0YS5ub2Rlcy5sZW5ndGgpe1xuICAgICAgICBzbGlkZXIubm9kZXMucHVzaCh0ZW1wb3JhbCk7XG4gICAgICAgIHRlbXBvcmFsID0gW107XG4gICAgICB9ZWxzZXtcbiAgICAgICAgY29sbGVjdGlvbi5saW5rcyA9IGNvbGxlY3Rpb24ubGlua3Muc3BsaXQoJywnKVxuICAgICAgICBjb2xsZWN0aW9uLmNvbG9yID0geydiYWNrZ3JvdW5kLWNvbG9yJzpjb2xsZWN0aW9uLmNvbG9yfVxuICAgICAgICB0ZW1wb3JhbC5wdXNoKGNvbGxlY3Rpb24pO1xuXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAkc2NvcGUuY29sbGVjdGlvbnMucHVzaChzbGlkZXIpO1xuICB9KSk7XG5cbiAgcHJvbWlzZXMucHVzaCgkaHR0cC5nZXQoRU5WSVJPTk1FTlQrJ2NvbGVjY2lvbmVzL2pzb24vbWFzLWRlc3RhY2Fkb3MvTWVtb3JpYSBvcmFsJykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHRlbXBvcmFsID0gW107XG4gICAgdmFyIHNsaWRlciA9IHtcbiAgICAgIFwidGl0bGVcIjogXCJMbyBtw6FzIERlc3RhY2Fkb1wiLFxuICAgICAgXCJub2Rlc1wiOiBbXVxuICAgIH07XG5cbiAgICBhbmd1bGFyLmZvckVhY2goZGF0YS5ub2RlcywgZnVuY3Rpb24oY29sbGVjdGlvbiwga2V5KSB7XG4gICAgICBpZigoa2V5KzEpICUgNCA9PSAwIHx8IGtleSA9PSBkYXRhLm5vZGVzLmxlbmd0aCl7XG4gICAgICAgIHNsaWRlci5ub2Rlcy5wdXNoKHRlbXBvcmFsKTtcbiAgICAgICAgdGVtcG9yYWwgPSBbXTtcbiAgICAgIH1lbHNle1xuICAgICAgICBjb2xsZWN0aW9uLmxpbmtzID0gY29sbGVjdGlvbi5saW5rcy5zcGxpdCgnLCcpXG4gICAgICAgIGNvbGxlY3Rpb24uY29sb3IgPSB7J2JhY2tncm91bmQtY29sb3InOmNvbGxlY3Rpb24uY29sb3J9XG5cbiAgICAgICAgdGVtcG9yYWwucHVzaChjb2xsZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAkc2NvcGUuY29sbGVjdGlvbnMucHVzaChzbGlkZXIpO1xuICB9KSk7XG5cbiAgcHJvbWlzZXMucHVzaCgkaHR0cC5nZXQoRU5WSVJPTk1FTlQrJ2NvbGVjY2lvbmVzL2pzb24vbWFzLXBvcHVsYXJlcy9NZW1vcmlhIG9yYWwnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgdGVtcG9yYWwgPSBbXTtcbiAgICB2YXIgc2xpZGVyID0ge1xuICAgICAgXCJ0aXRsZVwiOiBcIkxvIG3DoXMgUG9wdWxhclwiLFxuICAgICAgXCJub2Rlc1wiOiBbXVxuICAgIH07XG5cbiAgICBhbmd1bGFyLmZvckVhY2goZGF0YS5ub2RlcywgZnVuY3Rpb24oY29sbGVjdGlvbiwga2V5KSB7XG4gICAgICBpZigoa2V5KzEpICUgNCA9PSAwIHx8IGtleSA9PSBkYXRhLm5vZGVzLmxlbmd0aCl7XG4gICAgICAgIHNsaWRlci5ub2Rlcy5wdXNoKHRlbXBvcmFsKTtcbiAgICAgICAgdGVtcG9yYWwgPSBbXTtcbiAgICAgIH1lbHNle1xuICAgICAgICBjb2xsZWN0aW9uLmxpbmtzID0gY29sbGVjdGlvbi5saW5rcy5zcGxpdCgnLCcpXG4gICAgICAgIGNvbGxlY3Rpb24uY29sb3IgPSB7J2JhY2tncm91bmQtY29sb3InOmNvbGxlY3Rpb24uY29sb3J9XG4gICAgICAgIHRlbXBvcmFsLnB1c2goY29sbGVjdGlvbik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgJHNjb3BlLmNvbGxlY3Rpb25zLnB1c2goc2xpZGVyKTtcblxuICB9KSk7XG4gIGNvbnNvbGUubG9nKCRzY29wZS5jb2xsZWN0aW9ucylcblxuICAvLyB3YWl0IHRvIGFsbCBwcm9taXNlcyByZXNvbHZlXG4gIHZhciBhbGwgPSAkcS5hbGwocHJvbWlzZXMpO1xuXG4gIGFsbC50aGVuKGZ1bmN0aW9uKCl7XG5cbiAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICQoZG9jdW1lbnQpLmZvdW5kYXRpb24oKTtcbiAgICB9LCAwKTtcblxuICB9KTtcblxuXG59XSk7XG4iLCIvKlNFQ0NJT04gTUVOVVMqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ01lbnVDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCAnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdFTlZJUk9OTUVOVEZST05UJywnJHJvb3RTY29wZScsXHJcbiAgICBmdW5jdGlvbiAoICRzY29wZSwgJGh0dHAsICRsb2NhdGlvbixFTlZJUk9OTUVOVCxFTlZJUk9OTUVOVEZST05ULCRyb290U2NvcGUpIHtcclxuICAgICAgICB2YXIgYnJlYWRjcnVtYjtcclxuICAgICAgICAkbG9jYXRpb24ucGF0aCgpID09ICcvJyA/ICRzY29wZS5wYXRoID0gJy8nOiRzY29wZS5wYXRoID0gJGxvY2F0aW9uLnBhdGgoKVxyXG5cclxuICAgICAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlRGUk9OVCsnYXNzZXRzL2RhdGEvTWVudV9wcmluY2lwYWwuanMnKS5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5tZW51ID0gZGF0YS5ub2Rlc1swXTtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygkc2NvcGUubWVudSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJGh0dHAuZ2V0KEVOVklST05NRU5UKydzdWN1cnNhbGVzL2pzb24nKS5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhLm5vZGVzWzJdO1xyXG4gICAgICAgICAgICAkc2NvcGUuc3VjdXJzYWxlcyA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgICAgICAgICB2YXIgbm9kZTtcclxuICAgICAgICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAgICAgICRzY29wZS5zdWN1cnNhbGVzW2NvdW50XSA9IGRhdGEubm9kZXNbbm9kZV07XHJcbiAgICAgICAgICAgICAgICBjb3VudCArKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLnN1Y3Vyc2FsZXMgPSAkc2NvcGUuc3VjdXJzYWxlcztcclxuICAgICAgICB9KTtcclxuICAgICAgICAkc2NvcGUub25DaGFuZ2VDaXVkYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIHBhdGhzPXt9XHJcbiAgICAgICAgICAgIHZhciBwYXRoO1xyXG4gICAgICAgICAgICBwYXRoID0gJGxvY2F0aW9uLnBhdGgoKVxyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLnN1Y3Vyc2FsID0gJHNjb3BlLnN1Y3Vyc2FsO1xyXG4gICAgICAgICAgICAkbG9jYXRpb24ucGF0aChwYXRoICsgJHJvb3RTY29wZS5zdWN1cnNhbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICB9XSk7XHJcbiIsImJsYWFBcHAuY29udHJvbGxlcignTm9kZUNvbnRyb2xsZXInLFxyXG4gIC8vIFsnJHNjb3BlJywgJyRodHRwJyxcclxuICBbJyRzY29wZScsICckaHR0cCcsICckcm91dGVQYXJhbXMnLCAnJGZpbHRlcicsICckdGltZW91dCcsICckc3RhdGUnLCAnJHNjZScsICckd2luZG93JywgJyRsb2NhdGlvbicsICdFTlZJUk9OTUVOVCcsXHJcbiAgZnVuY3Rpb24gKCRzY29wZSwgJGh0dHAsICRyb3V0ZVBhcmFtcywgJGZpbHRlciwgJHRpbWVvdXQsICRzdGF0ZSwgJHNjZSwgJHdpbmRvdywgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCkge1xyXG4gIC8vIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwKSB7XHJcblxyXG4gIGlmICgkcm91dGVQYXJhbXMuaGFzT3duUHJvcGVydHkoJ3RpdGxlSWQnKSkge1xyXG4gICAgJHNjb3BlLm5pZCA9ICRmaWx0ZXIoJ2V4dHJhY3ROaWRTdHJpbmcnKSgkcm91dGVQYXJhbXMudGl0bGVJZCk7XHJcbiAgfVxyXG5cclxuICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrJ2FwaS9ub2RlLycrJHNjb3BlLm5pZCsnLmpzb24nKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICRzY29wZS5ub2RlID0gZGF0YTtcclxuXHJcbiAgICBpZignYm9keScgaW4gJHNjb3BlLm5vZGUgJiYgJ3VuZCcgaW4gJHNjb3BlLm5vZGUuYm9keSl7XHJcbiAgICAgICRzY29wZS5ub2RlLmJvZHkudW5kWzBdLnNhZmVfdmFsdWUgPSAkc2NlLnRydXN0QXNIdG1sKGRhdGEuYm9keS51bmRbMF0uc2FmZV92YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2coZGF0YSk7XHJcbiAgfSk7XHJcbn1dKTtcclxuIiwiLypTRUNDSU9OIE5PVElDSUFTKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdOb3RpY2lhc0NvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlKXtcclxuICAgIHZhciBwYXRoID0gJ2FydGljdWxvc0pTT04nO1xyXG4gICAgdmFyIG5vZGU7XHJcbiAgICAkc2NvcGUuYXJ0aWNsZXMgPSB7fTtcclxuICAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgICRzY29wZS5hcnRpY2xlc1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV1bJ25vZGUnXVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1dKTtcclxuIiwiLypTRUNDSU9OIE9QVVMqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ09wdXNDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCdFTlZJUk9OTUVOVCcsIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwLCBFTlZJUk9OTUVOVCkge1xyXG4gICAgJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb25jaWVydG9zL2pzb24nKS5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgJHNjb3BlLmNvbmNlcnRzID0gZGF0YS5ub2RlcztcclxuICAgIH0pO1xyXG5cclxufV0pO1xyXG4iLCIvKlxuICBCbGFhIC0gRGF5c2NyaXB0XG4gIEJpYmxpb3RlY2EgZGUgY2xhc2VzIHBhcmEgZXN0aWxvc1xuICBjb3B5cmlndGggMjAxNiAtIEJvZ290YS1Db2xvbWJpYVxuKi9cbmJsYWFBcHAuY29udHJvbGxlcignUGFnZUNvbnRyb2xsZXInLFsnJHNjb3BlJywnJGxvZycsJyRsb2NhdGlvbicsICckdGltZW91dCcgLGZ1bmN0aW9uKCRzY29wZSwgJGxvZywgJGxvY2F0aW9uLCAkdGltZW91dCkge1xuXG4gIHZhciBjb2xvdXJNYXAgPSB7XG4gICAgaW5kZXggOiAnY0luZGV4JyxcbiAgICBiaWJsaW90ZWNhczogXCJjQmlibGlvXCIsXG4gIH07XG5cbiAgJHNjb3BlLkdldENsYXNzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgcGF0aENsYXNzID0gJGxvY2F0aW9uLnBhdGgoKVxuICAgIC8vY29uc29sZS5sb2cocGF0aENsYXNzKVxuICAgIHBhdGhDbGFzcyA9IHBhdGhDbGFzcy5zcGxpdCgnLycpXG4gICAgcGF0aENsYXNzLnNoaWZ0KClcbiAgICByZXR1cm4gY29sb3VyTWFwW3BhdGhDbGFzc1swXV07XG4gIH1cblxuICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICQoZG9jdW1lbnQpLmZvdW5kYXRpb24oKTtcbiAgfSwgMzAwMCk7XG59XSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
