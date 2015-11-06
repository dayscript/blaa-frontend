'use strict';

angular.module('blaa.sucursales', ['ngRoute', 'angular-drupal']).run(['drupal', function (drupal) {
}])
    .config(function ($routeProvider) {
        $routeProvider.when('/sucursales', {
            templateUrl: 'modules/sucursales/list.html',
            controller: 'SucursalesCtrl'
        }).when( '/sucursales/:id', {
            controller: 'EventosController',
            templateUrl: 'modules/sucursales/eventos.html'
        }).otherwise({redirectTo: '/sucursales'});
    })
    .controller('SucursalesCtrl', ['$scope', 'drupal','$interval', function ($scope, drupal, $interval) {
        $scope.path = 'sucursales/json';
        $scope.loadNodes = function(){
            drupal.views_json($scope.path).then(function(rows) {
                $scope.nodes = rows;
            });
        }
        $scope.loadNodes();
        $interval( function(){ $scope.loadNodes(); }, 5000);
    }])
    .controller('EventosController', ['$scope', 'drupal','$routeParams','$interval', function ($scope, drupal, $routeParams, $interval) {
        var id = parseInt($routeParams.id);
        $scope.path = 'eventos/'+id+'/json';
        $scope.loadNodes = function(){
            drupal.views_json($scope.path).then(function(rows) {
                $scope.eventos = rows;
            });
        }
        $scope.loadNode = function(){
            drupal.views_json('sucursales/json/'+id).then(function(rows) {
                $scope.sucursal = rows[0];
            });
        }
        $scope.loadNodes();
        $scope.loadNode();
        $interval( function(){ $scope.loadNodes(); }, 5000);
        $interval( function(){ $scope.loadNode(); }, 10000);
    }]);
