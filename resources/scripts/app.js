'use strict';

// Declare app level module which depends on views, and components
angular.module('blaa', [
    'ngRoute',
    'blaa.sucursales',
    'angular-drupal'
]).
    config( function ($routeProvider, $locationProvider) {
        $routeProvider.otherwise({redirectTo: '/sucursales'});
        $locationProvider.html5Mode(true);
    });

// Angular Drupal Configuration Settings
angular.module('angular-drupal').config(function ($provide) {
    $provide.value('drupalSettings', {
        sitePath: 'http://blaa.demodayscript.com',
        endpoint: 'api'
    });
});