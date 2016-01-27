'use strict';

angular.module('terminalModule', [])
  .controller('terminalController', ['coms', 'msp', function(coms, msp) {
    this.input = '';
    this.console = [];
    this.regexInput = /^\s*(\w+)(?:\s+(\w+)(?:=([^\s]+))?)*/;
    
    this.terminalLineClass = function(l) {
      switch(l.type) {
        case 'in':
          return 'term-input';
        case 'out':
          return 'term-output';
        case 'error':
          return 'term-error';
        default:
          return '';
      }
    };
    
    this.keyDown = function(evt) {
      if(evt.keyCode == 13) {
        this.send();
      }
    };
    
    this.send = function() {
      this.console.push({ type: 'in', line: this.input });
      this.parseCommand(this.input);
      this.input = '';
    };
    
    this.output = function(msg) {
      this.console.push({ type: 'out', line : msg });
    };
    
    this.error = function(msg) {
      this.console.push({ type: 'error', line : msg });
    };
    
    this.outputMsp = function(msg) {    
      var str = this.getCmdName(msg.cmd);
      
      for(var prop in msg) {
        if(prop != 'cmd' && prop != 'data') {
          str += ' ' + prop + ': ' + msg[prop].toString();
        }
      }
      
      this.output(str);
    };
    
    this.getCmdName = function(cmd) {
      for (var nm in MSP) {
        if(MSP[nm] == cmd)
          return nm;
      }
      
      return cmd.toString();
    };
    
    this.parseCommand = function(cmd) {
      if(cmd) {
        var r = this.regexInput.exec(cmd);
        if(r && r[1]) {
          switch(r[1].toLowerCase()) {
            case 'help':
              this.help(r[2]);
              break;
            default:
              this.execMsp(r);
          }
        } else {
          this.error('Syntax error.');
        }
      }
    };
    
    this.execMsp = function(r) {
      var cmdName = r[1].toUpperCase();
      if(Object.keys(MSP).indexOf(cmdName) < 0) {
        this.error('Command not understood.');
      } else {
        var msg = {
          cmd : MSP[cmdName]
        };
        
        // TODO: Populate other properties
        var me = this;
        try
        {
          coms.send(msg, function(resp) {
            me.outputMsp(resp);
          }, function(e) {
            me.error(e.description);
          }, 3, 100);
        }
        catch(e)
        {
          me.error(e);
        }
      }
    };
     
    this.help = function(arg) {
      if(arg) {
        switch(arg.toUpperCase()) {
          case 'HELP':
            this.output('Displays available commands.');
            break;
          default: 
            this.output('No help available for "' + arg + '" because it is not understood.');
            break;
        }
      } else {
        var str = 'Valid commands: HELP';
        Object.keys(MSP).forEach(function(v,i,a) { str += ', ' + v; });
        
        this.output(str);
      }
    };
  }]);