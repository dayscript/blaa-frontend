var blaaApp = angular.module('blaaApp', ['ngSanitize'])
    .controller('MenuController', ['$scope', '$http', '$location', function ($scope, $http, $location) {
        $scope.location = $location;
        $scope.menu = {
            '/': {
                label: 'Actividad cultural<br>del Banco de la<br>República',
                title: 'Actividad cultural',
                url: '/',
                style: 'cIndex'
            }
            ,
            '/areas.html': {
                label: 'Áreas<br>culturales<br>en el país',
                title: 'Áreas culturales en el país',
                url: '/areas.html',
                style: 'cAreas'
            }
            ,
            '/arte.html': {
                label: 'Arte y<br>numismática',
                title: 'Arte y numismática',
                url: '/arte.html',
                style: 'cArte'
            }
            ,
            '/bibliotecas.html': {
                label: 'Bibliotecas',
                title: 'Bibliotecas',
                url: '/bibliotecas.html',
                style: 'cBiblio'
            }
            ,
            '/bvirtual.html': {
                label: 'BVirtual',
                title: 'BVirtual',
                url: '/bvirtual.html',
                style: 'cBvirtual'
            }
            ,
            '/museo.html': {
                label: 'Museo<br>del Oro',
                title: 'Museo del Oro',
                url: '/museo.html',
                style: 'cMuseo'
            }
            ,
            '/musica.html': {
                label: 'Música',
                title: 'Música',
                url: '/musica.html',
                style: 'cMusica'
            }
        }
        ;
        $http.get('http://blaa.demodayscript.com/sucursales/json').success(function (data) {
            $scope.sucursales = data.nodes;
        });
    }])
    .config(function ($locationProvider) {
        $locationProvider.html5Mode(true);
    });
