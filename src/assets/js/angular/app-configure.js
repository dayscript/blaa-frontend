'use strict';
var blaaApp = angular.module('blaaApp', ['ngSanitize','ngRoute','ncy-angular-breadcrumb',
                                         'ngPrettyJson','chieffancypants.loadingBar',
                                         'ngAnimate','ngPrettyJson','angular-google-analytics'])
    .constant('ENVIRONMENT', 'http://blaa.demodayscript.com/')
    .constant('ENVIRONMENTFRONT', '/')
    .config(function(cfpLoadingBarProvider) {
      cfpLoadingBarProvider.includeSpinner = true;
    })
    .config(function (AnalyticsProvider) {
      AnalyticsProvider.useAnalytics(false);
      AnalyticsProvider.setAccount('UA-43463194-1');
      AnalyticsProvider.trackPages(true);
    });

blaaApp.filter('extractNidString', function() {
  return function(string) {
      var regex = /\d+$/;
      var matches = string.match(regex);

      return (matches ? matches.shift() : 0);
  };
});


function print(text,variable){
    console.log(text+':'+variable);
}
