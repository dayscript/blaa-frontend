/*
  Blaa - Dayscript
  Biblioteca de clases para estilos
  copyrigth 2016 - Bogota-Colombia
*/
blaaApp.controller('MemoriasOralesController',['$scope', '$http', 'ENVIRONMENT','$timeout', '$q', function($scope, $http, ENVIRONMENT, $timeout, $q) {
  
  $scope.collections = [];

  var promises = [];
  promises.push($http.get(ENVIRONMENT+'colecciones/json').success(function(data) {
    var temporal = [];
    var slider = {
      "title": "Lo más Reciente",
      "nodes": []
    };


    angular.forEach(data.nodes, function(collection, key) {
      if((key+1) % 4 == 0 || key == data.nodes.length){
        slider.nodes.push(temporal);
        temporal = [];
      }else{
        temporal.push(collection);
      }
    });

    $scope.collections.push(slider);
  })); 
   
  promises.push($http.get(ENVIRONMENT+'colecciones/json/destacados').success(function(data) {
    var temporal = [];
    var slider = {
      "title": "Lo más Destacado",
      "nodes": []
    };

    angular.forEach(data.nodes, function(collection, key) {
      if((key+1) % 4 == 0 || key == data.nodes.length){
        slider.nodes.push(temporal);
        temporal = [];
      }else{
        temporal.push(collection);
      }
    });
    $scope.collections.push(slider);
  }));   

  promises.push($http.get(ENVIRONMENT+'colecciones/json/populares').success(function(data) {
    var temporal = [];
    var slider = {
      "title": "Lo más Popular",
      "nodes": []
    };

    angular.forEach(data.nodes, function(collection, key) {
      if((key+1) % 4 == 0 || key == data.nodes.length){
        slider.nodes.push(temporal);
        temporal = [];
      }else{
        temporal.push(collection);
      }
    });

    $scope.collections.push(slider);
  }));

  // wait to all promises resolve
  var all = $q.all(promises);

  all.then(function(){

    $timeout(function() {
      $(document).foundation();
    }, 0);

  });


}]);
