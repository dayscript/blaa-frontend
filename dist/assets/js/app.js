'use strict';
var blaaApp = angular.module('blaaApp', ['ngSanitize','ngRoute','ncy-angular-breadcrumb',
                                         'ngPrettyJson','chieffancypants.loadingBar',
                                         'ngAnimate','ngPrettyJson'])
    .constant('ENVIRONMENT', 'http://blaa.local/')
    .constant('ENVIRONMENTFRONT', 'http://blaafront.local/')

    .config(function(cfpLoadingBarProvider) {
      cfpLoadingBarProvider.includeSpinner = true;
    });


function print(text,variable){
    console.log(text+':'+variable);
}

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
blaaApp.controller('PageController',['$scope','$log','$location',function($scope, $log, $location) {
  console.log('PageController')

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
}]);

blaaApp.config(['$routeProvider','$locationProvider',function($routeProvider, $locationProvider) {
  $routeProvider
  .otherwise({
      redirectTo: '/404'
    })
   .when('/', {
    templateUrl: 'home.html',
    resolve: {
      // I will cause a 1 second delay
      delay: function($q, $timeout) {
        var delay = $q.defer();
        $timeout(delay.resolve, 1000);
        return delay.promise;
      }
    }
  })

  .when('/bibliotecas/memorias-orales', {
    templateUrl: 'memorias-orales.html',
    controller:'PageController',
    resolve:{
      delay:function($q,$timeout){
        var delay = $q.defer();
        $timeout(delay.resolve,1000);
        return delay.resolve;
      }
    }
  });
  // configure html5 to get links working on jsfiddle
  $locationProvider.html5Mode(true);
  $locationProvider.hashPrefix('!');
}]);

/*blaaApp.run(['$location', function AppRun($location) {
    debugger;
}]);*/

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC1jb25maWd1cmUuanMiLCJBcHBDb250cm9sbGVyLmpzIiwiQmFubmVyUHJpbmNpcGFsQ29udHJvbGxlci5qcyIsIkJyZWFkQ3J1bWJDb250cm9sbGVyLmpzIiwiRXZlbnRvc0NvbnRyb2xsZXIuanMiLCJMaW5lYURlVGllbXBvQ29udHJvbGxlci5qcyIsIk1lbnVDb250cm9sbGVyLmpzIiwiTm90aWNpYXNDb250cm9sbGVyLmpzIiwiT3B1c0NvbnRyb2xsZXIuanMiLCJQYWdlQ29udHJvbGxlci5qcyIsImFwcC1yb3V0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG52YXIgYmxhYUFwcCA9IGFuZ3VsYXIubW9kdWxlKCdibGFhQXBwJywgWyduZ1Nhbml0aXplJywnbmdSb3V0ZScsJ25jeS1hbmd1bGFyLWJyZWFkY3J1bWInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdQcmV0dHlKc29uJywnY2hpZWZmYW5jeXBhbnRzLmxvYWRpbmdCYXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdBbmltYXRlJywnbmdQcmV0dHlKc29uJ10pXG4gICAgLmNvbnN0YW50KCdFTlZJUk9OTUVOVCcsICdodHRwOi8vYmxhYS5sb2NhbC8nKVxuICAgIC5jb25zdGFudCgnRU5WSVJPTk1FTlRGUk9OVCcsICdodHRwOi8vYmxhYWZyb250LmxvY2FsLycpXG5cbiAgICAuY29uZmlnKGZ1bmN0aW9uKGNmcExvYWRpbmdCYXJQcm92aWRlcikge1xuICAgICAgY2ZwTG9hZGluZ0JhclByb3ZpZGVyLmluY2x1ZGVTcGlubmVyID0gdHJ1ZTtcbiAgICB9KTtcblxuXG5mdW5jdGlvbiBwcmludCh0ZXh0LHZhcmlhYmxlKXtcbiAgICBjb25zb2xlLmxvZyh0ZXh0Kyc6Jyt2YXJpYWJsZSk7XG59XG4iLCJibGFhQXBwLmNvbnRyb2xsZXIoJ1N1Y3Vyc2FsQ29udHJvbGxlcicsWyckc2NvcGUnLCckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsJyRzdGF0ZVBhcmFtcycsICckc3RhdGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCAkcm9vdFNjb3BlLCRzdGF0ZVBhcmFtcywgJHN0YXRlKXtcbiAgICAkc2NvcGUuYnJlYWRjcnVtYnMgPSBbXVxuICAgICRzdGF0ZVBhcmFtcy5zdWN1cnNhbCA/ICAkcm9vdFNjb3BlLnN1Y3Vyc2FsID0gJHN0YXRlUGFyYW1zLnN1Y3Vyc2FsOiRyb290U2NvcGUuc3VjdXJzYWwgPSAnQm9nb3TDoSc7XG4gICAgJHNjb3BlLmJyZWFkY3J1bWJzID0gJ0FjdGl2aWRhZCBDdWx0dXJhbCdcbiAgICBjb25zb2xlLmxvZygnU3VjdXJzYWw6JysgJHJvb3RTY29wZS5zdWN1cnNhbCk7XG5cblxufV0pXG4iLCJibGFhQXBwLmNvbnRyb2xsZXIoJ0Jhbm5lclByaW5jaXBhbENvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsJyRyb290U2NvcGUnLCckdGltZW91dCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUsJHRpbWVvdXQpe1xyXG4gICAgdmFyIHBhdGggPSAnYmFubmVyL2pzb24nO1xyXG4gICAgdmFyIG5vZGU7XHJcbiAgICAkc2NvcGUuYmFubmVycyA9IHt9O1xyXG4gICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGgpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICRzY29wZS5iYW5uZXJzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXS5ub2RlXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufV0pO1xyXG4iLCIvKlNFQ0NJT04gQlJFQURDUlVNQiovXHJcbmJsYWFBcHAuY29udHJvbGxlcignQnJlYWRjcnVtYkNvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sIEVOVklST05NRU5ULCRyb290U2NvcGUpIHtcclxuICAgIHByaW50KCdicmVhZGNydW1iJywkbG9jYXRpb24ucGF0aCgpKTtcclxuICAgIHZhciBwYXRocyA9IHt9O1xyXG4gICAgcGF0aHMgPSAkbG9jYXRpb24ucGF0aCgpXHJcbiAgICAkc2NvcGUuYnJlYWRjcnVtYiA9IHt9O1xyXG4gICAgcGF0aHMgPSBwYXRocy5zcGxpdCgnLycpO1xyXG4gICAgcGF0aHMuc2hpZnQoKTtcclxuICAgIGZvciggdmFyIGkgPSAwOyBpIDw9IHBhdGhzLmxlbmd0aC0xOyBpKysgKXtcclxuICAgICAgICBwYXRocyA9PSBcIlwiPyAkc2NvcGUuYnJlYWRjcnVtYltpXSA9IHBhdGhzWzBdOiRzY29wZS5icmVhZGNydW1iW2ldID0gcGF0aHNbaV07XHJcbiAgICB9XHJcbiAgICAkcm9vdFNjb3BlLmJyZWFkY3J1bWIgPSAkc2NvcGUuYnJlYWRjcnVtYjtcclxufV0pOyBcclxuIiwiLypTRUNDSU9OIFNMSURFUiBFVkVOVE9TKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdFdmVudG9zQ29udHJvbGxlcicsWyckc2NvcGUnLCckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUpe1xyXG4gICB2YXIgcGF0aCA9ICdldmVudG9zSlNPTic7XHJcbiAgIHZhciBub2RlO1xyXG4gICAkc2NvcGUuZXZlbnRzID0ge307XHJcbiAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAkc2NvcGUuZXZlbnRzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICB9XHJcbiAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuZXZlbnRzKVxyXG4gICB9KVxyXG59XSk7XHJcbiIsIi8qU0VDQ0lPTiBTTElERVIgRVZFTlRPUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignTGluZWFEZVRpZW1wb0NvbnRyb2xsZXInLFsnJHNjb3BlJywnJGh0dHAnLCckbG9jYXRpb24nLCdFTlZJUk9OTUVOVCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQpe1xyXG4gICB2YXIgcGF0aCA9ICdldmVudG9zSlNPTic7XHJcbiAgIHZhciBwYXRoVGlwb0V2ZW50byA9ICd0YXhvbm9taWFzL3RpcG9kZWV2ZW50by9qc29uJztcclxuICAgdmFyIG5vZGU7XHJcbiAgICRzY29wZS5ldmVudHMgPSB7fTtcclxuICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGgpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICBmb3IoIG5vZGUgaW4gZGF0YS5ub2RlcyApe1xyXG4gICAgICAgICAgICRzY29wZS5ldmVudHNbbm9kZV0gPSBkYXRhLm5vZGVzW25vZGVdWydub2RlJ11cclxuICAgICAgIH1cclxuICAgfSlcclxuICAgJHNjb3BlLnRpcG9FdmVudG9zID0ge307XHJcbiAgICRodHRwLmdldChFTlZJUk9OTUVOVCtwYXRoVGlwb0V2ZW50bykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKXtcclxuICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgJHNjb3BlLnRpcG9FdmVudG9zW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICB9XHJcbiAgIH0pXHJcbn1dKTtcclxuIiwiLypTRUNDSU9OIE1FTlVTKi9cclxuYmxhYUFwcC5jb250cm9sbGVyKCdNZW51Q29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywgJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnRU5WSVJPTk1FTlRGUk9OVCcsJyRyb290U2NvcGUnLFxyXG4gICAgZnVuY3Rpb24gKCAkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sRU5WSVJPTk1FTlQsRU5WSVJPTk1FTlRGUk9OVCwkcm9vdFNjb3BlKSB7XHJcbiAgICAgICAgdmFyIGJyZWFkY3J1bWI7XHJcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoKSA9PSAnLycgPyAkc2NvcGUucGF0aCA9ICcvJzokc2NvcGUucGF0aCA9ICRsb2NhdGlvbi5wYXRoKClcclxuICAgICAgICBcclxuICAgICAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlRGUk9OVCsnYXNzZXRzL2RhdGEvTWVudV9wcmluY2lwYWwuanMnKS5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5tZW51ID0gZGF0YS5ub2Rlc1swXTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJHNjb3BlLm1lbnUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRodHRwLmdldChFTlZJUk9OTUVOVCsnc3VjdXJzYWxlcy9qc29uJykuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICBkZWxldGUgZGF0YS5ub2Rlc1syXTtcclxuICAgICAgICAgICAgJHNjb3BlLnN1Y3Vyc2FsZXMgPSBbXTtcclxuICAgICAgICAgICAgdmFyIGNvdW50ID0gMDtcclxuICAgICAgICAgICAgdmFyIG5vZGU7XHJcbiAgICAgICAgICAgIGZvciggbm9kZSBpbiBkYXRhLm5vZGVzICl7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3VjdXJzYWxlc1tjb3VudF0gPSBkYXRhLm5vZGVzW25vZGVdO1xyXG4gICAgICAgICAgICAgICAgY291bnQgKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJHJvb3RTY29wZS5zdWN1cnNhbGVzID0gJHNjb3BlLnN1Y3Vyc2FsZXM7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJHNjb3BlLm9uQ2hhbmdlQ2l1ZGFkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXRocz17fVxyXG4gICAgICAgICAgICB2YXIgcGF0aDtcclxuICAgICAgICAgICAgcGF0aCA9ICRsb2NhdGlvbi5wYXRoKClcclxuICAgICAgICAgICAgJHJvb3RTY29wZS5zdWN1cnNhbCA9ICRzY29wZS5zdWN1cnNhbDtcclxuICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgocGF0aCArICRyb290U2NvcGUuc3VjdXJzYWwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgfV0pO1xyXG4iLCIvKlNFQ0NJT04gTk9USUNJQVMqL1xyXG5ibGFhQXBwLmNvbnRyb2xsZXIoJ05vdGljaWFzQ29udHJvbGxlcicsWyckc2NvcGUnLCckaHR0cCcsJyRsb2NhdGlvbicsJ0VOVklST05NRU5UJywnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgRU5WSVJPTk1FTlQsICRyb290U2NvcGUpe1xyXG4gICAgdmFyIHBhdGggPSAnYXJ0aWN1bG9zSlNPTic7XHJcbiAgICB2YXIgbm9kZTtcclxuICAgICRzY29wZS5hcnRpY2xlcyA9IHt9O1xyXG4gICAgJGh0dHAuZ2V0KEVOVklST05NRU5UK3BhdGgpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgZm9yKCBub2RlIGluIGRhdGEubm9kZXMgKXtcclxuICAgICAgICAgICAgJHNjb3BlLmFydGljbGVzW25vZGVdID0gZGF0YS5ub2Rlc1tub2RlXVsnbm9kZSddXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufV0pO1xyXG4iLCIvKlNFQ0NJT04gT1BVUyovXHJcbmJsYWFBcHAuY29udHJvbGxlcignT3B1c0NvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsJ0VOVklST05NRU5UJywgZnVuY3Rpb24gKCRzY29wZSwgJGh0dHAsIEVOVklST05NRU5UKSB7XHJcbiAgICAkaHR0cC5nZXQoRU5WSVJPTk1FTlQrJ2NvbmNpZXJ0b3MvanNvbicpLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAkc2NvcGUuY29uY2VydHMgPSBkYXRhLm5vZGVzO1xyXG4gICAgfSk7XHJcblxyXG59XSk7XHJcbiIsIi8qXG4gIEJsYWEgLSBEYXlzY3JpcHRcbiAgQmlibGlvdGVjYSBkZSBjbGFzZXMgcGFyYSBlc3RpbG9zXG4gIGNvcHlyaWd0aCAyMDE2IC0gQm9nb3RhLUNvbG9tYmlhXG4qL1xuYmxhYUFwcC5jb250cm9sbGVyKCdQYWdlQ29udHJvbGxlcicsWyckc2NvcGUnLCckbG9nJywnJGxvY2F0aW9uJyxmdW5jdGlvbigkc2NvcGUsICRsb2csICRsb2NhdGlvbikge1xuICBjb25zb2xlLmxvZygnUGFnZUNvbnRyb2xsZXInKVxuXG4gIHZhciBjb2xvdXJNYXAgPSB7XG4gICAgaW5kZXggOiAnY0luZGV4JyxcbiAgICBiaWJsaW90ZWNhczogXCJjQmlibGlvXCIsXG4gIH07XG5cbiAgJHNjb3BlLkdldENsYXNzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgcGF0aENsYXNzID0gJGxvY2F0aW9uLnBhdGgoKVxuICAgIGNvbnNvbGUubG9nKHBhdGhDbGFzcylcbiAgICBwYXRoQ2xhc3MgPSBwYXRoQ2xhc3Muc3BsaXQoJy8nKVxuICAgIHBhdGhDbGFzcy5zaGlmdCgpXG4gICAgcmV0dXJuIGNvbG91ck1hcFtwYXRoQ2xhc3NbMF1dO1xuICB9XG59XSk7XG4iLCJibGFhQXBwLmNvbmZpZyhbJyRyb3V0ZVByb3ZpZGVyJywnJGxvY2F0aW9uUHJvdmlkZXInLGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAkcm91dGVQcm92aWRlclxuICAub3RoZXJ3aXNlKHtcbiAgICAgIHJlZGlyZWN0VG86ICcvNDA0J1xuICAgIH0pXG4gICAud2hlbignLycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJ2hvbWUuaHRtbCcsXG4gICAgcmVzb2x2ZToge1xuICAgICAgLy8gSSB3aWxsIGNhdXNlIGEgMSBzZWNvbmQgZGVsYXlcbiAgICAgIGRlbGF5OiBmdW5jdGlvbigkcSwgJHRpbWVvdXQpIHtcbiAgICAgICAgdmFyIGRlbGF5ID0gJHEuZGVmZXIoKTtcbiAgICAgICAgJHRpbWVvdXQoZGVsYXkucmVzb2x2ZSwgMTAwMCk7XG4gICAgICAgIHJldHVybiBkZWxheS5wcm9taXNlO1xuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICAud2hlbignL2JpYmxpb3RlY2FzL21lbW9yaWFzLW9yYWxlcycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJ21lbW9yaWFzLW9yYWxlcy5odG1sJyxcbiAgICBjb250cm9sbGVyOidQYWdlQ29udHJvbGxlcicsXG4gICAgcmVzb2x2ZTp7XG4gICAgICBkZWxheTpmdW5jdGlvbigkcSwkdGltZW91dCl7XG4gICAgICAgIHZhciBkZWxheSA9ICRxLmRlZmVyKCk7XG4gICAgICAgICR0aW1lb3V0KGRlbGF5LnJlc29sdmUsMTAwMCk7XG4gICAgICAgIHJldHVybiBkZWxheS5yZXNvbHZlO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIC8vIGNvbmZpZ3VyZSBodG1sNSB0byBnZXQgbGlua3Mgd29ya2luZyBvbiBqc2ZpZGRsZVxuICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJyEnKTtcbn1dKTtcclxuXHJcbi8qYmxhYUFwcC5ydW4oWyckbG9jYXRpb24nLCBmdW5jdGlvbiBBcHBSdW4oJGxvY2F0aW9uKSB7XHJcbiAgICBkZWJ1Z2dlcjtcclxufV0pOyovXHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
