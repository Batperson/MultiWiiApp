/* 
* jQuery Flight Indicators plugin
* By Sébastien Matton (seb_matton@hotmail.com)
* Published under GPLv3 License.
* 
* https://github.com/sebmatton/jQuery-Flight-Indicators
*/
(function($) {
	function FlightIndicator( placeholder, type, options ) {
		// Initial configuration
		var attitude = this;
		var settings = $.extend({
			size : 200,
			roll : 0,
			pitch : 0,
			turn : 0,
			heading: 0,
			vario: 0,
			airspeed: 0,
			altitude: 0,
			pressure: 1000,
			showBox : true,
			img_directory : 'img/'
		}, options );

		var constants = {
			pitch_bound:30,
			vario_bound : 1.95,
			airspeed_bound_l : 0,
			airspeed_bound_h : 160
		}

		// Creation of the instrument
		placeholder.each(function(){
			switch(type){
				case 'heading':
					$(this).html('<div class="instrument heading"><img src="' + settings.img_directory + 'fi_box.svg" class="background box" alt="" /><div class="heading box"><img src="' + settings.img_directory + 'heading_yaw.svg" class="box" alt="" /></div><div class="mechanics box"><img src="' + settings.img_directory + 'heading_mechanics.svg" class="box" alt="" /><img src="' + settings.img_directory + 'fi_circle.svg" class="box" alt="" /></div></div>');
					_setHeading(settings.heading);
				break;
				case 'variometer':
					$(this).html('<div class="instrument vario"><img src="' + settings.img_directory + 'fi_box.svg" class="background box" alt="" /><img src="' + settings.img_directory + 'vertical_mechanics.svg" class="box" alt="" /><div class="vario box"><img src="' + settings.img_directory + 'fi_needle.svg" class="box" alt="" /></div><div class="mechanics box"><img src="' + settings.img_directory + 'fi_circle.svg" class="box" alt="" /></div></div>');
					_setVario(settings.vario);
				break;
        case 'turn_coordinator':
					$(this).html('<div class="instrument turn_coordinator"><img src="' + settings.img_directory + 'fi_box.svg" class="background box" alt="" /><img src="' + settings.img_directory + 'turn_coordinator_mechanics.svg" class="box" alt="" /><div class="skid box"><img src="' + settings.img_directory + 'fi_tc_ball.svg" class="box" alt="" /></div><img src="' + settings.img_directory + 'fi_tc_plate.svg" class="box" alt="" /><div class="turn box"><img src="' + settings.img_directory + 'fi_tc_airplane.svg" class="box" alt="" /></div><div class="mechanics box"><img src="' + settings.img_directory + 'fi_tc_glass.svg" class="box" alt="" /><img src="' + settings.img_directory + 'fi_circle.svg" class="box" alt="" /></div></div>');
					_setTurn(settings.turn);
				break;
        case 'turn_slip_indicator':
					$(this).html('<div class="instrument turn_coordinator"><img src="' + settings.img_directory + 'fi_box.svg" class="background box" alt="" /><img src="' + settings.img_directory + 'turn_coordinator_mechanics.svg" class="box" alt="" /><div class="skid box"><img src="' + settings.img_directory + 'fi_tc_ball.svg" class="box" alt="" /></div><img src="' + settings.img_directory + 'fi_tc_plate.svg" class="box" alt="" /><div class="mechanics box"><img src="' + settings.img_directory + 'fi_ts_glass.svg" class="box" alt="" /><img src="' + settings.img_directory + 'fi_circle.svg" class="box" alt="" /></div><div class="turn_needle box"><img src="' + settings.img_directory + 'fi_needle.svg" class="box" alt="" /></div></div>');
					_setTurn(settings.turn);
				break;
				case 'airspeed':
					$(this).html('<div class="instrument airspeed"><img src="' + settings.img_directory + 'fi_box.svg" class="background box" alt="" /><img src="' + settings.img_directory + 'speed_mechanics.svg" class="box" alt="" /><div class="speed box"><img src="' + settings.img_directory + 'fi_needle.svg" class="box" alt="" /></div><div class="mechanics box"><img src="' + settings.img_directory + 'fi_circle.svg" class="box" alt="" /></div></div>');
					_setAirSpeed(settings.airspeed);
				break
				case 'altimeter':
					$(this).html('<div class="instrument altimeter"><img src="' + settings.img_directory + 'fi_box.svg" class="background box" alt="" /><div class="pressure box"><img src="' + settings.img_directory + 'altitude_pressure.svg" class="box" alt="" /></div><img src="' + settings.img_directory + 'altitude_ticks.svg" class="box" alt="" /><div class="needleSmall box"><img src="' + settings.img_directory + 'fi_needle_small.svg" class="box" alt="" /></div><div class="needle box"><img src="' + settings.img_directory + 'fi_needle.svg" class="box" alt="" /></div><div class="mechanics box"><img src="' + settings.img_directory + 'fi_circle.svg" class="box" alt="" /></div></div>');
					_setAltitude(settings.altitude);
					_setPressure(settings.pressure);
				break;
        case 'generic':
          $(this).html('<div class="instrument generic"><img src="' + settings.img_directory + 'fi_box.svg" class="background box" alt="" /><div class="needle box"><img src="' + settings.img_directory + 'fi_needle.svg" class="box" alt="" /></div><div class="mechanics box"><img src="' + settings.img_directory + 'fi_circle.svg" class="box" alt="" /></div></div>');
					_setValue(settings.value);
          _setSecondaryValue(settings.secondaryValue);
        break;
        case 'attitude':
				default:
					$(this).html('<div class="instrument attitude"><img src="' + settings.img_directory + 'fi_box.svg" class="background box" alt="" /><div class="roll box"><img src="' + settings.img_directory + 'horizon_back.svg" class="box" alt="" /><div class="pitch box"><img src="' + settings.img_directory + 'horizon_ball.svg" class="box" alt="" /></div><img src="' + settings.img_directory + 'horizon_circle.svg" class="box" alt="" /></div><div class="mechanics box"><img src="' + settings.img_directory + 'horizon_mechanics.svg" class="box" alt="" /><img src="' + settings.img_directory + 'fi_circle.svg" class="box" alt="" /></div></div>');
					_setRoll(settings.roll);
					_setPitch(settings.pitch);
			}
			$(this).find('div.instrument').css({height : settings.size, width : settings.size});
			$(this).find('div.instrument img.box.background').toggle(settings.showBox);
		});

		// Private methods
    function _setValue(value) {
      var needle = 90;
			placeholder.each(function(){
				$(this).find('div.instrument.generic div.needle').css('transform', 'rotate(' + needle + 'deg)');
			});	
    }
    
    function _setSecondaryValue(value) {
      
    }
    
		function _setRoll(roll){
			placeholder.each(function(){
				$(this).find('div.instrument.attitude div.roll').css('transform', 'rotate('+roll+'deg)');
			});
		}

		function _setPitch(pitch){
			// alert(pitch);
			if(pitch>constants.pitch_bound){pitch = constants.pitch_bound;}
			else if(pitch<-constants.pitch_bound){pitch = -constants.pitch_bound;}
			placeholder.each(function(){
				$(this).find('div.instrument.attitude div.roll div.pitch').css('top', pitch*0.7 + '%');
			});
		}

		function _setHeading(heading){
			placeholder.each(function(){
				$(this).find('div.instrument.heading div.heading').css('transform', 'rotate(' + -heading + 'deg)');
			});	
		}

		function _setTurn(turn){
			placeholder.each(function(){
				$(this).find('div.instrument.turn_coordinator div.turn').css('transform', 'rotate('+(turn*6.67)+'deg)');
        $(this).find('div.instrument.turn_coordinator div.turn_needle').css('transform', 'rotate('+((turn*6.67)+90)+'deg)');
			});
		}
    
    function _setSkid(skid){
			placeholder.each(function(){
				$(this).find('div.instrument.turn_coordinator div.skid').css('transform', 'rotate('+(-skid)+'deg)');
			});
		}

		function _setVario(vario){
			if(vario > constants.vario_bound){vario = constants.vario_bound;}
			else if(vario < -constants.vario_bound){vario = -constants.vario_bound;}
			vario = vario*90;
			placeholder.each(function(){
				$(this).find('div.instrument.vario div.vario').css('transform', 'rotate(' + vario + 'deg)');
			});	
		}

		function _setAirSpeed(speed){
			if(speed > constants.airspeed_bound_h){speed = constants.airspeed_bound_h;}
			else if(speed < constants.airspeed_bound_l){speed = constants.airspeed_bound_l;}
			speed = 90+speed*2;
			placeholder.each(function(){
				$(this).find('div.instrument.airspeed div.speed').css('transform', 'rotate(' + speed + 'deg)');
			});	
		}

		function _setAltitude(altitude){
			var needle = 90 + altitude%1000 * 360 / 1000;
			var needleSmall = altitude / 10000 * 360;
			placeholder.each(function(){
				$(this).find('div.instrument.altimeter div.needle').css('transform', 'rotate(' + needle + 'deg)');
				$(this).find('div.instrument.altimeter div.needleSmall').css('transform', 'rotate(' + needleSmall + 'deg)');
			});	
		}

		function _setPressure(pressure){
			pressure = 2*pressure - 1980;
			placeholder.each(function(){
				$(this).find('div.instrument.altimeter div.pressure').css('transform', 'rotate(' + pressure + 'deg)');
			});	
		}

		function _resize(size){
			placeholder.each(function(){
				$(this).find('div.instrument').css({height : size, width : size});
			});
		}

		function _showBox(){
			placeholder.each(function(){
				$(this).find('img.box.background').show();
			});
		}

		function _hideBox(){
			placeholder.each(function(){
				$(this).find('img.box.background').hide();
			});
		}

		// Public methods
    this.setValue = function(value){_setValue(value);}
    this.setSecondaryValue = function(value){_setSecondaryValue(value);}
		this.setRoll = function(roll){_setRoll(roll);}
		this.setPitch = function(pitch){_setPitch(pitch);}
		this.setHeading = function(heading){_setHeading(heading);}
		this.setTurn = function(turn){_setTurn(turn);}
    this.setSkid = function(skid){_setSkid(skid);}
		this.setVario = function(vario){_setVario(vario);}
		this.setAirSpeed = function(speed){_setAirSpeed(speed);}
		this.setAltitude = function(altitude){_setAltitude(altitude);}
		this.setPressure = function(pressure){_setPressure(pressure);}
		this.resize = function(size){_resize(size);}
		this.showBox = function(){_showBox();}
		this.hideBox = function(){_hideBox();}

		return attitude;
	};

	// Extension to jQuery
	$.flightIndicator = function(placeholder, type, options){
		var flightIndicator = new FlightIndicator($(placeholder), type, options)
		return flightIndicator;
	}

	$.fn.flightIndicator = function(data, type, options){
		return this.each(function(){
			$.flightIndicator(this, type, options);
		});
	}
}( jQuery ));
