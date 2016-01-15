var blaaApp = angular.module('blaaApp', ['ngSanitize'])
    .controller('OpusController', ['$scope', '$http', function ($scope, $http) {
        $http.get('http://blaa.demodayscript.com/conciertos/json').success(function (data) {
            $scope.concerts = data.nodes;
        });

    }])
    .controller('MenuController', ['$scope', '$http', '$location', function ($scope, $http, $location) {
        $scope.location = $location;
        $scope.menu = {
            '/': {
                label: 'Actividad cultural<br>del Banco de la<br>República',
                title: 'Actividad cultural',
                subtitle: 'Banco de la República',
                url: '/',
                style: 'cIndex'
            }
            ,
            '/areas.html': {
                label: 'Áreas<br>culturales<br>en el país',
                title: 'Áreas culturales en el país',
                subtitle: 'Banco de la República',
                url: '/areas.html',
                style: 'cAreas'
            }
            ,
            '/arte.html': {
                label: 'Arte y<br>numismática',
                title: 'Arte y numismática',
                subtitle: 'Banco de la República',
                url: '/arte.html',
                style: 'cArte'
            }
            ,
            '/bibliotecas.html': {
                label: 'Bibliotecas',
                title: 'Bibliotecas',
                subtitle: 'Banco de la República',
                url: '/bibliotecas.html',
                style: 'cBiblio'
            }
            ,
            '/bvirtual.html': {
                label: 'BVirtual',
                title: 'BVirtual',
                subtitle: 'Banco de la República',
                url: '/bvirtual.html',
                style: 'cBvirtual'
            }
            ,
            '/museo.html': {
                label: 'Museo<br>del Oro',
                title: 'Museo del Oro',
                subtitle: 'Banco de la República',
                url: '/museo.html',
                style: 'cMuseo'
            }
            ,
            '/musica.html': {
                label: 'Música',
                title: 'Opus',
                subtitle: 'Histórico de conciertos del Banco de la República',
                url: '/musica.html',
                style: 'cMusica',
                options: {
                    '/musica/temporada': {
                        label: 'Temporada nacional de conciertos',
                        url:'/musica/temporada'
                    },
                    '/musica/programacion': {
                        label: 'Programación académica',
                        url:'/musica/programacion'
                    },
                    '/musica/jovenes': {
                        label: 'Convocatoria jóvenes intérpretes',
                        url:'/musica/jovenes'
                    },
                    '/musica/lasala': {
                        label: 'La sala',
                        url:'/musica/lasala'
                    },
                    '/musica/especiales': {
                        label: 'Programas especiales',
                        url:'/musica/especiales'
                    },
                    '/musica/boleteria': {
                        label: 'Boletería',
                        url:'/musica/boleteria'
                    },
                    '/musica/info': {
                        label: 'Información práctica',
                        url:'/musica/info'
                    },
                }
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
