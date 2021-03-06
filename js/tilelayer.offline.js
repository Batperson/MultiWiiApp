/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
L.TileLayer.Offline = L.TileLayer.Functional.extend({
    initialize: function(url, options) {
        var tileFunction = function(url, view) {
            var deferred = $.Deferred();
            var ObjectUrl = L.Util.template(url, { z: view.zoom, y:  view.tile.row, x: view.tile.column, s: view.subdomain }); 

            lzTiles.get(ObjectUrl, 'TileLayer', function(data) {                
                if (data && typeof data.image === "object") {       
                    console.log('Using offline tile: ' + ObjectUrl);                
                    deferred.resolve(URL.createObjectURL(data.image));
                }
                else if(data && typeof data.image === "string") {
                    console.log('Using offline tile: ' + ObjectUrl);
                    deferred.resolve(data.image);
                }
                else {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', ObjectUrl, true);
                    xhr.responseType = 'blob';
                    xhr.onload = function(e) {
                      deferred.resolve(window.URL.createObjectURL(this.response));
                    };
                    xhr.send();
                }
            });
            return deferred.promise();
        }
        this._tileFunction = tileFunction;
        L.TileLayer.prototype.initialize.call(this, url, options);
    },
    getTileUrl: function(tilePoint) {
        var map = this._map,
                crs = map.options.crs,
                tileSize = this.options.tileSize,
                zoom = tilePoint.z,
                nwPoint = tilePoint.multiplyBy(tileSize),
                sePoint = nwPoint.add(new L.Point(tileSize, tileSize)),
                nw = crs.project(map.unproject(nwPoint, zoom)),
                se = crs.project(map.unproject(sePoint, zoom)),
                bbox = [nw.x, se.y, se.x, nw.y].join(',');

        // Setup object to send to tile function.
        var view = {
            bbox: bbox,
            width: tileSize,
            height: tileSize,
            zoom: zoom,
            tile: {
                row: this.options.tms ? this._tileNumBounds.max.y - tilePoint.y : tilePoint.y,
                column: tilePoint.x
            },
            subdomain: this._getSubdomain(tilePoint)
        };

        return this._tileFunction(this._url, view);
    }

});

L.tileLayer.offline = function(url, options) {
    return new L.TileLayer.Offline(url, options);
};

