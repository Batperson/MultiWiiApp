//storage tables
var lzTiles = new LazyStorage('Leaflet',1,
    {'TileLayer':
        {
            'name': 'TileLayer'
        }
    }
);

/**
 * inspired by control.zoom
 * options are position (string), saveText (string) ,rmText (string), confirm (function)
 */
L.Control.SaveTiles = L.Control.extend({
    //TODO add zoom level to save
    options: {
        position: 'topleft',
        saveText: '',
        rmText: '-',
        //optional function called before saving tiles
        'confirm': null
    },
    initialize: function(options) {
        L.setOptions(this, options);
    },
    onAdd: function(map) {
        map.findActiveBaseLayer = function() {
          var layers = this._layers
          for (var layerId in layers) {
            if (this._layers.hasOwnProperty(layerId)) {
              var layer = layers[layerId]
              if (layer.getTileUrl && !layer.overlay && this.hasLayer(layer)) {
                return layer
              }
            }
          }
          throw new Error('Control doesn\'t have any active base layer!');
        }
      
        var container = L.DomUtil.create('div', 'savetiles leaflet-bar'),
                options = this.options;
        this._createButton(options.saveText, "Download offline tiles", "savetiles", container, this._saveTiles);
        this._createButton(options.rmText, "Delete offline tiles", "rmtiles", container, this._rmTiles);
        return container;
    },
    _createButton: function(html, title, className, container, fn) {
        var link = L.DomUtil.create('a', className, container);
        link.innerHTML = html;
        link.href = '#';
        link.title = title;

        L.DomEvent
                .on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
                .on(link, 'click', L.DomEvent.stop)
                .on(link, 'click', fn, this)
                .on(link, 'click', this._refocusOnMap, this);
        //TODO enable disable on layer change map

        return link;
    },
    _saveTiles: function() {
        this._tilesforSave = [];
        
        var map        = this._map;
        var _baseLayer = this._map.findActiveBaseLayer();
        var tileSize   = _baseLayer._getTileSize();
        var maxZoom    = this._map.getZoom();
        
        if(_baseLayer.options.maxZoom)
          maxZoom = _baseLayer.options.maxZoom;
        if(_baseLayer.options.maxNativeZoom)
          maxZoom = _baseLayer.options.maxNativeZoom;
        
        for(var z = this._map.getZoom(); z <= maxZoom; z++)
        {
          var latlngBounds = this._map.getBounds();
          var bounds = L.bounds(this._map.project(latlngBounds.getNorthWest(), z),this._map.project(latlngBounds.getSouthEast(), z));
          var tileBounds = L.bounds(
            bounds.min.divideBy(tileSize).floor(),
            bounds.max.divideBy(tileSize).floor());
            
          for (j = tileBounds.min.y; j <= tileBounds.max.y; j++) {
            for (i = tileBounds.min.x; i <= tileBounds.max.x; i++) {
                var tilePoint = new L.Point(i, j);
                tilePoint.z = z;
                this._tilesforSave.push(L.TileLayer.prototype.getTileUrl.call(_baseLayer, tilePoint));
            }
          }
        }
        
        var self = this;
        if(this.options.confirm) {
          var def = $.Deferred();
          this.options.confirm.call(this,def);
          def.done(function() {
            map.fire('savestart',self);
            self._loadTile(self._tilesforSave.shift());
          });
        }
        else {
          map.fire('savestart',self);
          self._loadTile(self._tilesforSave.shift());
        }
    },
    //return blob in callback
    _loadTile: function(tileUrl) {
        var map = this._map;
        
        var $this = this;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', tileUrl);
        xhr.responseType = 'blob';
        xhr.send();
        var $this = this;
        xhr.onreadystatechange = function(){
            if (this.readyState === 4 && this.status === 200){
                $this._saveTile(tileUrl,this.response);
                if($this._tilesforSave.length > 0) {
                    $this._loadTile($this._tilesforSave.shift());
                    map.fire('loadtileend');
                }
                //fire some event?
                else {
                    map.fire('loadtileend');
                    map.fire('saveend');
                }
            }
        };
    },
    _saveTile: function(tileUrl,blob) {
        var map = this._map;
        var $this = this;
        lzTiles.rm('TileLayer',{'guid':tileUrl},function(data){
            //convert blobs for webdb and old chrome!
            if(lzTiles.type == 'webDB' || (window.navigator.appVersion.indexOf('Chrome') > 0 && parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10) < 39)) {
                if(!window.FileReader) {
                    alert('Not supported browser');
                    return;
                }
                var fr = new FileReader();
                fr.onloadend = function () {
                    lzTiles.save('TileLayer',{'guid':tileUrl,'image': fr.result},function(data){ map.fire('savetileend'); });
                };
                fr.readAsDataURL(blob);
            }
            else {
                lzTiles.save('TileLayer',{'guid':tileUrl,'image': blob},function(data){ map.fire('savetileend'); });
            }
        });
    },
    onRemove: function() {

    },
    _rmTiles: function() {
        var map = this._map;
        lzTiles.clear('TileLayer',function() {
            map.fire('tilesremoved')
        });
    }
});

L.control.savetiles = function(options) {
    return new L.Control.SaveTiles(options);
};
