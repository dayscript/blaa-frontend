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
