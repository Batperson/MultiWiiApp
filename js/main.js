'use strict';

var mainApp = angular.module('mainApp', ['leaflet-directive', 'ui.bootstrap', 'mainModule', 'cockpitModule', 'terminalModule', 'navigationModule']);

angular.module('mainModule', ['pollModule', 'settingsModule'])
  .controller('navController', ['$scope', '$http', 'coms', 'msp', 'poll', 'settings', function($scope, $http, coms, msp, poll, settings) {
    this.port        = 'COM8';
    this.baud        = '115200';
    this.serialPorts = [];
    this.baudRates   = ['9600', '14400', '19200', '28800', '38400', '57600', '115200'];
    this.noConnect   = false;
    this.connected   = false;
    
    var nav = this;
    coms.addListener('connection', function(status) {
      switch(status) {
        case 'disconnected':
          nav.noConnect = false;
          nav.connected = false;
          $scope.$apply();
          break;
        case 'connected':
          nav.connected = true;
          nav.noConnect = true;
        default:
          nav.noConnect = true;
          break;
      }
    });
    
    this.connect = function() {
      nav.noConnect = true;
      coms.connect(nav.port, Number(nav.baud));
    };
    
    this.disconnect = function() {
      coms.disconnect();
    };
    
    chrome.serial.getDevices(function(ports) {
      $scope.$apply(function() {
        nav.serialPorts = ports.map(function(p) { return p.path; });
        nav.serialPorts.push('COM12');  // test code
      });
    }); 
  }])
  .controller('statusController', ['$scope', 'coms', 'msp', function($scope, coms, msp) {
    $scope.connected             = false;
    $scope.connectionStatus      = 'Disconnected';
    $scope.connectionStatusClass = 'label label-danger';
    $scope.statusText            = '';
    $scope.mspErrors             = 0;
    $scope.i2cErrors             = 0;
    $scope.cycleTime             = 0;
    $scope.gps                   = { fix: false, sats: 0 };
    $scope.nav                   = { active: false, state: 'none' };
    
    $scope.cycleTimeClass = function() {
      if(!$scope.connected)
        return 'label label-default';
      
      return 'label label-info';
    }
    
    $scope.navClass = function(nav) {
      if(!$scope.connected)
        return 'label label-default';
      return 'label label-default';
    };
    
    $scope.gpsClass = function(gps) {
      if(!$scope.connected)
        return 'label label-default';
      else if($scope.gps.fix)
        return 'label label-success';
      else if($scope.gps.sats > 0)
        return 'label label-warning';
      else
        return 'label label-danger';
    };
    
    $scope.errorCountClass = function(errors) {
      if(!$scope.connected)
        return 'label label-default';
      else if(!errors || errors == 0)
        return 'label label-success';
      else if(errors < 100)
        return 'label label-warning';
      else
        return 'label label-danger';
    };
    
    coms.addListener('connection', function(status) {
      switch(status) {
        case 'connecting':
          $scope.connectionStatus = 'Connecting...';
          $scope.connectionStatusClass = 'label label-info';
          break;
        case 'connected':
          $scope.connected             = true;
          $scope.connectionStatus      = 'Connected';
          $scope.connectionStatusClass = 'label label-success';
          break;
        case 'disconnected':
          $scope.connected             = false;
          $scope.statusText            = 'Disconnected from flight controller';
          $scope.connectionStatus      = 'Disconnected';
          $scope.connectionStatusClass = 'label label-danger';
          $scope.mspErrors             = 0;
          $scope.i2cErrors             = 0;
          $scope.cycleTime             = 0;
          $scope.gps                   = { fix: false, sats: 0 };
          $scope.nav                   = { active: false, state: 'none' };
          $scope.$apply();
          break;
      }
    }); 
    coms.addListener('protocol_err', function(errors) {
      $scope.mspErrors = errors;
      $scope.$apply();
    });
    coms.addListener('msp', function(msg) {
      switch(msg.cmd) {
        case MSP.RAW_GPS:
          $scope.gps.fix  = (msg.fix > 0);
          $scope.gps.sats = msg.sats;
          break;
        case MSP.IDENT:
          $scope.statusText = 'Communication established - MultiWii version ' + msg.version + ' - Craft type ' + msg.multitype + '.';
          break;
      }
    }); 
  }])
  .controller('toolController', ['$scope', function($scope) { 
    var newTools = {};
    $('.tool').each(function(ix, val) {
      var $val = $(val);
      newTools[ix] = {
        "id" : ix,
        "label" :  $val.attr('tool-title'),
        "active" : (ix == 0),
        "new" :    $val.hasClass('newtool'),
        "elem" :   val
      };
      
      if(ix == 0) {
        $val.trigger('nav-showing');
        $val.show();
        $val.trigger('nav-shown');
      }
    });
    
    this.navigate = function(id) {
      $.each(this.tools, function(ix, val) {
        var $elem = $(val.elem);
        if(ix == id) {
          val.active = true;  
          $elem.trigger('nav-showing');
          $elem.show();
          $elem.trigger('nav-shown');
        } 
        else {
          if(val.active)
             $elem.trigger('nav-hiding');
          
          val.active = false;  
          $elem.hide();
        }
      });
    };
    
    this.tools = newTools; 
  }]);
