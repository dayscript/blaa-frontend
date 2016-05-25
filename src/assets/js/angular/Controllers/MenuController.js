/*SECCION MENUS*/
blaaApp.controller('MenuController', ['$scope', '$http', '$location','ENVIRONMENT','$rootScope', function ( $scope, $http, $location,ENVIRONMENT,$rootScope) {
    var breadcrumb;
    $location.path() == '/' ? $scope.path = '/':$scope.path = $location.path()
    $scope.menu = {
            '/': {
                label: 'Actividad cultural<br>del Banco de la<br>República',
                title: 'Actividad cultural',
                subtitle: 'Banco de la República',
                url: '/',
                style: 'cIndex',
                options:{'info-general':{label:'Información General',url:'/actividad-cultural/info-general/'+$rootScope.sucursal},
                         'contactos':{label:'Contactos',url:'/contactos',},
                         'listas-de-correo':{label:'Listas de Correo',url:'/listas-de-correo',},
                         'redes-sociales':{label: 'Redes Sociales',url:'/redes-sociales',},
                         'publicaciones-a-la-venta':{label:'Publicaciones a La Venta',url:'/publicaciones-a-la-venta',},
                         'prensa':{label:'Prensa',url:'/prensa',},
                         'blog-de-noticias':{label:'Blog De Noticias',url:'/blog-de-noticias',},
                }
        }
        ,
        '/areas-culturales': {
            label: 'Áreas<br>culturales<br>en el país',
            title: 'Áreas culturales en el país',
            subtitle: 'Banco de la República',
            url: '/areas-culturales',
            style: 'cAreas',
            options:{'/areas/todas-las-redes':{label:'todas las redes',url:'/areas/todas-las-redes',},
                '/areas/sedes-con-biblioteca':{label:'sedes con biblioteca',url:'/areas/sedes-con-biblioteca',},
                '/areas/sedes-con-museo-del-otro':{label:'sedes con museo del otro',url:'/areas/sedes-con-museo-del-otro',},
                '/areas/centros-de-documentación':{label:'centros de documentación',url:'/areas/centros-de-documentación',},
            }
        }
        ,
        '/arte-y-numismatica': {
            label: 'Arte y<br>numismática',
            title: 'Arte y numismática',
            subtitle: 'Banco de la República',
            url: '/arte-y-numismatica',
            style: 'cArte',
            options:{'/arte/información-general':{label:'información general',url:'/arte/información-general',},
                '/arte/coleccion-de-arte':{label:'coleccion de arte',url:'/arte/coleccion-de-arte',},
                '/arte/museos-botero':{label:'museos botero',url:'/arte/museos-botero',},
                '/arte/las-colecciones-y-sus-artífices':{label:'las colecciones y sus artífices',url:'/arte/las-colecciones-y-sus-artífices',},
                '/arte/patrimonio-arqueológico':{label:'patrimonio arqueológico',url:'/arte/patrimonio-arqueológico',},
                '/arte/para-maestros':{label:'para maestros',url:'/arte/para-maestros',},
                '/arte/sobre-el-museo':{label:'sobre el museo',url:'/arte/sobre-el-museo',},
            }
        }
        ,
        '/bibliotecas': {
            label: 'Bibliotecas',
            title: 'Bibliotecas',
            subtitle: 'Banco de la República',
            url: '/bibliotecas',
            style: 'cBiblio',
            options:{'/bibliotecas/noticias-y-anuncios':{label:'noticias y anuncios',url:'/bibliotecas/noticias-y-anuncios',},
                '/bibliotecas/información-general':{label:'información general',url:'/bibliotecas/información-general',},
                '/bibliotecas/hágase-socio':{label:'hágase socio',url:'/bibliotecas/hágase-socio',},
                '/bibliotecas/fonoteca':{label:'fonoteca',url:'/bibliotecas/fonoteca',},
                '/bibliotecas/colecciones-especiales':{label:'colecciones especiales',url:'/bibliotecas/colecciones-especiales',},
                '/bibliotecas/servicio-al-publico':{label:'servicio al publico',url:'/bibliotecas/servicio-al-publico',},
                '/bibliotecas/salas-de-la-biblioteca':{label:'salas de la biblioteca',url:'/bibliotecas/salas-de-la-biblioteca',},
            }
        }
        ,
        '/bvirtual': {
            label: 'BVirtual',
            title: 'BVirtual',
            subtitle: 'Banco de la República',
            url: '/bvirtual',
            style: 'cBvirtual',
            options:{'/bvirtual/inicio':{label:'inicio',url:'/bvirtual/inicio'},
                '/bvirtual/espacios':{label:'espacios',url:'/bvirtual/espacios'},
                '/bvirtual/colecciones':{label:'colecciones',url:'/bvirtual/colecciones'},
                '/bvirtual/exposiciones':{label:'exposiciones',url:'/bvirtual/exposiciones'},
                '/bvirtual/educación':{label:'educación',url:'/bvirtual/educación'},
                '/bvirtual/servicios':{label:'servicios',url:'/bvirtual/servicios'},
                '/bvirtual/contacto':{label:'contacto',url:'/bvirtual/contacto'},

            }
        }
        ,
        '/museo-del-oro': {
            label: 'Museo<br>del Oro',
            title: 'Museo del Oro',
            subtitle: 'Banco de la República',
            url: '/museo-del-oro',
            style: 'cMuseo',
            options:{'/museo/english':{label:'english',url:'/museo/english'},
                '/museo/visítenos':{label:'visítenos',url:'/museo/visítenos'},
                '/museo/exposiciones':{label:'exposiciones',url:'/museo/exposiciones'},
                '/museo/museos-del-oro-regionales':{label:'museos del oro regionales',url:'/museo/museos-del-oro-regionales'},
                '/museo/las-colecciones-y-sus-artifices':{label:'las colecciones y sus artifices',url:'/museo/las-colecciones-y-sus-artifices'},
                '/museo/patrimonio-arqueológico':{label:'patrimonio arqueológico',url:'/museo/patrimonio-arqueológico'},
                '/museo/para-maestros':{label:'para maestros',url:'/museo/para-maestros'},
                '/museo/sobre-el-museo':{label:'sobre el museo',url:'/museo/sobre-el-museo'},
            }
        }
        ,
        '/musica.html': {
            label: 'Música',
            title: 'Opus',
            subtitle: 'Histórico de conciertos del Banco de la República',
            url: '/musica.html',
            style: 'cMusica',
            options: {
                '/musica/temporada': {label: 'Temporada nacional de conciertos',url:'/musica/temporada'},
                '/musica/programacion': {label: 'Programación académica',Url:'/musica/programacion'},
                '/musica/jovenes': {label: 'Convocatoria jóvenes intérpretes',url:'/musica/jovenes'},
                '/musica/lasala': {label: 'La sala',url:'/musica/lasala'},
                '/musica/especiales': {label: 'Programas especiales',url:'/musica/especiales'},
                '/musica/boleteria': {label: 'Boletería',url:'/musica/boleteria'},
                '/musica/info': {label: 'Información práctica',url:'/musica/info'},
            }
        }
    }
    $http.get(ENVIRONMENT+'sucursales/json').success(function (data) {
        delete data.nodes[2];
        $scope.sucursales = [];
        var count = 0;
        var node;
        for( node in data.nodes ){
            $scope.sucursales[count] = data.nodes[node];
            count ++;
        }
        $rootScope.sucursales = $scope.sucursales;
    });
    $scope.onChangeCiudad = function() {
        var paths={}
        var path;
        path = $location.path()
        $rootScope.sucursal = $scope.sucursal;
        $location.path(path + $rootScope.sucursal);
    }

}]);
