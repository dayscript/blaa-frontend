'use strict';
//$(document).foundation();

var blaaApp = angular.module('blaaApp', ['ngSanitize','ui.router','ncy-angular-breadcrumb','ngPrettyJson'])
    .constant('ENVIRONMENT', 'http://blaa.local/')

    .controller('SucursalController',['$scope','$http','$location','ENVIRONMENT','$rootScope','$stateParams', '$state', function($scope, $http, $location, ENVIRONMENT, $rootScope,$stateParams, $state){
        $scope.breadcrumbs = []
        $stateParams.sucursal ?  $rootScope.sucursal = $stateParams.sucursal:$rootScope.sucursal = 'Bogotá';
        $scope.breadcrumbs = 'Actividad Cultural'
        console.log('Sucursal:'+ $rootScope.sucursal);
    }])
function print(text,variable){
    console.log(text+':'+variable);
}
 
