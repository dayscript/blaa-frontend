blaaApp.controller('NodeController',
  // ['$scope', '$http',
  ['$scope', '$http', '$routeParams', '$filter', '$timeout', '$state', '$sce', '$window', '$location', 'ENVIRONMENT',
  function ($scope, $http, $routeParams, $filter, $timeout, $state, $sce, $window, $location, ENVIRONMENT) {
  // function ($scope, $http) {

  if ($routeParams.hasOwnProperty('titleId')) {
    $scope.nid = $filter('extractNidString')($routeParams.titleId);
  }

  $http.get(ENVIRONMENT+'api/node/'+$scope.nid+'.json').success(function(data) {
    $scope.node = data;
    console.log(ENVIRONMENT+'api/node/'+$scope.nid+'.json');
    if('body' in $scope.node && 'und' in $scope.node.body){
      $scope.node.body.und[0].safe_value = $sce.trustAsHtml(data.body.und[0].safe_value);
    }

    console.log(data);
  });
}]);
