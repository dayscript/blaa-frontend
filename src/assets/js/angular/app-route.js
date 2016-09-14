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
