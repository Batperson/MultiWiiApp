'use strict';

angular.module('settingsModule', [])
  .factory('settings', [function() {
    
    var get = function(name, def) {
      return def;
    };
    
    var set = function(name, val) {
      
    };
    
    return {
      get : get,
      set : set
    }; 
  }]);