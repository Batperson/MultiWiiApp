'use strict';

var MSP = Object.freeze({
  /* Private MSP messages */
  THR_CORRECT           : 50,
  SET_THROTTLE_CORRECT  : 51,
  BARO                  : 52,
  
  IDENT                 : 100,
  STATUS                : 101,
  RAW_IMU               : 102,
  SERVO                 : 103,
  MOTOR                 : 104,
  RC                    : 105,
  RAW_GPS               : 106,
  COMP_GPS              : 107,
  ATTITUDE              : 108,
  ALTITUDE              : 109,
  ANALOG                : 110,
  RC_TUNING             : 111,
  PID                   : 112,
  BOX                   : 113,
  MISC                  : 114,
  MOTOR_PINS            : 115,
  BOXNAMES              : 116,
  PIDNAMES              : 117,
  WP                    : 118,
  BOXIDS                : 119,
  SERVO_CONF            : 120,
  NAV_STATUS            : 121,
  NAV_CONFIG            : 122,
  CELLS                 : 130,
  
  SET_RAW_RC            : 200,
  SET_RAW_GPS           : 201,
  SET_PID               : 202,
  SET_BOX               : 203,
  SET_RC_TUNING         : 204,
  ACC_CALIBRATION       : 205,
  MAG_CALIBRATION       : 206,
  SET_MISC              : 207,
  RESET_CONF            : 208,
  SET_WP                : 209,
  SELECT_SETTING        : 210,
  SET_HEAD              : 211,
  SET_SERVO_CONF        : 212,
  SET_MOTOR             : 214,
  SET_NAV_CONFIG        : 215,
  
  SET_ACC_TRIM          : 239,
  ACC_TRIM              : 240,
  BIND                  : 241,
  EEPROM_WRITE          : 250,
  DEBUGMSG              : 253,
  DEBUG                 : 254
});
    
class MspWriter {
  constructor(buf) {
    this.view     = new DataView(buf);
    this.offset   = 0;
    this.checksum = 0;
  }
  
  writeHeader(cmd, size) {
    this.view.setUint8(this.offset++, 36);    // $
    this.view.setUint8(this.offset++, 77);    // M
    this.view.setUint8(this.offset++, 60);    // <
    this.writeUint8(size);
    this.writeUint8(cmd);
  }
  
  writeTrailer() {
    this.view.setUint8(this.offset++, this.checksum);
    this.checksum = 0;
  }
  
  writeUint8(val) {
    this.checksum ^= val;
    this.view.setUint8(this.offset++, val);
  }
  
  writeUint16(val) {
    this.checksum ^= val;
    this.view.setUint16(this.offset, val, 1);
    this.offset += 2;
  }
  
  writeUint32(val) {
    this.checksum ^= val;
    this.setUint32(this.offset, val, 1);
    this.offset += 4;
  }
  
  writeInt8(val) {
    this.checksum ^= val;
    this.view.setInt8(this.offset++, val);
  }
  
  writeInt16(val) {
    this.checksum ^= val;
    this.view.setInt16(this.offset, val, 1);
    this.offset += 2;
  }
  
  writeInt32(val) {
    this.checksum ^= val;
    this.view.setInt32(this.offset, val, 1);
    this.offset += 4;
  }
}

class MspReader {
  constructor(buf, start, len) {
    this.view = new DataView(buf, start, len);
    this.offset = 0;
  }
  
  readInt8() {
    return this.view.getInt8(this.offset++);
  }
  readInt16() {
    var v = this.view.getInt16(this.offset, 1);
    this.offset += 2;
    
    return v;
  }
  readInt32() {
    var v = this.view.getInt32(this.offset, 1);
    this.offset += 4;
    
    return v; 
  }
  readUint8() {
    return this.view.getUint8(this.offset++);
  }
  readUint16() {
    var v = this.view.getUint16(this.offset, 1);
    this.offset += 2;
    
    return v;
  }
  readUint32() {
    var v = this.view.getUint32(this.offset, 1);
    this.offset += 4;
    
    return v; 
  }
  readNames() {
    var str = '';
    while(this.offset < this.view.length) 
      str += String.fromCharCode(this.readUint8());
    
    return str.split(';');
  }
  readUint8Array() {
    var arr = [];
    while(this.offset < this.view.length) 
      arr.push(this.readUint8());
    
    return arr;
  }
  readUint16Array() {
    var arr = [];
    while(this.offset < this.view.length) 
      arr.push(this.readUint16());
    
    return arr;
  }
  readPidArray() {
    var arr = [];
    while(this.offset < this.view.length) 
      arr.push({ 
        p : this.readUint8(),
        i : this.readUint8(),
        d : this.readUint8() });
    
    return arr;
  }
}    

angular.module('mspModule', [])
  .factory('msp', [function() {
     
    var decodeMsp = function(cmd, data) {
      var retVal = {
        cmd  : cmd,
        data : data
      };
      
      switch(retVal.cmd) {
        case MSP.IDENT:
          retVal.version      = data.readUint8() / 100;
          var type            = data.readUint8();
          retVal.mspVersion   = data.readUint8();
          var caps            = data.readUint32();
          retVal.naviVersion  = (caps >> 28) & 0xF;
          retVal.capabilities = [];
          if(caps & 0x1)
            retVal.capabilities.push('BIND_CAPABLE');
          if(caps & 0x4)
            retVal.capabilities.push('DYNBAL');
          if(caps & 0x8)
            retVal.capabilities.push('FLAP');
          if(caps & 0x10)
            retVal.capabilities.push('NAVCAP');
          if(caps & 0x20)
            retVal.capabilities.push('EXTAUX');
          
          switch(type) {
            case 1:
              retVal.multitype = 'TRI';
              break;
            case 2:
              retVal.multitype = 'QUADP';
              break;
            case 3:
              retVal.multitype = 'QUADX';
              break;
            case 4:
              retVal.multitype = 'BI';
              break;
            case 5:
              retVal.multitype = 'GIMBAL';
              break;
            case 6:
              retVal.multitype = 'Y6';
              break;
            case 7:
              retVal.multitype = 'HEX6';
              break;
            case 8:
              retVal.multitype = 'FLYING_WING';
              break;
            case 9:
              retVal.multitype = 'Y4';
              break;
            case 10:
              retVal.multitype = 'HEX6X';
              break;
            case 11:
              retVal.multitype = 'OCTOX8';
              break;
            case 12:
              retVal.multitype = 'OCTOFLATP';
              break;
            case 13:
              retVal.multitype = 'OCTOFLATX';
              break;
            case 14:
              retVal.multitype = 'AIRPLANE';
              break;
            case 15:
              retVal.multitype = 'HELI_120_CCPM';
              break;
            case 16:
              retVal.multitype = 'HELI_90_DEG';
              break;
            case 17:
              retVal.multitype = 'VTAIL';
              break;
            case 18:
              retVal.multitype = 'HEX6H';
              break;
            case 20:
              retV0al.multitype = 'DUALCOPTER';
              break;
            case 21:
              retVal.multitype = 'SINGLECOPTER';
              break;
            default:
              retVal.multitype = 'Unknown - Type ' + retVal.type;
              break;
          }
          break;
        case MSP.STATUS:
          retVal.cycleTime     = data.readUint16();
          retVal.i2cErrors     = data.readUint16();
          var sensor           = data.readUint16();
          retVal.flag          = data.readUint32();
          retVal.curConfSet    = data.readUint8();
          retVal.sensors       = [];
          if(sensor & 0x1)
            retVal.sensors.push('ACC');
          if(sensor & 0x2)
            retVal.sensors.push('BARO');
          if(sensor & 0x4)
            retVal.sensors.push('MAG');
          if(sensor & 0x8)
            retVal.sensors.push('GPS');
          if(sensor & 0x10)
            retVal.sensors.push('SONAR');
          break;
        case MSP.RAW_IMU:
          retVal.acc.x         = data.readInt16();
          retVal.acc.y         = data.readInt16();
          retVal.acc.z         = data.readInt16();
          retVal.gyro.x        = data.readInt16();
          retVal.gyro.y        = data.readInt16();
          retVal.gyro.z        = data.readInt16();
          retVal.mag.x         = data.readInt16();
          retVal.mag.y         = data.readInt16();
          retVal.mag.z         = data.readInt16();
          break;
        case MSP.ACC_TRIM:
          retVal.pitch    = data.readInt16();
          retVal.roll     = data.readInt16();
          break;
        case MSP.RAW_GPS:
          retVal.fix       = data.readUint8();
          retVal.sats      = data.readUint8();
          retVal.latitude  = data.readInt32() / 10000000;
          retVal.longitude = data.readInt32() / 10000000;
          retVal.altitude  = data.readInt16();
          retVal.speed     = parseFloat((data.readInt16() / 100.0).toFixed(2));
          retVal.heading   = data.readUint16();
          break;
        case MSP.COMP_GPS:
          retVal.distanceHome  = data.readUint16();
          retVal.directionHome = data.readInt16();
          retVal.update        = data.readUint8();
          break;
        case MSP.ATTITUDE:
          retVal.roll    = parseFloat((data.readInt16() / 10.0).toFixed(1));
          retVal.pitch   = parseFloat((data.readInt16() / 10.0).toFixed(1));
          retVal.heading = data.readInt16();
          break;
        case MSP.ALTITUDE:
          retVal.estAlt  = parseFloat((data.readInt32() / 100.0).toFixed(2));
          retVal.vario   = parseFloat((data.readInt16() / 100.0).toFixed(2));
          break;
        case MSP.ANALOG:
          retVal.vbat          = data.readUint8();
          retVal.powerMeterSum = data.readUint16();
          retVal.rssi          = data.readUint16();
          retVal.amperage      = data.readUint16();
          if(data.byteLength >= 8)
            retVal.vbatNominal = data.readUint8();
          break;
        case MSP.DEBUG:
          retVal.debug1        = data.readInt16();
          retVal.debug2        = data.readInt16();
          retVal.debug3        = data.readInt16();
          retVal.debug4        = data.readInt16();
          break;
        case MSP.BOX:
          retVal.boxstates     = data.readUint16Array();
          break;
        case MSP.BOXNAMES:
          retVal.boxnames      = data.readNames();
          break;
        case MSP.BOXIDS:
          retVal.boxids        = data.readUint8Array();
          break;
        case MSP.PID:
          retVal.pids          = data.readPidArray();
          break;
        case MSP.PIDNAMES:  
          retVal.pidnames      = data.readNames();
          break;
        case MSP.BARO:
          retVal.pressure  = data.readUint32();
          retVal.temperature = data.readUint16();
          break;
        case MSP.NAV_STATUS:
          switch(data.readUint8()) {
            case 0:
              retVal.gpsMode = 'none';
              break;
            case 1:
              retVal.gpsMode = 'hold';
              break;
            case 2:
              retVal.gpsMode = 'rth';
              break;
            case 3:
              retVal.gpsMode = 'nav';
              break;
            default:
              retVal.gpsMode = 'unknown';
              break;
          }
          switch(data.readUint8()) {
            case 0:
              retVal.navState = 'none';
              break;
            case 1:
              retVal.navState = 'rth_start';
              break;
            case 2:
              retVal.navState = 'rth_enroute';
              break;
            case 3:
              retVal.navState = 'hold_infinite';
              break;
            case 4:
              retVal.navState = 'hold_timed';
              break;
            case 5:
              retVal.navState = 'wp_enroute';
              break;
            case 6:
              retVal.navState = 'process_next';
              break;
            case 7:
              retVal.navState = 'do_jump';
              break;
            case 8:
              retVal.navState = 'land_start';
              break;
            case 9:
              retVal.navState = 'land_in_progress';
              break;
            case 10:
              retVal.navState = 'landed';
              break;
            case 11:
              retVal.navState = 'land_settle';
              break;
            case 12:
              retVal.navState = 'land_start_descent';
              break;
            default:
              retVal.navState = 'unknown';
              break;
          }
          switch(data.readUint8()) {
            case 0:
              retVal.navState = 'none';
              break;
            case 1:
              retVal.navState = 'toofar';
              break;
            case 2:
              retVal.navState = 'spoiled_gps';
              break;
            case 3:
              retVal.navState = 'wp_crc_error';
              break;  
            case 4:
              retVal.navState = 'finish';
              break;
            case 5:
              retVal.navState = 'timewait';
              break;
            case 6:
              retVal.navState = 'invalid_jump';
              break;
            case 7:
              retVal.navState = 'invalid_data';
              break;
            case 8:
              retVal.navState = 'wait_for_rth_alt';
              break;
            case 9:
              retVal.navState = 'gps_fix_lost';
              break;
            case 10:
              retVal.navState = 'disarmed';
              break;
            case 11:
              retVal.navState = 'landing';
              break;
            default:
              retVal.navState = 'unknown';
              break;
          }
          switch(data.readUint8()) {
            case 1:
              retVal.missionStepAction = 'waypoint';
              break;
            case 2:
              retVal.missionStepAction = 'hold_infinite';
              break;
            case 3:
              retVal.missionStepAction = 'hold_time';
              break;
            case 4:
              retVal.missionStepAction = 'rth';
              break;
            case 5:
              retVal.missionStepAction = 'set_poi';
              break;
            case 6:
              retVal.missionStepAction = 'jump';
              break;
            case 7:
              retVal.missionStepAction = 'set_heading';
              break;
            case 8:
              retVal.missionStepAction = 'land';
              break;
            default:
              retVal.missionStepAction = 'unknown';
              break;
          }
          retVal.missionStepNumber = data.readUint8();
          retVal.navError          = data.readUint8();
          retVal.targetHeading     = data.readInt16();
          break;
        case MSP.WP:
          retVal.missionStepNumber = data.readUint8();
          switch(data.readUint8()) {
            case 1:
              retVal.missionStepAction = 'waypoint';
              break;
            case 2:
              retVal.missionStepAction = 'hold_infinite';
              break;
            case 3:
              retVal.missionStepAction = 'hold_time';
              break;
            case 4:
              retVal.missionStepAction = 'rth';
              break;
            case 5:
              retVal.missionStepAction = 'set_poi';
              break;
            case 6:
              retVal.missionStepAction = 'jump';
              break;
            case 7:
              retVal.missionStepAction = 'set_heading';
              break;
            case 8:
              retVal.missionStepAction = 'land';
              break;
            default:
              retVal.missionStepAction = 'unknown';
              break;
          }
          retVal.latitude  = data.readInt32() / 10000000;
          retVal.longitude = data.readInt32() / 10000000;
          retVal.altitude = data.readInt32();
          retVal.param1   = data.readUint16();
          retVal.param2   = data.readUint16();
          retVal.param3   = data.readUint16();
          retVal.flags     = [];
          
          var f = data.readUint8();
          if(f & 0x01)
            retVal.flags.push('home');
          if(f & 0x02)
            retVal.flags.push('hold');
          if(f & 0x20)
            retVal.flags.push('land');
          if(f & 0xA5)
            retVal.flags.push('end');
          if(f & 0xFE)
            retVal.flags.push('crc_error');
          if(f & 0xFF)
            retVal.flags.push('nav_in_prog');  
          break;
        default:
          break;
      }
      
      return retVal;
    }
    
    var encodeMsp = function(msg) {
      var msgs      = (msg.constructor === Array) ? msg : [msg];
      msgs.forEach(function(m,i,a) {
        if(typeof m === 'number')
          a[i] = { cmd: m };
      });
      
      var lens      = msgs.map(function(m) { return getMsgBufLen(m); });
      var totlen    = lens.reduce(function(sum,cur) { return sum + cur; }, 0);
      var data      = new ArrayBuffer(totlen);
      var writer    = new MspWriter(data);
      
      data.cmds     = [];
      msgs.forEach(function(m, i, a) {
        var len = lens[i];
        data.cmds.push(m.cmd);
        writer.writeHeader(m.cmd, len-6);
        switch(m.cmd) {
          case MSP.WP:
            writer.writeUint8(m.missionStepNumber);
            break;
          default:
            break;
        }
        writer.writeTrailer();
      });
      
      return data;
    }
    
    var getMsgBufLen = function(msg) {
      var cmd = msg.cmd;
      
      switch(msg.cmd) {
        case MSP.WP:
          return 7;
        default:
          return 6;
      }
    };
    
    return {
      decodeMsp    : decodeMsp,
      encodeMsp    : encodeMsp
    }; 
  }]);