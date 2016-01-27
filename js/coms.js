'use strict';

angular.module('comsModule', ['mspModule'])
  .factory('coms', ['$q', 'msp', function($q, msp) {
    var errors           = 0;
    var status           = 'disconnected';
    var connectionId     = null;
    var comEventHandlers = [];
    var mspEventHandlers = [];
    var errEventHandlers = [];
    var mspReplyPromises = new Object;
    
    var STATE = Object.freeze({
      DOLLAR    : 0,
      EM        : 1,
      DIRECTION : 2,
      SIZE      : 3,
      CMD       : 4,
      DATA      : 5
    });
     
    var recvState = {
      cmd       : 0,
      offset    : 0,
      size      : 0,
      state     : STATE.DOLLAR,
      checksum  : 0,
      bytesRead : 0,
      invCmd    : false,
      view      : new Uint8Array(new ArrayBuffer(128))
    }
     
    var addListener = function(eventName, handler) {
      switch(eventName) {
        case 'connection':
          comEventHandlers.push(handler);
          break;
        case 'msp':
          mspEventHandlers.push(handler);
          break;
        case 'protocol_err':
          errEventHandlers.push(handler);
          break;
      }
    };
    
    var connect = function(path, baud) {
      window.setTimeout(function() {
        if(status != 'connected') {
          raiseEvent('connection', 'connecting');
        }
      }, 0);
      
      chrome.serial.connect(path, { bitrate : baud, ctsFlowControl : false }, function(info) {
        if(chrome.runtime.lastError) {
          raiseEvent('connection', 'disconnected');
        } 
        else {
          connectionId = info.connectionId;
          errors       = 0;

          send(MSP.IDENT, function() {
            raiseEvent('connection', 'connected');
          }, function(e) {
            disconnect();
          }, 3);
        }
      });
    };
    
    var send = function(msg, success, failure, attempts, timeout) {
      if(!connectionId)
        throw new Error('Connection has not been established.');
      if(!msg === undefined)
         throw new Error('Invalid message data.');
       if(!attempts)
         attempts = 1;
       if(!timeout)
         timeout = 500;
       
      var data     = msp.encodeMsp(msg);
      
      var doSend = function() {
        if(success)
        {
          data.cmds.forEach(function(cmd,i,a) {
            var a        = attempts;
            var deferred = $q.defer();
          
            // TODO: merge promises if already in existence.
            mspReplyPromises[cmd] = deferred;
            if(!failure) {
              deferred.promise.then(success);
            }
            else {
              if(--a >= 1) {
                var retry = function(e) {
                  if(e.error == 'not_understood') {
                    failure(e);
                  }
                  else {
                    doSend(connectionId, data);
                  }
                };
                
                deferred.promise.then(success, retry);
              }
              else {
                deferred.promise.then(success, failure);
              }
            }
          });
        }
        
        chrome.serial.send(connectionId, data, function(info) {
          chrome.serial.flush(connectionId, function(result) {   
            if(success) {
              window.setTimeout(function() {
                data.cmds.forEach(function(cmd, i, a) {
                  if(mspReplyPromises[cmd]) { 
                    mspReplyPromises[cmd] = undefined;
                    deferred.reject({ error: 'timeout', description: 'No response received from flight controller.' });
                  }
                });
              }, timeout);
            }
          }); 
        });
      }
   
      doSend();
    };
    
    var disconnect = function() {
      chrome.serial.disconnect(connectionId, function(result) {
        if(result) {
          connectionId = undefined;
          raiseEvent('connection', 'disconnected');
        }
      });
    };
    
    var raiseEvent = function(eventName, eventData) {
      var handlers;
      switch(eventName) {
        case 'connection':
          status   = eventData;
          console.log('Connection status: ' + eventData);
          handlers = comEventHandlers;
          break;
        case 'msp':
          var cmd = eventData.cmd;
          if(mspReplyPromises[cmd])
          {
            mspReplyPromises[cmd].resolve(eventData);
            mspReplyPromises[cmd] = undefined;
          } 
          handlers = mspEventHandlers;
          break;
        case 'msp_notunderstood':
          if(mspReplyPromises[eventData])
          {
            mspReplyPromises[eventData].reject({ error: 'not_understood', description: 'The command was not understood by the flight controller.' });
            mspReplyPromises[eventData] = undefined;
          } 
          break;
        case 'protocol_error':
          if(mspReplyPromises[eventData])
          {
            mspReplyPromises[eventData].reject({ error: 'protocol_error', description: 'An invalid response was received from the flight controller.' });
            mspReplyPromises[eventData] = undefined;
          } 
          eventData = ++errors;
          handlers  = errEventHandlers;
          break;
      }
      
      if(handlers) {
        handlers.forEach(function(h, i, a) {
          h(eventData);
        });
      }
    };

    chrome.serial.onReceive.addListener(function(info) {
      if(info.connectionId == connectionId && info.data) {
        var dataView = new Uint8Array(info.data);
        
        for(var i=0; i<info.data.byteLength; i++) {
          var val = dataView[i];
          recvState.view[recvState.offset++] = val;
          
          switch(recvState.state) {
            case STATE.DOLLAR:
              recvState.bytesRead = 0;
              recvState.state = (val == 36) ? STATE.EM : STATE.DOLLAR;
              break;
            case STATE.EM:
              recvState.state = (val == 77) ? STATE.DIRECTION : STATE.DOLLAR;
              break;
            case STATE.DIRECTION: 
              recvState.state  = (val == 62 || val == 33) ? STATE.SIZE : STATE.DOLLAR;
              recvState.invCmd = (val == 33);
              break;
            case STATE.SIZE:
              recvState.size = val;
              recvState.checksum ^= val;
              recvState.state = STATE.CMD;
              break;
            case STATE.CMD:
              recvState.cmd = val;
              recvState.checksum ^= val;
              recvState.state = STATE.DATA;
              break;
            case STATE.DATA:
              if(++recvState.bytesRead > recvState.size)
              {
                if(recvState.invCmd) 
                  raiseEvent('msp_notunderstood', recvState.cmd);
                else if(recvState.checksum != val) 
                  raiseEvent('protocol_error', recvState.cmd);
                else
                  raiseEvent('msp', msp.decodeMsp(recvState.cmd, (recvState.size > 0) ? new MspReader(recvState.view.buffer, 5, recvState.size) : null));

                recvState.state     = STATE.DOLLAR;
                recvState.checksum  = 0;
                recvState.offset    = 0;
              }
              else
              {
                recvState.checksum ^= val;
              }
              break;
            default:  // Unknown state, should not end up here.
              console.log('Unknown state when receiving MSP message; state=' + recvState.state);
              recvState.state = STATE.DOLLAR;
              break;
          }
        }
      }
    });
    
    chrome.serial.onReceiveError.addListener(function(info) {
      if(info.connectionId == connectionId) {
        console.log('Port error: ' + info.error)
        switch(info.error) {
          case 'system_error':
            chrome.serial.setPaused(connectionId, false, function() {
              chrome.serial.getInfo(connectionId, function(info) {
                if(info.paused) {
                  console.log('Unable to recover from port error, disconnecting.');
                  disconnect();
                } else {
                 console.log('Recovered from port error.'); 
                }
              });
            });
            break;
          default:
            disconnect();
            break;
        }
      }
    });
    
    return {
      addListener : addListener,
      connect: connect,
      send : send,
      disconnect: disconnect
    }; 
  }]);