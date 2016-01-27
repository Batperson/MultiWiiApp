/* 
* jQuery Flight Indicators plugin
* By Sébastien Matton (seb_matton@hotmail.com)
* Published under GPLv3 License.
* 
* https://github.com/sebmatton/jQuery-Flight-Indicators
*/
(function($) {
	function LED( placeholder, options) {
    var settings = $.extend({
      colour: 'red',
      state : 'off',
    }, options);
    
    var colour = settings.colour;
    var state  = settings.state;

		// Creation of the instrument
		placeholder.each(function(){
        var cls = 'led-indicator led-indicator-' + colour;
        if(state === 'on')
          cls += ' led-indicator-' + colour + '-on';
        
        $(this).html('<span class="' + cls + '">' + placeholder.text() + '</span>');
    });

		// Public methods
		this.on = function() {
      this.activate(true);
    };
    
    this.off = function() {
      this.activate(false);
    };
    
    this.activate = function(on) {
      
    };

		return this;
	};

	// Extension to jQuery
	$.led = function(placeholder, options){
		var led = new LED($(placeholder), options);
		return led;
	}

	$.fn.led = function(data, options){
		return this.each(function(){
			$.led(this, options);
		});
	}
}( jQuery ));
