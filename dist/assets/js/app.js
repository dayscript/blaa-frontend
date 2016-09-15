'use strict';
var blaaApp = angular.module('blaaApp', ['ngSanitize','ngRoute','ncy-angular-breadcrumb',
                                         'ngPrettyJson','chieffancypants.loadingBar',
                                         'ngAnimate','ngPrettyJson','angular-google-analytics'])
    .constant('ENVIRONMENT', 'http://blaa.demodayscript.com/')
    .constant('ENVIRONMENTFRONT', '/')
    .config(function(cfpLoadingBarProvider) {
      cfpLoadingBarProvider.includeSpinner = true;
    })
    .config(function (AnalyticsProvider) {
      AnalyticsProvider.useAnalytics(false);
      AnalyticsProvider.setAccount('UA-43463194-1');
      AnalyticsProvider.trackPages(true);
    });

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


    $routeProvider.when('/', {
        templateUrl: 'home.html'
    })
    .when('/bibliotecas/memorias-orales', {
        templateUrl: '/bibliotecas/memorias-orales/memorias-orales.html',
        controller: 'MemoriasOralesController',
         pageTrack: '/bibliotecas/memorias-orales'
    })
    .when('/bibliotecas/memorias-orales/:titleId', {
        templateUrl: '/bibliotecas/memorias-orales/interna-colecciones.html',
        controller: 'NodeController',
        pageTrack: '/bibliotecas/memorias-orales'

      })
    .when('/bibliotecas/memorias-orales/noticias', {
        templateUrl: '/bibliotecas/memorias-orales/noticias-interna.html',
        controller: 'MemoriasOralesController',
        pageTrack: '/bibliotecas/memorias-orales/noticias'

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC1jb25maWd1cmUuanMiLCJhcHAtcm91dGUuanMiLCJBcHBDb250cm9sbGVyLmpzIiwiQmFubmVyUHJpbmNpcGFsQ29udHJvbGxlci5qcyIsIkJyZWFkQ3J1bWJDb250cm9sbGVyLmpzIiwiRXZlbnRvc0NvbnRyb2xsZXIuanMiLCJMaW5lYURlVGllbXBvQ29udHJvbGxlci5qcyIsIk1lbW9yaWFzT3JhbGVzQ29udHJvbGxlci5qcyIsIk1lbnVDb250cm9sbGVyLmpzIiwiTm9kZUNvbnRyb2xsZXIuanMiLCJOb3RpY2lhc0NvbnRyb2xsZXIuanMiLCJPcHVzQ29udHJvbGxlci5qcyIsIlBhZ2VDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG52YXIgYmxhYUFwcCA9IGFuZ3VsYXIubW9kdWxlKCdibGFhQXBwJywgWyduZ1Nhbml0aXplJywnbmdSb3V0ZScsJ25jeS1hbmd1bGFyLWJyZWFkY3J1bWInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdQcmV0dHlKc29uJywnY2hpZWZmYW5jeXBhbnRzLmxvYWRpbmdCYXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdBbmltYXRlJywnbmdQcmV0dHlKc29uJywnYW5ndWxhci1nb29nbGUtYW5hbHl0aWNzJ10pXG4gICAgLmNvbnN0YW50KCdFTlZJUk9OTUVOVCcsICdodHRwOi8vYmxhYS5kZW1vZGF5c2NyaXB0LmNvbS8nKVxuICAgIC5jb25zdGFudCgnRU5WSVJPTk1FTlRGUk9OVCcsICcvJylcbiAgICAuY29uZmlnKGZ1bmN0aW9uKGNmcExvYWRpbmdCYXJQcm92aWRlcikge1xuICAgICAgY2ZwTG9hZGluZ0JhclByb3ZpZGVyLmluY2x1ZGVTcGlubmVyID0gdHJ1ZTtcbiAgICB9KVxuICAgIC5jb25maWcoZnVuY3Rpb24gKEFuYWx5dGljc1Byb3ZpZGVyKSB7XG4gICAgICBBbmFseXRpY3NQcm92aWRlci51c2VBbmFseXRpY3MoZmFsc2UpO1xuICAgICAgQW5hbHl0aWNzUHJvdmlkZXIuc2V0QWNjb3VudCgnVUEtNDM0NjMxOTQtMScpO1xuICAgICAgQW5hbHl0aWNzUHJvdmlkZXIudHJhY2tQYWdlcyh0cnVlKTtcbiAgICB9KTtcblxuYmxhYUFwcC5maWx0ZXIoJ2V4dHJhY3ROaWRTdHJpbmcnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgdmFyIHJlZ2V4ID0gL1xcZCskLztcbiAgICAgIHZhciBtYXRjaGVzID0gc3RyaW5nLm1hdGNoKHJlZ2V4KTtcblxuICAgICAgcmV0dXJuIChtYXRjaGVzID8gbWF0Y2hlcy5zaGlmdCgpIDogMCk7XG4gIH07XG59KTtcblxuXG5mdW5jdGlvbiBwcmludCh0ZXh0LHZhcmlhYmxlKXtcbiAgICBjb25zb2xlLmxvZyh0ZXh0Kyc6Jyt2YXJpYWJsZSk7XG59XG4iLCJibGFhQXBwLmNvbmZpZyhbJyRyb3V0ZVByb3ZpZGVyJywnJGxvY2F0aW9uUHJvdmlkZXInLCdBbmFseXRpY3NQcm92aWRlcicsZnVuY3Rpb24oJHJvdXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLEFuYWx5dGljc1Byb3ZpZGVyKSB7XG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaGFzaFByZWZpeCgnIScpO1xuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcblxuXG4gICAgJHJvdXRlUHJvdmlkZXIud2hlbignLycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdob21lLmh0bWwnXG4gICAgfSlcbiAgICAud2hlbignL2JpYmxpb3RlY2FzL21lbW9yaWFzLW9yYWxlcycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICcvYmlibGlvdGVjYXMvbWVtb3JpYXMtb3JhbGVzL21lbW9yaWFzLW9yYWxlcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ01lbW9yaWFzT3JhbGVzQ29udHJvbGxlcicsXG4gICAgICAgICBwYWdlVHJhY2s6ICcvYmlibGlvdGVjYXMvbWVtb3JpYXMtb3JhbGVzJ1xuICAgIH0pXG4gICAgLndoZW4oJy9iaWJsaW90ZWNhcy9tZW1vcmlhcy1vcmFsZXMvOnRpdGxlSWQnLCB7XG4gICAgICAgIHRlbXBsYXRlVXJsOiAnL2JpYmxpb3RlY2FzL21lbW9yaWFzLW9yYWxlcy9pbnRlcm5hLWNvbGVjY2lvbmVzLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTm9kZUNvbnRyb2xsZXInLFxuICAgICAgICBwYWdlVHJhY2s6ICcvYmlibGlvdGVjYXMvbWVtb3JpYXMtb3JhbGVzJ1xuXG4gICAgICB9KVxuICAgIC53aGVuKCcvYmlibGlvdGVjYXMvbWVtb3JpYXMtb3JhbGVzL25vdGljaWFzJywge1xuICAgICAgICB0ZW1wbGF0ZVVybDogJy9iaWJsaW90ZWNhcy9tZW1vcmlhcy1vcmFsZXMvbm90aWNpYXMtaW50ZXJuYS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ01lbW9yaWFzT3JhbGVzQ29udHJvbGxlcicsXG4gICAgICAgIHBhZ2VUcmFjazogJy9iaWJsaW90ZWNhcy9tZW1vcmlhcy1vcmFsZXMvbm90aWNpYXMnXG5cbiAgICAgIH0pXG4gICAgLm90aGVyd2lzZSh7XG4gICAgICAgIHJlZGlyZWN0VG86ICcvNDA0J1xuICAgIH0pO1xuICAgIC8vIGNvbmZpZ3VyZSBodG1sNSB0byBnZXQgbGlua3Mgd29ya2luZyBvbiBqc2ZpZGRsZVxufV0pO1xuXG4vKmJsYWFBcHAucnVuKFsnJGxvY2F0aW9uJywgZnVuY3Rpb24gQXBwUnVuKCRsb2NhdGlvbikge1xuICAgIGRlYnVnZ2VyO1xufV0pOyovXG4iLCJibGFhQXBwLmNvbnRyb2xsZXIoJ1N1Y3Vyc2FsQ29udHJvbGxlcicsWyckc2NvcGUnLCckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsJyRzdGF0ZVBhcmFtcycsICckc3RhdGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlLCRzdGF0ZVBhcmFtcywgJHN0YXRlKXtcbiAgICAkc2NvcGUuYnJlYWRjcnVtYnMgPSBbXVxuICAgICRzdGF0ZVBhcmFtcy5zdWN1cnNhbCA/ICAkcm9vdFNjb3BlLnN1Y3Vyc2FsID0gJHN0YXRlUGFyYW1zLnN1Y3Vyc2FsOiRyb290U2NvcGUuc3VjdXJzYWwgPSAnQm9nb3TDoSc7XG4gICAgJHNjb3BlLmJyZWFkY3J1bWJzID0gJ0FjdGl2aWRhZCBDdWx0dXJhbCdcbiAgICBjb25zb2xlLmxvZygnU3VjdXJzYWw6JysgJHJvb3RTY29wZS5zdWN1cnNhbCk7XG59XSlcbiIsImJsYWFBcHAuY29udHJvbGxlcignQmFubmVyUHJpbmNpcGFsQ29udHJvbGxlcicsWyckc2NvcGUnLCckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsJyR0aW1lb3V0JywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCwgJHJvb3RTY29wZSwkdGltZW91dCl7XHJcbiAgICB2YXIgcGF0aCA9ICdiYW5uZXIvanNvbic7XHJcbiAgICB2YXIgbm9kZTtcclxuICAgICRzY29wZS5iYW5uZXJzID0ge307XHJcbiAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aCkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgJHNjb3BlLmJhbm5lcnNbbm9kZV0gPSBkYXRhLm5vZGVzW25vZGVdLm5vZGVcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XSk7XHJcbiIsIi8qU0VDQ0lPTiBCUkVBRENSVU1CKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdCcmVhZGNydW1iQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywgZnVuY3Rpb24gKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsJHJvb3RTY29wZSkge1xyXG4gICAgcHJpbnQoJ2JyZWFkY3J1bWInLCRsb2NhdGlvbi5wYXRoKCkpO1xyXG4gICAgdmFyIHBhdGhzID0ge307XHJcbiAgICBwYXRocyA9ICRsb2NhdGlvbi5wYXRoKClcclxuICAgICRzY29wZS5icmVhZGNydW1iID0ge307XHJcbiAgICBwYXRocyA9IHBhdGhzLnNwbGl0KCcvJyk7XHJcbiAgICBwYXRocy5zaGlmdCgpO1xyXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPD0gcGF0aHMubGVuZ3RoLTE7IGkrKyApe1xyXG4gICAgICAgIHBhdGhzID09IFwiXCI/ICRzY29wZS5icmVhZGNydW1iW2ldID0gcGF0aHNbMF06JHNjb3BlLmJyZWFkY3J1bWJbaV0gPSBwYXRoc1tpXTtcclxuICAgIH1cclxuICAgICRyb290U2NvcGUuYnJlYWRjcnVtYiA9ICRzY29wZS5icmVhZGNydW1iO1xyXG59XSk7IFxyXG4iLCIvKlNFQ0NJT04gU0xJREVSIEVWRU5UT1MqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ0V2ZW50b3NDb250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCwgJHJvb3RTY29wZSl7XHJcbiAgIHZhciBwYXRoID0gJ2V2ZW50b3NKU09OJztcclxuICAgdmFyIG5vZGU7XHJcbiAgICRzY29wZS5ldmVudHMgPSB7fTtcclxuICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGgpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICRzY29wZS5ldmVudHNbbm9kZV0gPSBkYXRhLm5vZGVzW25vZGVdWydub2RlJ11cclxuICAgICAgIH1cclxuICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5ldmVudHMpXHJcbiAgIH0pXHJcbn1dKTtcclxuIiwiLypTRUNDSU9OIFNMSURFUiBFVkVOVE9TKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdMaW5lYURlVGllbXBvQ29udHJvbGxlcicsWyckc2NvcGUnLCckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCl7XHJcbiAgIHZhciBwYXRoID0gJ2V2ZW50b3NKU09OJztcclxuICAgdmFyIHBhdGhUaXBvRXZlbnRvID0gJ3RheG9ub21pYXMvdGlwb2RlZXZlbnRvL2pzb24nO1xyXG4gICB2YXIgbm9kZTtcclxuICAgJHNjb3BlLmV2ZW50cyA9IHt9O1xyXG4gICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aCkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgJHNjb3BlLmV2ZW50c1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV1bJ25vZGUnXVxyXG4gICAgICAgfVxyXG4gICB9KVxyXG4gICAkc2NvcGUudGlwb0V2ZW50b3MgPSB7fTtcclxuICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGhUaXBvRXZlbnRvKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAkc2NvcGUudGlwb0V2ZW50b3Nbbm9kZV0gPSBkYXRhLm5vZGVzW25vZGVdWydub2RlJ11cclxuICAgICAgIH1cclxuICAgfSlcclxufV0pO1xyXG4iLCIvKlxuICBCbGFhIC0gRGF5c2NyaXB0XG4gIEJpYmxpb3RlY2EgZGUgY2xhc2VzIHBhcmEgZXN0aWxvc1xuICBjb3B5cmlndGggMjAxNiAtIEJvZ290YS1Db2xvbWJpYVxuKi9cbmJsYWFBcHAuY29udHJvbGxlcignTWVtb3JpYXNPcmFsZXNDb250cm9sbGVyJyxbJyRzY29wZScsICckaHR0cCcsICdFTlZJUk9OTUVOVCcsJyR0aW1lb3V0JywgJyRxJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgRU5WSVJPTk1FTlQsICR0aW1lb3V0LCAkcSkge1xuXG4gICRzY29wZS5jb2xsZWN0aW9ucyA9IFtdO1xuXG4gIHZhciBwcm9taXNlcyA9IFtdO1xuICBwcm9taXNlcy5wdXNoKCRodHRwLmdldChFTlZJUk9OTUVOVCsnY29sZWNjaW9uZXMvanNvbi9tYXMtcmVjaWVudGVzL01lbW9yaWEgb3JhbCcpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciB0ZW1wb3JhbCA9IFtdO1xuICAgIHZhciBzbGlkZXIgPSB7XG4gICAgICBcInRpdGxlXCI6IFwiTG8gbcOhcyBSZWNpZW50ZVwiLFxuICAgICAgXCJub2Rlc1wiOiBbXVxuICAgIH07XG5cbiAgICBhbmd1bGFyLmZvckVhY2goZGF0YS5ub2RlcywgZnVuY3Rpb24oY29sbGVjdGlvbiwga2V5KSB7XG4gICAgICBpZiggKGtleSsxKSAlICA0ID09IDAgfHwga2V5ID09IGRhdGEubm9kZXMubGVuZ3RoKXtcbiAgICAgICAgc2xpZGVyLm5vZGVzLnB1c2godGVtcG9yYWwpO1xuICAgICAgICB0ZW1wb3JhbCA9IFtdO1xuICAgICAgfWVsc2V7XG4gICAgICAgIGNvbGxlY3Rpb24ubGlua3MgPSBjb2xsZWN0aW9uLmxpbmtzLnNwbGl0KCcsJylcbiAgICAgICAgY29sbGVjdGlvbi5jb2xvciA9IHsnYmFja2dyb3VuZC1jb2xvcic6Y29sbGVjdGlvbi5jb2xvcn1cbiAgICAgICAgdGVtcG9yYWwucHVzaChjb2xsZWN0aW9uKTtcblxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHNjb3BlLmNvbGxlY3Rpb25zLnB1c2goc2xpZGVyKTtcbiAgfSkpO1xuXG4gIHByb21pc2VzLnB1c2goJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb2xlY2Npb25lcy9qc29uL21hcy1kZXN0YWNhZG9zL01lbW9yaWEgb3JhbCcpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciB0ZW1wb3JhbCA9IFtdO1xuICAgIHZhciBzbGlkZXIgPSB7XG4gICAgICBcInRpdGxlXCI6IFwiTG8gbcOhcyBEZXN0YWNhZG9cIixcbiAgICAgIFwibm9kZXNcIjogW11cbiAgICB9O1xuXG4gICAgYW5ndWxhci5mb3JFYWNoKGRhdGEubm9kZXMsIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGtleSkge1xuICAgICAgaWYoKGtleSsxKSAlIDQgPT0gMCB8fCBrZXkgPT0gZGF0YS5ub2Rlcy5sZW5ndGgpe1xuICAgICAgICBzbGlkZXIubm9kZXMucHVzaCh0ZW1wb3JhbCk7XG4gICAgICAgIHRlbXBvcmFsID0gW107XG4gICAgICB9ZWxzZXtcbiAgICAgICAgY29sbGVjdGlvbi5saW5rcyA9IGNvbGxlY3Rpb24ubGlua3Muc3BsaXQoJywnKVxuICAgICAgICBjb2xsZWN0aW9uLmNvbG9yID0geydiYWNrZ3JvdW5kLWNvbG9yJzpjb2xsZWN0aW9uLmNvbG9yfVxuXG4gICAgICAgIHRlbXBvcmFsLnB1c2goY29sbGVjdGlvbik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgJHNjb3BlLmNvbGxlY3Rpb25zLnB1c2goc2xpZGVyKTtcbiAgfSkpO1xuXG4gIHByb21pc2VzLnB1c2goJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb2xlY2Npb25lcy9qc29uL21hcy1wb3B1bGFyZXMvTWVtb3JpYSBvcmFsJykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHRlbXBvcmFsID0gW107XG4gICAgdmFyIHNsaWRlciA9IHtcbiAgICAgIFwidGl0bGVcIjogXCJMbyBtw6FzIFBvcHVsYXJcIixcbiAgICAgIFwibm9kZXNcIjogW11cbiAgICB9O1xuXG4gICAgYW5ndWxhci5mb3JFYWNoKGRhdGEubm9kZXMsIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGtleSkge1xuICAgICAgaWYoKGtleSsxKSAlIDQgPT0gMCB8fCBrZXkgPT0gZGF0YS5ub2Rlcy5sZW5ndGgpe1xuICAgICAgICBzbGlkZXIubm9kZXMucHVzaCh0ZW1wb3JhbCk7XG4gICAgICAgIHRlbXBvcmFsID0gW107XG4gICAgICB9ZWxzZXtcbiAgICAgICAgY29sbGVjdGlvbi5saW5rcyA9IGNvbGxlY3Rpb24ubGlua3Muc3BsaXQoJywnKVxuICAgICAgICBjb2xsZWN0aW9uLmNvbG9yID0geydiYWNrZ3JvdW5kLWNvbG9yJzpjb2xsZWN0aW9uLmNvbG9yfVxuICAgICAgICB0ZW1wb3JhbC5wdXNoKGNvbGxlY3Rpb24pO1xuICAgICAgfVxuICAgIH0pO1xuICAgICRzY29wZS5jb2xsZWN0aW9ucy5wdXNoKHNsaWRlcik7XG5cbiAgfSkpO1xuICBjb25zb2xlLmxvZygkc2NvcGUuY29sbGVjdGlvbnMpXG5cbiAgLy8gd2FpdCB0byBhbGwgcHJvbWlzZXMgcmVzb2x2ZVxuICB2YXIgYWxsID0gJHEuYWxsKHByb21pc2VzKTtcblxuICBhbGwudGhlbihmdW5jdGlvbigpe1xuXG4gICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAkKGRvY3VtZW50KS5mb3VuZGF0aW9uKCk7XG4gICAgfSwgMCk7XG5cbiAgfSk7XG5cblxufV0pO1xuIiwiLypTRUNDSU9OIE1FTlVTKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdNZW51Q29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywgJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnRU5WSVJPTk1FTlRGUk9OVCcsJyRyb290U2NvcGUnLFxyXG4gICAgZnVuY3Rpb24gKCAkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sRU5WSVJPTk1FTlQsRU5WSVJPTk1FTlRGUk9OVCwkcm9vdFNjb3BlKSB7XHJcbiAgICAgICAgdmFyIGJyZWFkY3J1bWI7XHJcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoKSA9PSAnLycgPyAkc2NvcGUucGF0aCA9ICcvJzokc2NvcGUucGF0aCA9ICRsb2NhdGlvbi5wYXRoKClcclxuXHJcbiAgICAgICAgJGh0dHAuZ2V0KEVOVklST05NRU5URlJPTlQrJ2Fzc2V0cy9kYXRhL01lbnVfcHJpbmNpcGFsLmpzJykuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAkc2NvcGUubWVudSA9IGRhdGEubm9kZXNbMF07XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJHNjb3BlLm1lbnUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRodHRwLmdldChFTlZJUk9OTUVOVCsnc3VjdXJzYWxlcy9qc29uJykuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICBkZWxldGUgZGF0YS5ub2Rlc1syXTtcclxuICAgICAgICAgICAgJHNjb3BlLnN1Y3Vyc2FsZXMgPSBbXTtcclxuICAgICAgICAgICAgdmFyIGNvdW50ID0gMDtcclxuICAgICAgICAgICAgdmFyIG5vZGU7XHJcbiAgICAgICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3VjdXJzYWxlc1tjb3VudF0gPSBkYXRhLm5vZGVzW25vZGVdO1xyXG4gICAgICAgICAgICAgICAgY291bnQgKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJHJvb3RTY29wZS5zdWN1cnNhbGVzID0gJHNjb3BlLnN1Y3Vyc2FsZXM7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJHNjb3BlLm9uQ2hhbmdlQ2l1ZGFkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXRocz17fVxyXG4gICAgICAgICAgICB2YXIgcGF0aDtcclxuICAgICAgICAgICAgcGF0aCA9ICRsb2NhdGlvbi5wYXRoKClcclxuICAgICAgICAgICAgJHJvb3RTY29wZS5zdWN1cnNhbCA9ICRzY29wZS5zdWN1cnNhbDtcclxuICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgocGF0aCArICRyb290U2NvcGUuc3VjdXJzYWwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgfV0pO1xyXG4iLCJibGFhQXBwLmNvbnRyb2xsZXIoJ05vZGVDb250cm9sbGVyJyxcclxuICAvLyBbJyRzY29wZScsICckaHR0cCcsXHJcbiAgWyckc2NvcGUnLCAnJGh0dHAnLCAnJHJvdXRlUGFyYW1zJywgJyRmaWx0ZXInLCAnJHRpbWVvdXQnLCAnJHN0YXRlJywgJyRzY2UnLCAnJHdpbmRvdycsICckbG9jYXRpb24nLCAnRU5WSVJPTk1FTlQnLFxyXG4gIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwLCAkcm91dGVQYXJhbXMsICRmaWx0ZXIsICR0aW1lb3V0LCAkc3RhdGUsICRzY2UsICR3aW5kb3csICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQpIHtcclxuICAvLyBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCkge1xyXG5cclxuICBpZiAoJHJvdXRlUGFyYW1zLmhhc093blByb3BlcnR5KCd0aXRsZUlkJykpIHtcclxuICAgICRzY29wZS5uaWQgPSAkZmlsdGVyKCdleHRyYWN0TmlkU3RyaW5nJykoJHJvdXRlUGFyYW1zLnRpdGxlSWQpO1xyXG4gIH1cclxuXHJcbiAgJGh0dHAuZ2V0KEVOVklST05NRU5UKydhcGkvbm9kZS8nKyRzY29wZS5uaWQrJy5qc29uJykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAkc2NvcGUubm9kZSA9IGRhdGE7XHJcblxyXG4gICAgaWYoJ2JvZHknIGluICRzY29wZS5ub2RlICYmICd1bmQnIGluICRzY29wZS5ub2RlLmJvZHkpe1xyXG4gICAgICAkc2NvcGUubm9kZS5ib2R5LnVuZFswXS5zYWZlX3ZhbHVlID0gJHNjZS50cnVzdEFzSHRtbChkYXRhLmJvZHkudW5kWzBdLnNhZmVfdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gIH0pO1xyXG59XSk7XHJcbiIsIi8qU0VDQ0lPTiBOT1RJQ0lBUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignTm90aWNpYXNDb250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCwgJHJvb3RTY29wZSl7XHJcbiAgICB2YXIgcGF0aCA9ICdhcnRpY3Vsb3NKU09OJztcclxuICAgIHZhciBub2RlO1xyXG4gICAgJHNjb3BlLmFydGljbGVzID0ge307XHJcbiAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aCkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICAkc2NvcGUuYXJ0aWNsZXNbbm9kZV0gPSBkYXRhLm5vZGVzW25vZGVdWydub2RlJ11cclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XSk7XHJcbiIsIi8qU0VDQ0lPTiBPUFVTKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdPcHVzQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywnRU5WSVJPTk1FTlQnLCBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCwgRU5WSVJPTk1FTlQpIHtcclxuICAgICRodHRwLmdldChFTlZJUk9OTUVOVCsnY29uY2llcnRvcy9qc29uJykuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICRzY29wZS5jb25jZXJ0cyA9IGRhdGEubm9kZXM7XHJcbiAgICB9KTtcclxuXHJcbn1dKTtcclxuIiwiLypcbiAgQmxhYSAtIERheXNjcmlwdFxuICBCaWJsaW90ZWNhIGRlIGNsYXNlcyBwYXJhIGVzdGlsb3NcbiAgY29weXJpZ3RoIDIwMTYgLSBCb2dvdGEtQ29sb21iaWFcbiovXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ1BhZ2VDb250cm9sbGVyJyxbJyRzY29wZScsJyRsb2cnLCckbG9jYXRpb24nLCAnJHRpbWVvdXQnICxmdW5jdGlvbigkc2NvcGUsICRsb2csICRsb2NhdGlvbiwgJHRpbWVvdXQpIHtcblxuICB2YXIgY29sb3VyTWFwID0ge1xuICAgIGluZGV4IDogJ2NJbmRleCcsXG4gICAgYmlibGlvdGVjYXM6IFwiY0JpYmxpb1wiLFxuICB9O1xuXG4gICRzY29wZS5HZXRDbGFzcyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHBhdGhDbGFzcyA9ICRsb2NhdGlvbi5wYXRoKClcbiAgICAvL2NvbnNvbGUubG9nKHBhdGhDbGFzcylcbiAgICBwYXRoQ2xhc3MgPSBwYXRoQ2xhc3Muc3BsaXQoJy8nKVxuICAgIHBhdGhDbGFzcy5zaGlmdCgpXG4gICAgcmV0dXJuIGNvbG91ck1hcFtwYXRoQ2xhc3NbMF1dO1xuICB9XG5cbiAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAkKGRvY3VtZW50KS5mb3VuZGF0aW9uKCk7XG4gIH0sIDMwMDApO1xufV0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
