L.Control.Buttons = L.Control.extend({
    //TODO add zoom level to save
    options: {
        position: 'topright',
    },
    initialize: function(options) {
        L.setOptions(this, options);
    },
    onAdd: function(map) {   
        var container = L.DomUtil.create('div', 'flight-controller leaflet-bar'),
                options = this.options;
                
        for (var btn of options.buttons) {
          this._createButton(btn.html, btn.title, btn.class, container, btn.onclick);
        }        
        
        return container;
    },
    _createButton: function(html, title, className, container, fn) {
        var link = L.DomUtil.create('a', className, container);
        link.href = '#';
        if(html)
          link.innerHTML = html;
        if(title)
          link.title = title;

        L.DomEvent
                .on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
                .on(link, 'click', L.DomEvent.stop)
                .on(link, 'click', fn, this)
                .on(link, 'click', this._refocusOnMap, this);
        //TODO enable disable on layer change map

        return link;
    }
});

L.control.buttons = function(options) {
    return new L.Control.Buttons(options);
};
