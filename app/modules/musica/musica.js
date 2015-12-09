'use strict';

angular.module('blaa.musica', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/musica', {
            templateUrl: 'modules/musica/musica.html',
            controller: 'MusicaCtrl'
        }).when( '/musica/acerca', {
            templateUrl: 'modules/musica/acerca.html',
            controller: 'MusicaAcercaCtrl'
        }).when( '/musica/conciertos', {
            templateUrl: 'modules/musica/conciertos.html',
            controller: 'MusicaConciertosListCtrl'
        }).when( '/musica/conciertos/detalle', {
            templateUrl: 'modules/musica/detalle-conciertos.html',
            controller: 'MusicaConciertosDetailCtrl'
        });
    }])

    .controller('MusicaCtrl', ['$scope', 'drupal', function($scope, drupal) {
        $scope.submit = function(user) {
            drupal.user_login(user.name, user.pass).then(function(data) {
                alert('Hello world and hello ' + data.user.name + '!');
            });
        };
    }]).controller('MusicaAcercaCtrl', ['$scope', 'drupal', function($scope, drupal) {
        $scope.submit = function(user) {
            drupal.user_login(user.name, user.pass).then(function(data) {
                alert('Hello world and hello ' + data.user.name + '!');
            });
        };
    }]).controller('MusicaConciertosListCtrl', ['$scope', 'drupal', function($scope, drupal) {
        $scope.submit = function(user) {
            drupal.user_login(user.name, user.pass).then(function(data) {
                alert('Hello world and hello ' + data.user.name + '!');
            });
        };
    }]).controller('MusicaConciertosDetailCtrl', ['$scope', 'drupal', function($scope, drupal) {
        $scope.submit = function(user) {
            drupal.user_login(user.name, user.pass).then(function(data) {
                alert('Hello world and hello ' + data.user.name + '!');
            });
        };
    }]);