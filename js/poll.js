'use strict';

angular.module('pollModule', ['comsModule'])
  .factory('poll', ['coms', 'msp', function(coms, msp) {
    var timerId;
    var schedules  = [ [], [], [] ];
    var interval   = 200; // 5 hz default
    var iteration  = 0;
    
    var setRefreshRate = function(rateHz) {
      if(!rateHz)
        throw new Error('Invalid rate specified');
      
      refresh = 1000 / rateHz;
      
      if(timerId) 
        start();
    };
    
    var start = function() {
      if(timerId)
        stop();
      
      timerId = window.setInterval(function() {
        var cmds = schedules[0];
        
        if(iteration % 4 == 0)
          cmds = cmds.concat(schedules[1]);
        if(iteration % 8 == 0)
          cmds = cmds.concat(schedules[2]);
        if(++iteration == 8)
          iteration = 0;
        
        if(cmds.length > 0)
          coms.send(cmds);
        
      }, interval);
    };
    
    var stop = function() {
      if(timerId) {
        window.clearInterval(timerId);
      }
    };
    
    var addCmd = function(cmd, schedule) {
      if(typeof cmd != 'number')
        throw new Error('Invalid command specified');
      if(!schedule || schedule < 0 || schedule > 2)
        throw new Error('Invalid schedule specified');
      
      s = schedules[schedule];
      var ix = s.findIndex(function(e,i,a) { return (e === cmd); });
      if(ix < 0)
        s.push(cmd);
    };
    
    var removeCmd = function(cmd) {
      if(typeof cmd != 'number')
        throw new Error('Invalid command specified');
      
      schedules.forEach(function(schedule, i, a) {
        var ix = schedules.findIndex(function(e,i,a) { return (e === cmd); });
        
        if(ix >= 0) 
          schedules.splice(ix, 1);
      });
    };
  
    return {
      setRefreshRate : setRefreshRate,
      addCmd: addCmd,
      removeCmd : removeCmd,
      start : start,
      stop : stop
  }; 
}]);