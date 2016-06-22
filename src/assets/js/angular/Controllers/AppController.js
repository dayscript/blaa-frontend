blaaApp.controller('SucursalController',['$scope','$http','$location','ENVIRONMENT','$rootScope','$stateParams', '$state', function($scope, $http, $location, ENVIRONMENT, $rootScope,$stateParams, $state){
    $scope.breadcrumbs = []
    $stateParams.sucursal ?  $rootScope.sucursal = $stateParams.sucursal:$rootScope.sucursal = 'Bogotá';
    $scope.breadcrumbs = 'Actividad Cultural'
    console.log('Sucursal:'+ $rootScope.sucursal);


}])
