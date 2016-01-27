'use strict';

angular.module('navigationModule', ['pollModule', 'settingsModule'])
  .controller('navigationController', ['coms', 'msp', 'poll', 'settings', '$window', '$document', '$interval', '$scope', 'leafletData', function(coms, msp, poll, settings, $window, $document, $interval, $scope, lfd) {
    $scope.centre = {
      lat:   0,
	    lng:   0,
	    zoom:  14
    };
    $scope.defaults = {
      scrollWheelZoom : true,
      maxZoom: 22
    };
    $scope.markers = { };
    $scope.tilesDownloaded    = 0;
    $scope.tilesToDownload    = 0;
   
    $scope.vehicle = {
      lat: 0,
      lng: 0,
      opacity: 1,
      iconAngle: 0,
      title: 'Air Vehicle',
      layer: 'vehicle',
      clickable: false,
      icon: {
        iconUrl: 'images/plane-24.png',
        iconAnchor:   [12, 12],
        iconSize:     [24, 24],
      }
    };
    
    $scope.home = {
      lat: 0,
      lng: 0,
      opacity: 0.9,
      layer: 'home',
      title: 'RTH Point',
      clickable: false,
      icon: {
        iconUrl: 'images/home-16.png',
        iconSize:  [16, 16],
        iconAnchor: [8, 15]
      }
    }; 
    
    $scope.baseStation = {
      lat: 0,
      lng: 0,
      opacity: 0.9,
      layer: 'baseStation',
      title: 'Base station location',
      clickable: false,
      icon: {
        iconUrl: 'images/base-24.png',
        iconSize:  [24, 24],
        iconAnchor: [12, 23]
      }
    }; 
    
    $scope.paths = {
      navTrail: {
        type: 'polyline',
        color: 'orange',
        weight: 2,
        layer: 'navTrail',
        clickable: false,
        latlngs: []
      },
      waypoints: {
        type: 'polyline',
        color: 'yellow',
        weight: 2,
        layer: 'waypoints',
        clickable: false,
        latlngs: []
      }
    };
    
    $scope.layers = {
      baselayers: { 
        googleHybrid: {
          name: 'Google Sat Hybrid',
          type: 'offline',
          url: 'http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
          layerOptions: {
            attribution: '<a href="http://maps.google.com" target="_blank">Google</a>',
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            continuousWord: true,
            maxZoom: 22,
            maxNativeZoom: 21
          }
        }, 
        googleTerrain: {
          name: 'Google Terrain',
          type: 'offline',
          url: 'http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          layerOptions: {
            attribution: '<a href="http://maps.google.com" target="_blank">Google</a>',
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            continuousWord: true,
            maxZoom: 22,
            maxNativeZoom: 22
          }
        }, 
        mapbox: {
          name: 'Mapbox',
          type: 'offline',
          url: 'https://{s}.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoia29uZ2ppZSIsImEiOiJjaWZzdHB1NDEwNW0xdW5seXVtZ3BuczQwIn0.HQBg4a6583nxaaZTVJo3tA',
          layerOptions: {
            attribution: '<a href="http://www.mapbox.com" target="_blank">Mapbox</a>',
            subdomains: 'abc',
            continuousWorld: true,
            maxNativeZoom: 17,
            maxZoom: 22
          }
        },
        openstreetmap: {
          name: 'OpenStreetMap',
		      type: 'offline',
		      url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		      layerOptions: {
            attribution: '<a href="http://www.openstreetmap.org" target="_blank">OpenStreetMap</a>',
			      subdomains: 'abc',
            continuousWorld: true,
            maxNativeZoom: 18,
            maxZoom: 22
          }
        } 
      },
      overlays: {
        vehicle: {
          name: 'Air Vehicle',
          type: 'group',
          visible: true
        },
        baseStation: {
          name: 'Base station',
          type: 'group',
          visible: true
        },
        navTrail: {
          name: 'Navigation trail',
          type: 'group',
          visible: true
        },
        waypoints: {
          name: 'Waypoints',
          type: 'group',
          visible: true
        },
        home: {
          name: 'RTH Point',
          type: 'group',
          visible: true
        }
      }
    };
    
    $scope.controls = {
      draw: {
        draw: {
          polygon: false,
          rectangle: false,
          marker: false,
          circle: false
        }
      },
      scale: true
    };
    
    $scope.waypoints = [];
    
    var downloadMissionSteps = function() {
      var wp = [
        {
          cmd : MSP.WP,
          missionStepNumber: 1,
          missionStepAction: 'waypoint',
          latitude: -36.867836642533945,
          longitude: 174.7748048789799,
          altitude: 10,
          param1: 0,
          param2: 0,
          param3: 0,
          flags: []
        },
        {
          cmd : MSP.WP,
          missionStepNumber: 2,
          missionStepAction: 'waypoint',
          latitude: -36.867055558204825,
          longitude: 174.77459030225873,
          altitude: 10,
          param1: 0,
          param2: 0,
          param3: 0,
          flags: []
        },
        {
          cmd : MSP.WP,
          missionStepNumber: 3,
          missionStepAction: 'set_poi',
          latitude: -36.86636888406695,
          longitude: 174.77663321760297,
          altitude: 10,
          param1: 0,
          param2: 0,
          param3: 0,
          flags: []
        },
        {
          cmd : MSP.WP,
          missionStepNumber: 4,
          missionStepAction: 'hold_time',
          latitude: -36.865759455600504,
          longitude: 174.77479415014386,
          altitude: 10,
          param1: 6,
          param2: 0,
          param3: 0,
          flags: []
        },
        {
          cmd : MSP.WP,
          missionStepNumber: 5,
          missionStepAction: 'waypoint',
          latitude: -36.86553628339682,
          longitude: 174.77564172819257,
          altitude: 10,
          param1: 0,
          param2: 0,
          param3: 0,
          flags: []
        },
        {
          cmd : MSP.WP,
          missionStepNumber: 6,
          missionStepAction: 'waypoint',
          latitude: -36.86554486695517,
          longitude: 174.77739052847028,
          altitude: 10,
          param1: 0,
          param2: 0,
          param3: 0,
          flags: []
        },
        {
          cmd : MSP.WP,
          missionStepNumber: 7,
          missionStepAction: 'waypoint',
          latitude: -36.86644613521556,
          longitude: 174.7780986316502,
          altitude: 10,
          param1: 0,
          param2: 0,
          param3: 0,
          flags: []
        },
        {
          cmd : MSP.WP,
          missionStepNumber: 8,
          missionStepAction: 'waypoint',
          latitude: -36.86771647623384,
          longitude: 174.77874236181378,
          altitude: 10,
          param1: 0,
          param2: 0,
          param3: 0,
          flags: []
        },
        {
          cmd : MSP.WP,
          missionStepNumber: 9,
          missionStepAction: 'waypoint',
          latitude: -36.86867780134255,
          longitude: 174.77700429037213,
          altitude: 10,
          param1: 0,
          param2: 0,
          param3: 0,
          flags: []
        },
        {
          cmd : MSP.WP,
          missionStepNumber: 10,
          missionStepAction: 'rth',
          latitude: -36.86830013934959,
          longitude: 174.7753949649632,
          altitude: 10,
          param1: 0,
          param2: 0,
          param3: 0,
          flags: ['land']
        }
      ];
      
      $scope.waypoints = wp;
    };
    
    L.drawLocal.draw.toolbar.buttons.polyline = 'Draw waypoints';
    L.drawLocal.draw.handlers.polyline.tooltip.start = 'Click to place the first waypoint.';
    L.drawLocal.draw.handlers.polyline.tooltip.cont = 'Click to place the next waypoint.';
    L.drawLocal.draw.handlers.polyline.tooltip.end = 'Click last waypoint to finish the path.';
    L.drawLocal.draw.toolbar.buttons.circle = 'Set flight boundary fence';
    L.drawLocal.draw.handlers.circle.tooltip.start = 'Click and drag to set the boundary fence.';
    
    var markers   = $scope.markers;
    var ctr       = $scope.centre;
    var base      = $scope.baseStation;
    var navTrail  = $scope.paths.navTrail;
    var paths     = $scope.paths;
    var home      = $scope.home;
    
    // Map mission editing
    $scope.$watch('waypoints', function(newWP, oldWP, s) {
      $.each(markers, function(key, val) {
        if(val.layer == 'waypoints')
          delete markers[key];
      });
      
      var newLatLngs = [];
      var cont       = true;
      $.each(newWP, function(key, wp) {
        if(cont == true) {
          switch(wp.missionStepAction) {
            case 'waypoint':
            case 'hold_infinite':
            case 'hold_time':
            case 'land':
            case 'set_poi':
              markers[Number(wp.missionStepNumber)] = {
                pathIndex   : wp.missionStepAction == 'set_poi' ? undefined : newLatLngs.length,
                missionStep : wp,
                layer: 'waypoints',
                draggable: true,
                lat: wp.latitude,
                lng: wp.longitude,
                icon: {
                  type: 'div',
                  iconSize: [15,15],
                  className: 'mission-step-marker mission-step-' + wp.missionStepAction.replace('_', '-'),
                  html: wp.missionStepNumber
                }
              };
              break;
          }
          
          switch(wp.missionStepAction) {
            case 'waypoint':
            case 'hold_infinite':
            case 'hold_time':
            case 'land':
              newLatLngs.push({ lat: wp.latitude, lng: wp.longitude });
              break;
          }
          
          switch(wp.missionStepAction) {
            case 'hold_infinite':
            case 'land':
            case 'rth':
              cont = false;
              break;
          }
        }
      });
      
      paths.waypoints.latlngs = newLatLngs;
    });
    $scope.$on('leafletDirectiveMarker.drag', function(e, args) {    
      var pt = args.leafletEvent.target.getLatLng();
      paths.waypoints.latlngs[args.model.pathIndex] = pt;
      args.model.missionStep.latitude  = pt.lat;
      args.model.missionStep.longitude = pt.lng;
    });
    $scope.$on('leafletDirectiveMarker.click', function(e, args) {    
      console.log(args.modelName + ' clicked.');
    });
    
    lfd.getMap('nav-map').then(function(map) {
      L.control.savetiles({
        zoomlevels:[13,14,15,16,17,18], //optional zoomlevels to save, default current zoomlevel
      }).addTo(map);
      L.control.buttons({
        position: 'topright',
        buttons: [
        {
          title: 'Upload to flight controller',
          class: 'fcbutton uploadfc',
          onclick: function() {
            console.log('Upload clicked');
          }
        },
        {
          title: 'Download from flight controller',
          class: 'fcbutton downloadfc',
          onclick: downloadMissionSteps
        }
        ]        
      }).addTo(map);
      
      map.on('draw:created', function (e) {
        switch(e.layerType) {
          case 'polyline':
            var newSteps = [];
            $.each(e.layer.getLatLngs(), function(i, pt) {
              newSteps.push({
                cmd : MSP.WP,
                missionStepNumber: newSteps.length + 1,
                missionStepAction: 'waypoint',
                latitude: pt.lat,
                longitude: pt.lng,
                altitude: 10, // TODO: default altitude, check units
                param1: 0,
                param2: 0,
                param3: 0,
                flags: []
              });
            });
            
            $scope.waypoints = newSteps;
            break;
          case 'circle':
            paths.boundary = {
              type: 'circle',
              color: 'red',
              weight: 2,
              clickable: false,
              radius: e.layer.getRadius(),
              latlngs : e.layer.getLatLng()
            };
            break;
        }
      });

      map.on('savestart', function(e) {
        $scope.tilesDownloaded = 0;
        $scope.tilesToDownload = e._tilesforSave.length;
        $scope.$apply();
      });
      map.on('savetileend', function(e) {
        console.log('savetileend');
        $scope.tilesDownloaded++;
        $scope.$apply();
      });
      map.on('saveend', function(e) {
        $scope.tilesDownloaded = 0;
        $scope.tilesToDownload = 0;
      });
    });
    
    $('#navigation').on('nav-shown', function() {
      lfd.getMap('nav-map').then(function(map) {
        map.invalidateSize(true);
      });
    });
    
    $interval(function() {
      $window.navigator.geolocation.getCurrentPosition(function(pos) {
        base.lat = pos.coords.latitude;
        base.lng = pos.coords.longitude;
        
        if(!ctr.updated) {
          ctr.updated = true;
          ctr.lat  = pos.coords.latitude;
          ctr.lng  = pos.coords.longitude;
          ctr.zoom = 17;
        }
        
        if(!markers.baseStation)
          markers.baseStation = base;
        
      });
    }, 1000, 0, false);
    
    var vehicle = $scope.vehicle;
    var lastFix = { lat: 0, lng: 0 };
    
    var distance = function(lat1, lng1, lat2, lng2) {
      var p = 0.017453292519943295;    // Math.PI / 180
      var c = Math.cos;
      var a = 0.5 - c((lat2 - lat1) * p)/2 + 
              c(lat1 * p) * c(lat2 * p) * 
              (1 - c((lng2 - lng1) * p))/2;

      return 12742 * Math.asin(Math.sqrt(a)) * 1000; 
    };
    
    var lastFixExceeded = function(lat, lng) {
      var distance = (!lastFix.usedOnce) ? 5 : distance(lat, lng, lastFix.lat, lastFix.lng);
      if(distance > 4 && distance < 10000) {
        lastFix.usedOnce = true;
        lastFix.lat = lat;
        lastFix.lng = lng;
        
        return true;
      }
      
      return false;
    };
    //var prevPt;
    coms.addListener('msp', function(msg) {
      switch(msg.cmd) {
        case MSP.WP:
          if(msg.missionStepNumber == 0) { // RTH point
            if(msg.latitude != 0 || msg.longitude != 0) { // Only plot the icon if we have an RTH point
              home.lat     = msg.latitude;
              home.lng     = msg.longitude;
              markers.home = home;
            }
          }
          break;
        case MSP.ATTITUDE:
          vehicle.iconAngle = msg.heading;
          break;
        case MSP.RAW_GPS:
          if(msg.fix) {
            if(!markers.vehicle)
              markers.vehicle = vehicle;
            
            vehicle.lat       = msg.latitude;
            vehicle.lng       = msg.longitude;
            
            if(lastFixExceeded(msg.latitude, msg.longitude)) {
              navTrail.latlngs.push({ lat: msg.latitude, lng: msg.longitude });
            };
            
            if(!ctr.updated) {
              ctr.updated = true;
              ctr.lat  = msg.latitude;
              ctr.lng  = msg.longitude;
              ctr.zoom = 17;
            }
            
            //var d  = (prevPt) ? distance(prevPt.lat, prevPt.lng, msg.latitude, msg.longitude) : 0;
            //console.log(Date.now() + ',' + msg.latitude + ',' + msg.longitude + ',' + d);
            //prevPt = { lat: msg.latitude, lng: msg.longitude };
          }
          break;
      }
    }); 
    
    $($window).on('resize', function() {
      var height = $($window).height()-140;
      $document.find('#nav-map-container').height(height);
      $document.find('#nav-mission-steps').height(height);
    });
    $($window).trigger('resize');
  }]);