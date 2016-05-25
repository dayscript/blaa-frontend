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
