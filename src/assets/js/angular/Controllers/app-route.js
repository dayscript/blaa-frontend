blaaApp.config(['$locationProvider','$stateProvider', '$urlRouterProvider','$breadcrumbProvider',function($locationProvider,$stateProvider,$urlRouterProvider,$breadcrumbProvider) {
             $breadcrumbProvider.setOptions({
                template: '<div class="breadcrumbs large-12">'
                                + '<ul>'
                                +   '<li ng-repeat="step in steps"><a ui-sref="{{step.ncyBreadcrumbLink}}"> {{step.ncyBreadcrumbLabel}}/ </a></li>'
                                + '</ul>'
                              +'</div>'
            });
            $urlRouterProvider.otherwise('/');
            $stateProvider
            .state('/', {
                    url: '/',
                    controller:'SucursalController',
                    ncyBreadcrumb:{
                        label:'{{breadcrumbs}}'
                    }
            })
            /*.state('/areas-culturales', {
                    url: '/areas-culturales',
                    controller:'SucursalController',
                    ncyBreadcrumb:{
                        label:'{{breadcrumbs}}'
                    }
            })*/

            $locationProvider.html5Mode(true);
}]);
