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
blaaApp.controller('MemoriasOralesController',['$scope', '$http', 'ENVIRONMENT','$timeout', '$q', function($scope, $http, ENVIRONMENT, $timeout, $q) {
  
  $scope.collections = [];

  var promises = [];
  promises.push($http.get(ENVIRONMENT+'colecciones/json').success(function(data) {
    var temporal = [];
    var slider = {
      "title": "Lo más Reciente",
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
   
  promises.push($http.get(ENVIRONMENT+'colecciones/json/destacados').success(function(data) {
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

  promises.push($http.get(ENVIRONMENT+'colecciones/json/populares').success(function(data) {
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
    console.log(pathClass)
    pathClass = pathClass.split('/')
    pathClass.shift()
    return colourMap[pathClass[0]];
  }

  $timeout(function(){
    $(document).foundation();
  }, 3000);
}]);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC1jb25maWd1cmUuanMiLCJhcHAtcm91dGUuanMiLCJBcHBDb250cm9sbGVyLmpzIiwiQmFubmVyUHJpbmNpcGFsQ29udHJvbGxlci5qcyIsIkJyZWFkQ3J1bWJDb250cm9sbGVyLmpzIiwiRXZlbnRvc0NvbnRyb2xsZXIuanMiLCJMaW5lYURlVGllbXBvQ29udHJvbGxlci5qcyIsIk1lbW9yaWFzT3JhbGVzQ29udHJvbGxlci5qcyIsIk1lbnVDb250cm9sbGVyLmpzIiwiTm90aWNpYXNDb250cm9sbGVyLmpzIiwiT3B1c0NvbnRyb2xsZXIuanMiLCJQYWdlQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcbnZhciBibGFhQXBwID0gYW5ndWxhci5tb2R1bGUoJ2JsYWFBcHAnLCBbJ25nU2FuaXRpemUnLCduZ1JvdXRlJywnbmN5LWFuZ3VsYXItYnJlYWRjcnVtYicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25nUHJldHR5SnNvbicsJ2NoaWVmZmFuY3lwYW50cy5sb2FkaW5nQmFyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdBbmltYXRlJywnbmdQcmV0dHlKc29uJ10pXHJcbiAgICAuY29uc3RhbnQoJ0VOVklST05NRU5UJywgJ2h0dHA6Ly9ibGFhLmRlbW9kYXlzY3JpcHQuY29tLycpXHJcbiAgICAuY29uc3RhbnQoJ0VOVklST05NRU5URlJPTlQnLCAnLycpXHJcbiAgICAuY29uZmlnKGZ1bmN0aW9uKGNmcExvYWRpbmdCYXJQcm92aWRlcikge1xyXG4gICAgICBjZnBMb2FkaW5nQmFyUHJvdmlkZXIuaW5jbHVkZVNwaW5uZXIgPSB0cnVlO1xyXG4gICAgfSk7XHJcblxyXG5cclxuZnVuY3Rpb24gcHJpbnQodGV4dCx2YXJpYWJsZSl7XHJcbiAgICBjb25zb2xlLmxvZyh0ZXh0Kyc6Jyt2YXJpYWJsZSk7XHJcbn0iLCJibGFhQXBwLmNvbmZpZyhbJyRyb3V0ZVByb3ZpZGVyJywnJGxvY2F0aW9uUHJvdmlkZXInLGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJyEnKTtcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG5cbiAgICAkcm91dGVQcm92aWRlci53aGVuKCcvJywge1xuICAgICAgICB0ZW1wbGF0ZVVybDogJ2hvbWUuaHRtbCdcbiAgICB9KVxuICAgIC53aGVuKCcvYmlibGlvdGVjYXMvbWVtb3JpYXMtb3JhbGVzJywge1xuICAgICAgICB0ZW1wbGF0ZVVybDogJ21lbW9yaWFzLW9yYWxlcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ01lbW9yaWFzT3JhbGVzQ29udHJvbGxlcidcbiAgICB9KVxuICAgIC5vdGhlcndpc2Uoe1xuICAgICAgICByZWRpcmVjdFRvOiAnLzQwNCdcbiAgICB9KTtcbiAgICAvLyBjb25maWd1cmUgaHRtbDUgdG8gZ2V0IGxpbmtzIHdvcmtpbmcgb24ganNmaWRkbGVcbn1dKTtcblxuLypibGFhQXBwLnJ1bihbJyRsb2NhdGlvbicsIGZ1bmN0aW9uIEFwcFJ1bigkbG9jYXRpb24pIHtcbiAgICBkZWJ1Z2dlcjtcbn1dKTsqL1xuIiwiYmxhYUFwcC5jb250cm9sbGVyKCdTdWN1cnNhbENvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCckc3RhdGVQYXJhbXMnLCAnJHN0YXRlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCBFTlZJUk9OTUVOVCwgJHJvb3RTY29wZSwkc3RhdGVQYXJhbXMsICRzdGF0ZSl7XHJcbiAgICAkc2NvcGUuYnJlYWRjcnVtYnMgPSBbXVxyXG4gICAgJHN0YXRlUGFyYW1zLnN1Y3Vyc2FsID8gICRyb290U2NvcGUuc3VjdXJzYWwgPSAkc3RhdGVQYXJhbXMuc3VjdXJzYWw6JHJvb3RTY29wZS5zdWN1cnNhbCA9ICdCb2dvdMOhJztcclxuICAgICRzY29wZS5icmVhZGNydW1icyA9ICdBY3RpdmlkYWQgQ3VsdHVyYWwnXHJcbiAgICBjb25zb2xlLmxvZygnU3VjdXJzYWw6JysgJHJvb3RTY29wZS5zdWN1cnNhbCk7XHJcbn1dKVxyXG4iLCJibGFhQXBwLmNvbnRyb2xsZXIoJ0Jhbm5lclByaW5jaXBhbENvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCckdGltZW91dCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUsJHRpbWVvdXQpe1xyXG4gICAgdmFyIHBhdGggPSAnYmFubmVyL2pzb24nO1xyXG4gICAgdmFyIG5vZGU7XHJcbiAgICAkc2NvcGUuYmFubmVycyA9IHt9O1xyXG4gICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGgpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICRzY29wZS5iYW5uZXJzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXS5ub2RlXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufV0pO1xyXG4iLCIvKlNFQ0NJT04gQlJFQURDUlVNQiovXHJcbmJsYWFBcHAuY29udHJvbGxlcignQnJlYWRjcnVtYkNvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCRyb290U2NvcGUpIHtcclxuICAgIHByaW50KCdicmVhZGNydW1iJywkbG9jYXRpb24ucGF0aCgpKTtcclxuICAgIHZhciBwYXRocyA9IHt9O1xyXG4gICAgcGF0aHMgPSAkbG9jYXRpb24ucGF0aCgpXHJcbiAgICAkc2NvcGUuYnJlYWRjcnVtYiA9IHt9O1xyXG4gICAgcGF0aHMgPSBwYXRocy5zcGxpdCgnLycpO1xyXG4gICAgcGF0aHMuc2hpZnQoKTtcclxuICAgIGZvciggdmFyIGkgPSAwOyBpIDw9IHBhdGhzLmxlbmd0aC0xOyBpKysgKXtcclxuICAgICAgICBwYXRocyA9PSBcIlwiPyAkc2NvcGUuYnJlYWRjcnVtYltpXSA9IHBhdGhzWzBdOiRzY29wZS5icmVhZGNydW1iW2ldID0gcGF0aHNbaV07XHJcbiAgICB9XHJcbiAgICAkcm9vdFNjb3BlLmJyZWFkY3J1bWIgPSAkc2NvcGUuYnJlYWRjcnVtYjtcclxufV0pOyBcclxuIiwiLypTRUNDSU9OIFNMSURFUiBFVkVOVE9TKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdFdmVudG9zQ29udHJvbGxlcicsWyckc2NvcGUnLCckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUpe1xyXG4gICB2YXIgcGF0aCA9ICdldmVudG9zSlNPTic7XHJcbiAgIHZhciBub2RlO1xyXG4gICAkc2NvcGUuZXZlbnRzID0ge307XHJcbiAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAkc2NvcGUuZXZlbnRzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICB9XHJcbiAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuZXZlbnRzKVxyXG4gICB9KVxyXG59XSk7XHJcbiIsIi8qU0VDQ0lPTiBTTElERVIgRVZFTlRPUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignTGluZWFEZVRpZW1wb0NvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQpe1xyXG4gICB2YXIgcGF0aCA9ICdldmVudG9zSlNPTic7XHJcbiAgIHZhciBwYXRoVGlwb0V2ZW50byA9ICd0YXhvbm9taWFzL3RpcG9kZWV2ZW50by9qc29uJztcclxuICAgdmFyIG5vZGU7XHJcbiAgICRzY29wZS5ldmVudHMgPSB7fTtcclxuICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGgpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICRzY29wZS5ldmVudHNbbm9kZV0gPSBkYXRhLm5vZGVzW25vZGVdWydub2RlJ11cclxuICAgICAgIH1cclxuICAgfSlcclxuICAgJHNjb3BlLnRpcG9FdmVudG9zID0ge307XHJcbiAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoVGlwb0V2ZW50bykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgJHNjb3BlLnRpcG9FdmVudG9zW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICB9XHJcbiAgIH0pXHJcbn1dKTtcclxuIiwiLypcclxuICBCbGFhIC0gRGF5c2NyaXB0XHJcbiAgQmlibGlvdGVjYSBkZSBjbGFzZXMgcGFyYSBlc3RpbG9zXHJcbiAgY29weXJpZ3RoIDIwMTYgLSBCb2dvdGEtQ29sb21iaWFcclxuKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdNZW1vcmlhc09yYWxlc0NvbnRyb2xsZXInLFsnJHNjb3BlJywgJyRodHRwJywgJ0VOVklST05NRU5UJywnJHRpbWVvdXQnLCAnJHEnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCBFTlZJUk9OTUVOVCwgJHRpbWVvdXQsICRxKSB7XHJcbiAgXHJcbiAgJHNjb3BlLmNvbGxlY3Rpb25zID0gW107XHJcblxyXG4gIHZhciBwcm9taXNlcyA9IFtdO1xyXG4gIHByb21pc2VzLnB1c2goJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb2xlY2Npb25lcy9qc29uJykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XHJcbiAgICB2YXIgdGVtcG9yYWwgPSBbXTtcclxuICAgIHZhciBzbGlkZXIgPSB7XHJcbiAgICAgIFwidGl0bGVcIjogXCJMbyBtw6FzIFJlY2llbnRlXCIsXHJcbiAgICAgIFwibm9kZXNcIjogW11cclxuICAgIH07XHJcblxyXG5cclxuICAgIGFuZ3VsYXIuZm9yRWFjaChkYXRhLm5vZGVzLCBmdW5jdGlvbihjb2xsZWN0aW9uLCBrZXkpIHtcclxuICAgICAgaWYoKGtleSsxKSAlIDQgPT0gMCB8fCBrZXkgPT0gZGF0YS5ub2Rlcy5sZW5ndGgpe1xyXG4gICAgICAgIHNsaWRlci5ub2Rlcy5wdXNoKHRlbXBvcmFsKTtcclxuICAgICAgICB0ZW1wb3JhbCA9IFtdO1xyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICB0ZW1wb3JhbC5wdXNoKGNvbGxlY3Rpb24pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAkc2NvcGUuY29sbGVjdGlvbnMucHVzaChzbGlkZXIpO1xyXG4gIH0pKTsgXHJcbiAgIFxyXG4gIHByb21pc2VzLnB1c2goJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb2xlY2Npb25lcy9qc29uL2Rlc3RhY2Fkb3MnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgIHZhciB0ZW1wb3JhbCA9IFtdO1xyXG4gICAgdmFyIHNsaWRlciA9IHtcclxuICAgICAgXCJ0aXRsZVwiOiBcIkxvIG3DoXMgRGVzdGFjYWRvXCIsXHJcbiAgICAgIFwibm9kZXNcIjogW11cclxuICAgIH07XHJcblxyXG4gICAgYW5ndWxhci5mb3JFYWNoKGRhdGEubm9kZXMsIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGtleSkge1xyXG4gICAgICBpZigoa2V5KzEpICUgNCA9PSAwIHx8IGtleSA9PSBkYXRhLm5vZGVzLmxlbmd0aCl7XHJcbiAgICAgICAgc2xpZGVyLm5vZGVzLnB1c2godGVtcG9yYWwpO1xyXG4gICAgICAgIHRlbXBvcmFsID0gW107XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIHRlbXBvcmFsLnB1c2goY29sbGVjdGlvbik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgJHNjb3BlLmNvbGxlY3Rpb25zLnB1c2goc2xpZGVyKTtcclxuICB9KSk7ICAgXHJcblxyXG4gIHByb21pc2VzLnB1c2goJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb2xlY2Npb25lcy9qc29uL3BvcHVsYXJlcycpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgdmFyIHRlbXBvcmFsID0gW107XHJcbiAgICB2YXIgc2xpZGVyID0ge1xyXG4gICAgICBcInRpdGxlXCI6IFwiTG8gbcOhcyBQb3B1bGFyXCIsXHJcbiAgICAgIFwibm9kZXNcIjogW11cclxuICAgIH07XHJcblxyXG4gICAgYW5ndWxhci5mb3JFYWNoKGRhdGEubm9kZXMsIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGtleSkge1xyXG4gICAgICBpZigoa2V5KzEpICUgNCA9PSAwIHx8IGtleSA9PSBkYXRhLm5vZGVzLmxlbmd0aCl7XHJcbiAgICAgICAgc2xpZGVyLm5vZGVzLnB1c2godGVtcG9yYWwpO1xyXG4gICAgICAgIHRlbXBvcmFsID0gW107XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIHRlbXBvcmFsLnB1c2goY29sbGVjdGlvbik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgICRzY29wZS5jb2xsZWN0aW9ucy5wdXNoKHNsaWRlcik7XHJcbiAgfSkpO1xyXG5cclxuICAvLyB3YWl0IHRvIGFsbCBwcm9taXNlcyByZXNvbHZlXHJcbiAgdmFyIGFsbCA9ICRxLmFsbChwcm9taXNlcyk7XHJcblxyXG4gIGFsbC50aGVuKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICQoZG9jdW1lbnQpLmZvdW5kYXRpb24oKTtcclxuICAgIH0sIDApO1xyXG5cclxuICB9KTtcclxuXHJcblxyXG59XSk7XHJcbiIsIi8qU0VDQ0lPTiBNRU5VUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignTWVudUNvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsICckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0VOVklST05NRU5URlJPTlQnLCckcm9vdFNjb3BlJyxcclxuICAgIGZ1bmN0aW9uICggJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLEVOVklST05NRU5ULEVOVklST05NRU5URlJPTlQsJHJvb3RTY29wZSkge1xyXG4gICAgICAgIHZhciBicmVhZGNydW1iO1xyXG4gICAgICAgICRsb2NhdGlvbi5wYXRoKCkgPT0gJy8nID8gJHNjb3BlLnBhdGggPSAnLyc6JHNjb3BlLnBhdGggPSAkbG9jYXRpb24ucGF0aCgpXHJcbiAgICAgICAgXHJcbiAgICAgICAgJGh0dHAuZ2V0KEVOVklST05NRU5URlJPTlQrJ2Fzc2V0cy9kYXRhL01lbnVfcHJpbmNpcGFsLmpzJykuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAkc2NvcGUubWVudSA9IGRhdGEubm9kZXNbMF07XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5tZW51KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrJ3N1Y3Vyc2FsZXMvanNvbicpLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgZGVsZXRlIGRhdGEubm9kZXNbMl07XHJcbiAgICAgICAgICAgICRzY29wZS5zdWN1cnNhbGVzID0gW107XHJcbiAgICAgICAgICAgIHZhciBjb3VudCA9IDA7XHJcbiAgICAgICAgICAgIHZhciBub2RlO1xyXG4gICAgICAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnN1Y3Vyc2FsZXNbY291bnRdID0gZGF0YS5ub2Rlc1tub2RlXTtcclxuICAgICAgICAgICAgICAgIGNvdW50ICsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuc3VjdXJzYWxlcyA9ICRzY29wZS5zdWN1cnNhbGVzO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRzY29wZS5vbkNoYW5nZUNpdWRhZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgcGF0aHM9e31cclxuICAgICAgICAgICAgdmFyIHBhdGg7XHJcbiAgICAgICAgICAgIHBhdGggPSAkbG9jYXRpb24ucGF0aCgpXHJcbiAgICAgICAgICAgICRyb290U2NvcGUuc3VjdXJzYWwgPSAkc2NvcGUuc3VjdXJzYWw7XHJcbiAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKHBhdGggKyAkcm9vdFNjb3BlLnN1Y3Vyc2FsKTtcclxuICAgICAgICB9XHJcblxyXG4gIH1dKTtcclxuIiwiLypTRUNDSU9OIE5PVElDSUFTKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdOb3RpY2lhc0NvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlKXtcclxuICAgIHZhciBwYXRoID0gJ2FydGljdWxvc0pTT04nO1xyXG4gICAgdmFyIG5vZGU7XHJcbiAgICAkc2NvcGUuYXJ0aWNsZXMgPSB7fTtcclxuICAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgICRzY29wZS5hcnRpY2xlc1tub2RlXSA9IGRhdGEubm9kZXNbbm9kZV1bJ25vZGUnXVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1dKTtcclxuIiwiLypTRUNDSU9OIE9QVVMqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ09wdXNDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCdFTlZJUk9OTUVOVCcsIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwLCBFTlZJUk9OTUVOVCkge1xyXG4gICAgJGh0dHAuZ2V0KEVOVklST05NRU5UKydjb25jaWVydG9zL2pzb24nKS5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgJHNjb3BlLmNvbmNlcnRzID0gZGF0YS5ub2RlcztcclxuICAgIH0pO1xyXG5cclxufV0pO1xyXG4iLCIvKlxyXG4gIEJsYWEgLSBEYXlzY3JpcHRcclxuICBCaWJsaW90ZWNhIGRlIGNsYXNlcyBwYXJhIGVzdGlsb3NcclxuICBjb3B5cmlndGggMjAxNiAtIEJvZ290YS1Db2xvbWJpYVxyXG4qL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ1BhZ2VDb250cm9sbGVyJyxbJyRzY29wZScsJyRsb2cnLCckbG9jYXRpb24nLCAnJHRpbWVvdXQnICxmdW5jdGlvbigkc2NvcGUsICRsb2csICRsb2NhdGlvbiwgJHRpbWVvdXQpIHtcclxuXHJcbiAgdmFyIGNvbG91ck1hcCA9IHtcclxuICAgIGluZGV4IDogJ2NJbmRleCcsXHJcbiAgICBiaWJsaW90ZWNhczogXCJjQmlibGlvXCIsXHJcbiAgfTtcclxuXHJcbiAgJHNjb3BlLkdldENsYXNzID0gZnVuY3Rpb24oKXtcclxuICAgIHZhciBwYXRoQ2xhc3MgPSAkbG9jYXRpb24ucGF0aCgpXHJcbiAgICBjb25zb2xlLmxvZyhwYXRoQ2xhc3MpXHJcbiAgICBwYXRoQ2xhc3MgPSBwYXRoQ2xhc3Muc3BsaXQoJy8nKVxyXG4gICAgcGF0aENsYXNzLnNoaWZ0KClcclxuICAgIHJldHVybiBjb2xvdXJNYXBbcGF0aENsYXNzWzBdXTtcclxuICB9XHJcblxyXG4gICR0aW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAkKGRvY3VtZW50KS5mb3VuZGF0aW9uKCk7XHJcbiAgfSwgMzAwMCk7XHJcbn1dKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
