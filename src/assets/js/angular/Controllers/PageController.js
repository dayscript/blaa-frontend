/*
  Blaa - Dayscript
  Biblioteca de clases para estilos
  copyrigth 2016 - Bogota-Colombia
*/
blaaApp.controller('PageController',['$scope','$log','$location',function($scope, $log, $location) {
  console.log('PageController')

  var colourMap = {
    index : 'cIndex',
    bibliotecas: "cBiblio",
  };

  $scope.GetClass = function(){
    var pathClass = $location.path()
    console.log(pathClass)
    pathClass = pathClass.split('/')
    pathClass.shift()
    return colourMap[pathClass[0]];
  }
}]);
