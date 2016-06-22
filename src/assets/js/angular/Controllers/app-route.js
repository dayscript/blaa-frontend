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
