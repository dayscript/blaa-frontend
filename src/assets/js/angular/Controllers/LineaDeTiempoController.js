/*SECCION SLIDER EVENTOS*/
blaaApp.controller('LineaDeTiempoController',['$scope','$http','$location','ENVIRONMENT', function($scope, $http, $location, ENVIRONMENT){
   var path = 'eventosJSON';
   var pathTipoEvento = 'taxonomias/tipodeevento/json';
   var node;
   $scope.events = {};
   $http.get(ENVIRONMENT+path).success(function(data){
       for( node in data.nodes ){
           $scope.events[node] = data.nodes[node]['node']
       }
   })
   $scope.tipoEventos = {};
   $http.get(ENVIRONMENT+pathTipoEvento).success(function(data){
       for( node in data.nodes ){
           $scope.tipoEventos[node] = data.nodes[node]['node']
       }
   })
}]);
