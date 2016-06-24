/*
  Blaa - Dayscript
  Biblioteca de clases para estilos
  copyrigth 2016 - Bogota-Colombia
*/
blaaApp.controller('MemoriasOralesController',['$scope', '$http', 'ENVIRONMENT', function($scope, $http, ENVIRONMENT) {

  var path = 'colecciones/json'

  $http.get(ENVIRONMENT+path).success(function(data) {
    $scope.collections = [];
    var temporal = [];

    angular.forEach(data.nodes, function(collection, key) {

      console.log(key);
      if((key+1) % 4 == 0){
        $scope.collections.push(temporal);
        temporal = [];
      }else{
        temporal.push(collection);
      }

    });
    console.log($scope.collections);
  });

  // $timeout(function(){
  //   $(document).foundation();
  // }, 3000);
}]);
