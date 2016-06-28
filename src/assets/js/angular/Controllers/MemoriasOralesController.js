/*
  Blaa - Dayscript
  Biblioteca de clases para estilos
  copyrigth 2016 - Bogota-Colombia
*/
blaaApp.controller('MemoriasOralesController',['$scope', '$http', 'ENVIRONMENT', function($scope, $http, ENVIRONMENT) {
  
  $scope.collections = [];

  $http.get(ENVIRONMENT+'colecciones/json').success(function(data) {
    var temporal = [];

    $scope.collections.push({
      "title": "Lo más Reciente",
      "nodes": [],
    });

    angular.forEach(data.nodes, function(collection, key) {
      if((key+1) % 4 == 0 || key == data.nodes.length){
        $scope.collections[0].nodes.push(temporal);
        temporal = [];
      }else{
        temporal.push(collection);
      }
    });
  }); 
   
  $http.get(ENVIRONMENT+'colecciones/json/destacados').success(function(data) {
    var temporal = [];

    $scope.collections.push({
      "title": "Lo más Destacado",
      "nodes": [],
    });

    angular.forEach(data.nodes, function(collection, key) {
      if((key+1) % 4 == 0 || key == data.nodes.length){
        $scope.collections[1].nodes.push(temporal);
        temporal = [];
      }else{
        temporal.push(collection);
      }
    });
  });   

  $http.get(ENVIRONMENT+'colecciones/json/populares').success(function(data) {
    var temporal = [];

    $scope.collections.push({
      "title": "Lo más Popular",
      "nodes": [],
    });

    angular.forEach(data.nodes, function(collection, key) {
      if((key+1) % 4 == 0 || key == data.nodes.length){
        $scope.collections[2].nodes.push(temporal);
        temporal = [];
      }else{
        temporal.push(collection);
      }
    });

    console.log($scope.collections);
  });


}]);
