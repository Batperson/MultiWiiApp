'use strict';

angular.module('cockpitModule', ['pollModule', 'settingsModule'])
  .controller('cockpitController', ['coms', 'msp', 'poll', 'settings', '$document', '$interval', function(coms, msp, poll, settings, $document, $interval) {
    var timer1;
    var attitudeGauge;
    var headingGauge;
    var variometerGauge;
    var airspeedGauge;
    var altimeterGauge;
    var turnCoordGauge;
    
    var interval      = 0;
    var timerRate     = 50; // 20hz update
    
    coms.addListener('connection', function(state) {
      switch(state) {
        case 'connected':
          timer1 = $interval(function() {
            coms.send(MSP.ATTITUDE);
            coms.send(MSP.ALTITUDE);
            coms.send(MSP.RAW_GPS);
            
            if((interval++ % 5) == 0) {
              coms.send(MSP.STATUS);
              coms.send(MSP.ANALOG);
            }
            
          }, timerRate, 0, false);
          break;
        case 'disconnected':
          $interval.cancel(timer1);
          break;
      }
    });
    coms.addListener('msp', function(msg) {
      switch(msg.cmd) {
        case MSP.ATTITUDE:
          attitudeGauge.setRoll(msg.roll);
          attitudeGauge.setPitch(-msg.pitch);
          headingGauge.setHeading(msg.heading);
          break;
        case MSP.ALTITUDE:
          altimeterGauge.setAltitude(msg.estAlt * 100);
          variometerGauge.setVario(msg.vario);
          break;
        case MSP.RAW_GPS:
          airspeedGauge.setAirSpeed(msg.speed);
          break;
        case MSP.STATUS:
        case MSP.ANALOG:
          break;
      } 
    });

    $document.ready(function () {
      attitudeGauge   = $.flightIndicator('#attitude', 'attitude', { size: 155, img_directory: 'images/'});
      headingGauge    = $.flightIndicator('#heading', 'heading', { size: 155, img_directory: 'images/'});
      variometerGauge = $.flightIndicator('#variometer', 'variometer', { size: 155, img_directory: 'images/'});
      airspeedGauge   = $.flightIndicator('#airspeed', 'airspeed', { size: 155, img_directory: 'images/'});
      altimeterGauge  = $.flightIndicator('#altimeter', 'altimeter', { size: 155, img_directory: 'images/'});
      turnCoordGauge  = $.flightIndicator('#turn-coordinator', 'turn_slip_indicator', {size: 155, img_directory: 'images/'});
    }); 
  }]);