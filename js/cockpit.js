'use strict';

angular.module('cockpitModule', ['pollModule', 'settingsModule'])
  .controller('cockpitController', ['coms', 'msp', 'poll', 'settings', '$document', '$interval', function(coms, msp, poll, settings, $document, $interval) {
    var attitudeGauge;
    var headingGauge;
    var variometerGauge;
    var airspeedGauge;
    var altimeterGauge;
    var turnCoordGauge;
    var voltsGauge;
    var ampsGauge;

    coms.addListener('connection', function(state) {
      switch(state) {
        case 'connected':
          poll.addCmd(MSP.ATTITUDE, 0);
          poll.addCmd(MSP.ALTITUDE, 0);
          poll.addCmd(MSP.RAW_GPS, 1);
          poll.addCmd(MSP.COMP_GPS, 1);
          poll.addCmd(MSP.STATUS, 1);
          poll.addCmd(MSP.ANALOG, 1);
          break;
        case 'disconnected':
          break;
      }
    });
    coms.addListener('msp', function(msg) {
      switch(msg.cmd) {
        case MSP.ATTITUDE:
          attitudeGauge.setRoll(msg.roll);
          attitudeGauge.setPitch(msg.pitch);
          headingGauge.setHeading(msg.heading);
          break;
        case MSP.ALTITUDE:
          altimeterGauge.setAltitude(msg.estAlt * 100);
          variometerGauge.setVario(msg.vario);
          break;
        case MSP.RAW_GPS:
          airspeedGauge.setAirspeed(msg.speed);
          break;
        case MSP.COMP_GPS:
          headingGauge.setBeacon2(msg.directionHome);
          headingGauge.showBeacon2(true);
          break;
        case MSP.STATUS:
          break;
        case MSP.ANALOG:
          voltsGauge.setVolts(msg.vbat / 10);
          ampsGauge.setAmps(msg.amperage);
          break;
      } 
    });

    $document.ready(function () {
      attitudeGauge   = $.attitude('#attitude', { size: 140 });
      headingGauge    = $.heading('#heading', { size: 140 });
      variometerGauge = $.variometer('#variometer', { size: 140, caption2: 'METRES / SECOND' });
      airspeedGauge   = $.airspeed('#airspeed', { size: 140, caption2: 'METRES / SECOND' });
      altimeterGauge  = $.altimeter('#altimeter', { size: 140, caption2: '1 METRE', caption3: '10', caption4: 'METRES' });
      turnCoordGauge  = $.turn_slip_indicator('#turn-coordinator', {size: 140 });
      voltsGauge      = $.voltmeter('#voltmeter', {size: 140, minVolts: 10, maxVolts: 13, warnVolts: 11.5, criticalVolts: 11.1 });
      ampsGauge       = $.ammeter('#ammeter', {size: 140 });
    }); 
  }]);