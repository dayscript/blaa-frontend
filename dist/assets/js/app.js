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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC1jb25maWd1cmUuanMiLCJhcHAtcm91dGUuanMiLCJBcHBDb250cm9sbGVyLmpzIiwiQmFubmVyUHJpbmNpcGFsQ29udHJvbGxlci5qcyIsIkJyZWFkQ3J1bWJDb250cm9sbGVyLmpzIiwiRXZlbnRvc0NvbnRyb2xsZXIuanMiLCJMaW5lYURlVGllbXBvQ29udHJvbGxlci5qcyIsIk1lbW9yaWFzT3JhbGVzQ29udHJvbGxlci5qcyIsIk1lbnVDb250cm9sbGVyLmpzIiwiTm90aWNpYXNDb250cm9sbGVyLmpzIiwiT3B1c0NvbnRyb2xsZXIuanMiLCJQYWdlQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbnZhciBibGFhQXBwID0gYW5ndWxhci5tb2R1bGUoJ2JsYWFBcHAnLCBbJ25nU2FuaXRpemUnLCduZ1JvdXRlJywnbmN5LWFuZ3VsYXItYnJlYWRjcnVtYicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICduZ1ByZXR0eUpzb24nLCdjaGllZmZhbmN5cGFudHMubG9hZGluZ0JhcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICduZ0FuaW1hdGUnLCduZ1ByZXR0eUpzb24nXSlcbiAgICAuY29uc3RhbnQoJ0VOVklST05NRU5UJywgJ2h0dHA6Ly9ibGFhLmRlbW9kYXlzY3JpcHQuY29tLycpXG4gICAgLmNvbnN0YW50KCdFTlZJUk9OTUVOVEZST05UJywgJy8nKVxuICAgIC5jb25maWcoZnVuY3Rpb24oY2ZwTG9hZGluZ0JhclByb3ZpZGVyKSB7XG4gICAgICBjZnBMb2FkaW5nQmFyUHJvdmlkZXIuaW5jbHVkZVNwaW5uZXIgPSB0cnVlO1xuICAgIH0pO1xuXG5cbmZ1bmN0aW9uIHByaW50KHRleHQsdmFyaWFibGUpe1xuICAgIGNvbnNvbGUubG9nKHRleHQrJzonK3ZhcmlhYmxlKTtcbn0iLCJibGFhQXBwLmNvbmZpZyhbJyRyb3V0ZVByb3ZpZGVyJywnJGxvY2F0aW9uUHJvdmlkZXInLGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJyEnKTtcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG5cbiAgICAkcm91dGVQcm92aWRlci53aGVuKCcvJywge1xuICAgICAgICB0ZW1wbGF0ZVVybDogJ2hvbWUuaHRtbCdcbiAgICB9KVxuICAgIC53aGVuKCcvYmlibGlvdGVjYXMvbWVtb3JpYXMtb3JhbGVzJywge1xuICAgICAgICB0ZW1wbGF0ZVVybDogJy9iaWJsaW90ZWNhcy9tZW1vcmlhcy1vcmFsZXMvbWVtb3JpYXMtb3JhbGVzLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTWVtb3JpYXNPcmFsZXNDb250cm9sbGVyJ1xuICAgIH0pXG4gICAgICAgIC53aGVuKCcvYmlibGlvdGVjYXMvbWVtb3JpYXMtb3JhbGVzL25vdGljaWFzJywge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdub3RpY2lhcy5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdNZW1vcmlhc09yYWxlc0NvbnRyb2xsZXInXG4gICAgICAgIH0pXG4gICAgLm90aGVyd2lzZSh7XG4gICAgICAgIHJlZGlyZWN0VG86ICcvNDA0J1xuICAgIH0pO1xuICAgIC8vIGNvbmZpZ3VyZSBodG1sNSB0byBnZXQgbGlua3Mgd29ya2luZyBvbiBqc2ZpZGRsZVxufV0pO1xuXG4vKmJsYWFBcHAucnVuKFsnJGxvY2F0aW9uJywgZnVuY3Rpb24gQXBwUnVuKCRsb2NhdGlvbikge1xuICAgIGRlYnVnZ2VyO1xufV0pOyovXG4iLCJibGFhQXBwLmNvbnRyb2xsZXIoJ1N1Y3Vyc2FsQ29udHJvbGxlcicsWyckc2NvcGUnLCckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsJyRzdGF0ZVBhcmFtcycsICckc3RhdGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlLCRzdGF0ZVBhcmFtcywgJHN0YXRlKXtcbiAgICAkc2NvcGUuYnJlYWRjcnVtYnMgPSBbXVxuICAgICRzdGF0ZVBhcmFtcy5zdWN1cnNhbCA/ICAkcm9vdFNjb3BlLnN1Y3Vyc2FsID0gJHN0YXRlUGFyYW1zLnN1Y3Vyc2FsOiRyb290U2NvcGUuc3VjdXJzYWwgPSAnQm9nb3TDoSc7XG4gICAgJHNjb3BlLmJyZWFkY3J1bWJzID0gJ0FjdGl2aWRhZCBDdWx0dXJhbCdcbiAgICBjb25zb2xlLmxvZygnU3VjdXJzYWw6JysgJHJvb3RTY29wZS5zdWN1cnNhbCk7XG59XSlcbiIsImJsYWFBcHAuY29udHJvbGxlcignQmFubmVyUHJpbmNpcGFsQ29udHJvbGxlcicsWyckc2NvcGUnLCckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsJyR0aW1lb3V0JywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCwgJHJvb3RTY29wZSwkdGltZW91dCl7XHJcbiAgICB2YXIgcGF0aCA9ICdiYW5uZXIvanNvbic7XHJcbiAgICB2YXIgbm9kZTtcclxuICAgICRzY29wZS5iYW5uZXJzID0ge307XHJcbiAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aCkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgJHNjb3BlLmJhbm5lcnNbbm9kZV0gPSBkYXRhLm5vZGVzW25vZGVdLm5vZGVcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XSk7XHJcbiIsIi8qU0VDQ0lPTiBCUkVBRENSVU1CKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdCcmVhZGNydW1iQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywgZnVuY3Rpb24gKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsJHJvb3RTY29wZSkge1xyXG4gICAgcHJpbnQoJ2JyZWFkY3J1bWInLCRsb2NhdGlvbi5wYXRoKCkpO1xyXG4gICAgdmFyIHBhdGhzID0ge307XHJcbiAgICBwYXRocyA9ICRsb2NhdGlvbi5wYXRoKClcclxuICAgICRzY29wZS5icmVhZGNydW1iID0ge307XHJcbiAgICBwYXRocyA9IHBhdGhzLnNwbGl0KCcvJyk7XHJcbiAgICBwYXRocy5zaGlmdCgpO1xyXG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPD0gcGF0aHMubGVuZ3RoLTE7IGkrKyApe1xyXG4gICAgICAgIHBhdGhzID09IFwiXCI/ICRzY29wZS5icmVhZGNydW1iW2ldID0gcGF0aHNbMF06JHNjb3BlLmJyZWFkY3J1bWJbaV0gPSBwYXRoc1tpXTtcclxuICAgIH1cclxuICAgICRyb290U2NvcGUuYnJlYWRjcnVtYiA9ICRzY29wZS5icmVhZGNydW1iO1xyXG59XSk7IFxyXG4iLCIvKlNFQ0NJT04gU0xJREVSIEVWRU5UT1MqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ0V2ZW50b3NDb250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCwgJHJvb3RTY29wZSl7XHJcbiAgIHZhciBwYXRoID0gJ2V2ZW50b3NKU09OJztcclxuICAgdmFyIG5vZGU7XHJcbiAgICRzY29wZS5ldmVudHMgPSB7fTtcclxuICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGgpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICRzY29wZS5ldmVudHNbbm9kZV0gPSBkYXRhLm5vZGVzW25vZGVdWydub2RlJ11cclxuICAgICAgIH1cclxuICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5ldmVudHMpXHJcbiAgIH0pXHJcbn1dKTtcclxuIiwiLypTRUNDSU9OIFNMSURFUiBFVkVOVE9TKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdMaW5lYURlVGllbXBvQ29udHJvbGxlcicsWyckc2NvcGUnLCckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCl7XHJcbiAgIHZhciBwYXRoID0gJ2V2ZW50b3NKU09OJztcclxuICAgdmFyIHBhdGhUaXBvRXZlbnRvID0gJ3RheG9ub21pYXMvdGlwb2RlZXZlbnRvL2pzb24nO1xyXG4gICB2YXIgbm9kZTtcclxuICAgJHNjb3BlLmV2ZW50cyA9IHt9O1xyXG4gICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aCkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgJHNjb3BlLmV2ZW50c1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV1bJ25vZGUnXVxyXG4gICAgICAgfVxyXG4gICB9KVxyXG4gICAkc2NvcGUudGlwb0V2ZW50b3MgPSB7fTtcclxuICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGhUaXBvRXZlbnRvKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAkc2NvcGUudGlwb0V2ZW50b3Nbbm9kZV0gPSBkYXRhLm5vZGVzW25vZGVdWydub2RlJ11cclxuICAgICAgIH1cclxuICAgfSlcclxufV0pO1xyXG4iLCIvKlxuICBCbGFhIC0gRGF5c2NyaXB0XG4gIEJpYmxpb3RlY2EgZGUgY2xhc2VzIHBhcmEgZXN0aWxvc1xuICBjb3B5cmlndGggMjAxNiAtIEJvZ290YS1Db2xvbWJpYVxuKi9cbmJsYWFBcHAuY29udHJvbGxlcignTWVtb3JpYXNPcmFsZXNDb250cm9sbGVyJyxbJyRzY29wZScsICckaHR0cCcsICdFTlZJUk9OTUVOVCcsJyR0aW1lb3V0JywgJyRxJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgRU5WSVJPTk1FTlQsICR0aW1lb3V0LCAkcSkge1xuXG4gICRzY29wZS5jb2xsZWN0aW9ucyA9IFtdO1xuXG4gIHZhciBwcm9taXNlcyA9IFtdO1xuICBwcm9taXNlcy5wdXNoKCRodHRwLmdldChFTlZJUk9OTUVOVCsnY29sZWNjaW9uZXMvanNvbi9tYXMtcmVjaWVudGVzL01lbW9yaWEgb3JhbCcpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciB0ZW1wb3JhbCA9IFtdO1xuICAgIHZhciBzbGlkZXIgPSB7XG4gICAgICBcInRpdGxlXCI6IFwiTG8gbcOhcyBSZWNpZW50ZVwiLFxuICAgICAgXCJub2Rlc1wiOiBbXVxuICAgIH07XG5cbiAgICBhbmd1bGFyLmZvckVhY2goZGF0YS5ub2RlcywgZnVuY3Rpb24oY29sbGVjdGlvbiwga2V5KSB7XG4gICAgICBpZiggKGtleSsxKSAlICA0ID09IDAgfHwga2V5ID09IGRhdGEubm9kZXMubGVuZ3RoKXtcbiAgICAgICAgc2xpZGVyLm5vZGVzLnB1c2godGVtcG9yYWwpO1xuICAgICAgICB0ZW1wb3JhbCA9IFtdO1xuICAgICAgfWVsc2V7XG4gICAgICAgIGNvbGxlY3Rpb24ubGlua3MgPSBjb2xsZWN0aW9uLmxpbmtzLnNwbGl0KCcsJylcbiAgICAgICAgdGVtcG9yYWwucHVzaChjb2xsZWN0aW9uKTtcblxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHNjb3BlLmNvbGxlY3Rpb25zLnB1c2goc2xpZGVyKTtcbiAgfSkpO1xuXG4gIHByb21pc2VzLnB1c2goJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb2xlY2Npb25lcy9qc29uL21hcy1kZXN0YWNhZG9zL01lbW9yaWEgb3JhbCcpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciB0ZW1wb3JhbCA9IFtdO1xuICAgIHZhciBzbGlkZXIgPSB7XG4gICAgICBcInRpdGxlXCI6IFwiTG8gbcOhcyBEZXN0YWNhZG9cIixcbiAgICAgIFwibm9kZXNcIjogW11cbiAgICB9O1xuXG4gICAgYW5ndWxhci5mb3JFYWNoKGRhdGEubm9kZXMsIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGtleSkge1xuICAgICAgaWYoKGtleSsxKSAlIDQgPT0gMCB8fCBrZXkgPT0gZGF0YS5ub2Rlcy5sZW5ndGgpe1xuICAgICAgICBzbGlkZXIubm9kZXMucHVzaCh0ZW1wb3JhbCk7XG4gICAgICAgIHRlbXBvcmFsID0gW107XG4gICAgICB9ZWxzZXtcbiAgICAgICAgY29sbGVjdGlvbi5saW5rcyA9IGNvbGxlY3Rpb24ubGlua3Muc3BsaXQoJywnKVxuICAgICAgICB0ZW1wb3JhbC5wdXNoKGNvbGxlY3Rpb24pO1xuICAgICAgfVxuICAgIH0pO1xuICAgICRzY29wZS5jb2xsZWN0aW9ucy5wdXNoKHNsaWRlcik7XG4gIH0pKTtcblxuICBwcm9taXNlcy5wdXNoKCRodHRwLmdldChFTlZJUk9OTUVOVCsnY29sZWNjaW9uZXMvanNvbi9tYXMtcG9wdWxhcmVzL01lbW9yaWEgb3JhbCcpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciB0ZW1wb3JhbCA9IFtdO1xuICAgIHZhciBzbGlkZXIgPSB7XG4gICAgICBcInRpdGxlXCI6IFwiTG8gbcOhcyBQb3B1bGFyXCIsXG4gICAgICBcIm5vZGVzXCI6IFtdXG4gICAgfTtcblxuICAgIGFuZ3VsYXIuZm9yRWFjaChkYXRhLm5vZGVzLCBmdW5jdGlvbihjb2xsZWN0aW9uLCBrZXkpIHtcbiAgICAgIGlmKChrZXkrMSkgJSA0ID09IDAgfHwga2V5ID09IGRhdGEubm9kZXMubGVuZ3RoKXtcbiAgICAgICAgc2xpZGVyLm5vZGVzLnB1c2godGVtcG9yYWwpO1xuICAgICAgICB0ZW1wb3JhbCA9IFtdO1xuICAgICAgfWVsc2V7XG4gICAgICAgIGNvbGxlY3Rpb24ubGlua3MgPSBjb2xsZWN0aW9uLmxpbmtzLnNwbGl0KCcsJylcbiAgICAgICAgdGVtcG9yYWwucHVzaChjb2xsZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAkc2NvcGUuY29sbGVjdGlvbnMucHVzaChzbGlkZXIpO1xuXG4gIH0pKTtcbiAgY29uc29sZS5sb2coJHNjb3BlLmNvbGxlY3Rpb25zKVxuICAvLyB3YWl0IHRvIGFsbCBwcm9taXNlcyByZXNvbHZlXG4gIHZhciBhbGwgPSAkcS5hbGwocHJvbWlzZXMpO1xuXG4gIGFsbC50aGVuKGZ1bmN0aW9uKCl7XG5cbiAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICQoZG9jdW1lbnQpLmZvdW5kYXRpb24oKTtcbiAgICB9LCAwKTtcblxuICB9KTtcblxuXG59XSk7XG4iLCIvKlNFQ0NJT04gTUVOVVMqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ01lbnVDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCAnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdFTlZJUk9OTUVOVEZST05UJywnJHJvb3RTY29wZScsXHJcbiAgICBmdW5jdGlvbiAoICRzY29wZSwgJGh0dHAsICRsb2NhdGlvbixFTlZJUk9OTUVOVCxFTlZJUk9OTUVOVEZST05ULCRyb290U2NvcGUpIHtcclxuICAgICAgICB2YXIgYnJlYWRjcnVtYjtcclxuICAgICAgICAkbG9jYXRpb24ucGF0aCgpID09ICcvJyA/ICRzY29wZS5wYXRoID0gJy8nOiRzY29wZS5wYXRoID0gJGxvY2F0aW9uLnBhdGgoKVxyXG5cclxuICAgICAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlRGUk9OVCsnYXNzZXRzL2RhdGEvTWVudV9wcmluY2lwYWwuanMnKS5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5tZW51ID0gZGF0YS5ub2Rlc1swXTtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygkc2NvcGUubWVudSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJGh0dHAuZ2V0KEVOVklST05NRU5UKydzdWN1cnNhbGVzL2pzb24nKS5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhLm5vZGVzWzJdO1xyXG4gICAgICAgICAgICAkc2NvcGUuc3VjdXJzYWxlcyA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgICAgICAgICB2YXIgbm9kZTtcclxuICAgICAgICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAgICAgICRzY29wZS5zdWN1cnNhbGVzW2NvdW50XSA9IGRhdGEubm9kZXNbbm9kZV07XHJcbiAgICAgICAgICAgICAgICBjb3VudCArKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLnN1Y3Vyc2FsZXMgPSAkc2NvcGUuc3VjdXJzYWxlcztcclxuICAgICAgICB9KTtcclxuICAgICAgICAkc2NvcGUub25DaGFuZ2VDaXVkYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIHBhdGhzPXt9XHJcbiAgICAgICAgICAgIHZhciBwYXRoO1xyXG4gICAgICAgICAgICBwYXRoID0gJGxvY2F0aW9uLnBhdGgoKVxyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLnN1Y3Vyc2FsID0gJHNjb3BlLnN1Y3Vyc2FsO1xyXG4gICAgICAgICAgICAkbG9jYXRpb24ucGF0aChwYXRoICsgJHJvb3RTY29wZS5zdWN1cnNhbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICB9XSk7XHJcbiIsIi8qU0VDQ0lPTiBOT1RJQ0lBUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignTm90aWNpYXNDb250cm9sbGVyJyxbJyRzY29wZScsJyRodHRwJywnJGxvY2F0aW9uJywnRU5WSVJPTk1FTlQnLCckcm9vdFNjb3BlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCwgJHJvb3RTY29wZSl7XHJcbiAgICB2YXIgcGF0aCA9ICdhcnRpY3Vsb3NKU09OJztcclxuICAgIHZhciBub2RlO1xyXG4gICAgJHNjb3BlLmFydGljbGVzID0ge307XHJcbiAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrcGF0aCkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICAkc2NvcGUuYXJ0aWNsZXNbbm9kZV0gPSBkYXRhLm5vZGVzW25vZGVdWydub2RlJ11cclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XSk7XHJcbiIsIi8qU0VDQ0lPTiBPUFVTKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdPcHVzQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywnRU5WSVJPTk1FTlQnLCBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCwgRU5WSVJPTk1FTlQpIHtcclxuICAgICRodHRwLmdldChFTlZJUk9OTUVOVCsnY29uY2llcnRvcy9qc29uJykuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICRzY29wZS5jb25jZXJ0cyA9IGRhdGEubm9kZXM7XHJcbiAgICB9KTtcclxuXHJcbn1dKTtcclxuIiwiLypcbiAgQmxhYSAtIERheXNjcmlwdFxuICBCaWJsaW90ZWNhIGRlIGNsYXNlcyBwYXJhIGVzdGlsb3NcbiAgY29weXJpZ3RoIDIwMTYgLSBCb2dvdGEtQ29sb21iaWFcbiovXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ1BhZ2VDb250cm9sbGVyJyxbJyRzY29wZScsJyRsb2cnLCckbG9jYXRpb24nLCAnJHRpbWVvdXQnICxmdW5jdGlvbigkc2NvcGUsICRsb2csICRsb2NhdGlvbiwgJHRpbWVvdXQpIHtcblxuICB2YXIgY29sb3VyTWFwID0ge1xuICAgIGluZGV4IDogJ2NJbmRleCcsXG4gICAgYmlibGlvdGVjYXM6IFwiY0JpYmxpb1wiLFxuICB9O1xuXG4gICRzY29wZS5HZXRDbGFzcyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHBhdGhDbGFzcyA9ICRsb2NhdGlvbi5wYXRoKClcbiAgICAvL2NvbnNvbGUubG9nKHBhdGhDbGFzcylcbiAgICBwYXRoQ2xhc3MgPSBwYXRoQ2xhc3Muc3BsaXQoJy8nKVxuICAgIHBhdGhDbGFzcy5zaGlmdCgpXG4gICAgcmV0dXJuIGNvbG91ck1hcFtwYXRoQ2xhc3NbMF1dO1xuICB9XG5cbiAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAkKGRvY3VtZW50KS5mb3VuZGF0aW9uKCk7XG4gIH0sIDMwMDApO1xufV0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
