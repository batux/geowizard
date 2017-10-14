/**
 * GeoWizard JS 1.0
 * 
 * @Developed by batux
 * 
 * @ContactPerson Batuhan Duzgun
 * @Email batuhan.duzgun@windowslive.com
 * 
 * @Copyright (c) 2017
 */

var geoWizard = (function() {

	var self = this;
	
	self.geoWizardApiFunctions = {};
	
	self.map = null;
	self.exportedGeoJson = '';
	self.maxZoomLevel = 7;
	self.minZoomLevel = 2;
	
	self.mapOptions = {
		zoom : 8,
		center : new google.maps.LatLng(40.9761726, 28.8142807),
		disableDefaultUI : true
	}
	
	self.dataStyle = {
		editable: true,
		draggable: true
	}
	
	self.StorageType = {
		'WEB_SQL': 'websql',
		'LOCAL_STORAGE': 'local_storage'
	}
	
	self.drawingProjectDb = null;
	
	self.databaseConfiguration = {
		databaseName: "drawing_project_db",
		databaseVersion: "0.1",
		databaseDescription: "Google Maps Drawing Project Database",
		drawingProjectDDLSql: "CREATE TABLE IF NOT EXISTS drawing_project (id INTEGER PRIMARY KEY ASC, project_guid TEXT, json_text TEXT)",
		drawingProjectIndexDDLSql: "CREATE TABLE IF NOT EXISTS drawing_project_index (id INTEGER PRIMARY KEY ASC, project_guid TEXT, storage_type TEXT)",
		drawingProjectDbSize: 1024 * 1024
	}
	
	self.drawingModes = [ google.maps.drawing.OverlayType.MARKER,
        					  google.maps.drawing.OverlayType.POLYGON,
        					  google.maps.drawing.OverlayType.POLYLINE,
        					  google.maps.drawing.OverlayType.RECTANGLE ];
			
	
	self.drawingManagerConfiguration = {
			drawingControl: true,
			geometryBag: [],
			drawingControlOptions: {
				position: google.maps.ControlPosition.TOP_CENTER,
				drawingModes: self.drawingModes
		    }
	}
	
	self.exportApiFunction = function(apiFunctionName, apiFunction) {
		
		if(!apiFunctionName && !apiFunction) {
			return;
		}
		
		if(typeof apiFunctionName === 'string') {
			self.geoWizardApiFunctions[apiFunctionName] = apiFunction;
		}
	}
	
	self.createRectangle = function(geometry) {
		
		var b = geometry.getBounds(),
          	p = [ b.getSouthWest(), {
						              'lat': b.getSouthWest().lat(),
						              'lng': b.getNorthEast().lng()
						            },
			      b.getNorthEast(), {
						              'lng': b.getSouthWest().lng(),
						              'lat': b.getNorthEast().lat()
						            }
	            ];
		  
		  var rectangle = new google.maps.Data.Polygon([p]);
		  
		  return rectangle;
	}
	
	self.createPolygon = function(geometry) {
		
		var polygon = new google.maps.Data.Polygon([geometry.getPath().getArray()]);
		
		return polygon;
	}
	
	self.createPolyLine = function(geometry) {
		
		var pointList = [];
		
		var geometryBoundary = geometry.getPath().b;
		
		for(var i=0; i < geometryBoundary.length; i++) {
			
			var latlngItem = geometryBoundary[i];
			pointList[i] = { 'lat': latlngItem.lat(), 'lng': latlngItem.lng() };
		}
		
		var polyLine = new google.maps.Data.LineString(pointList);
		
		return polyLine;
	}
	
	self.createPoint = function(geometry) {
		
		var point = new google.maps.Data.Point({
	        lat: geometry.position.lat(), 
	        lng: geometry.position.lng()
	    });
		
		return point;
	}
	
	self.createFeature = function(geometry) {
		
		if(!geometry) {
			return null;
		}
		
		var feauture = new google.maps.Data.Feature({
	          geometry: geometry
	    });
		
		return feauture;
	}
	
	self.drawingCallback = function(event) {
		
		var type = event.type;
		var geometry = event.overlay;
		var feauture = null;
		
		if(type == google.maps.drawing.OverlayType.RECTANGLE) {
			
			var rectangle = self.createRectangle(geometry);
			
			feauture = self.createFeature(rectangle);
		}
		else if(type == google.maps.drawing.OverlayType.POLYGON) {
			
			var polygon = self.createPolygon(geometry);
			
			feauture = self.createFeature(polygon);
		}
		else if(type == google.maps.drawing.OverlayType.MARKER) {
		
			var point = self.createPoint(geometry);
			
			feauture = self.createFeature(point);
		}
		else if(type == google.maps.drawing.OverlayType.POLYLINE) {
			
			var polyline = self.createPolyLine(geometry);
			
			feauture = self.createFeature(polyline);
		}
		
		if(feauture) {
			self.map.data.add(feauture);
		}
		
		self.drawingManagerConfiguration.geometryBag.push(geometry);
	}
	
	self.clearAllFeaturesFromDataLayer = function(map) {
		
		if(!map) {
			map = self.getMap();
		}
		
		map.data.forEach(function(feature) {
		    map.data.remove(feature);
		});
	}
	
	self.clearAllDrawingsOnMap = function(geometryBag) {
		
		if(!geometryBag && !geometryBag.length) {
			return;
		}
		
		for(var i=0; i < geometryBag.length; i++) {
			  geometryBag[i].setMap(null);
		}
	}
	
	self.checkBrowserCompabilityOfWebSql = function() {
		
		if (window.openDatabase) {
			return true;
		}
		
		return false;
	}
	
	self.openWebSqlDatabase = function() {
		
		if(self.checkBrowserCompabilityOfWebSql()) {

			self.drawingProjectDb = openDatabase(self.databaseConfiguration.databaseName, 
					   self.databaseConfiguration.databaseVersion, 
					   self.databaseConfiguration.databaseDescription, 
					   self.databaseConfiguration.drawingProjectDbSize);
		}
	}
	
	self.createTable = function(sql) {
		
		self.drawingProjectDb.transaction(function (transaction) {
			transaction.executeSql(sql);
	    });	
	}
	
	
	self.prepareDatabase = function() {
		
		self.openWebSqlDatabase();
		
		if(self.drawingProjectDb) {
			self.createTable(self.databaseConfiguration.drawingProjectDDLSql);
			self.createTable(self.databaseConfiguration.drawingProjectIndexDDLSql);
		}
	}
	
	self.insertToDatabase = function(sql, values) {
		
		self.drawingProjectDb.transaction(function (transaction) {
			transaction.executeSql(sql, values);
		});
	}
	
	self.selectFromDatabase = function(sql, values, resultCallback) {
		
		self.drawingProjectDb.transaction(function (transaction) {
			transaction.executeSql(sql, values, resultCallback, null);
		});
	}
	
	self.insertToLocalStorage = function(projectGuid, jsonText) {
		
		localStorage.setItem(projectGuid, jsonText);
	}
	
	self.createGuidPart = function() {
	    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
	}
	
	self.createGuid = function() {
		
		var guid = (self.createGuidPart() + self.createGuidPart() + "-" + self.createGuidPart() + "-4" + self.createGuidPart().substr(0,3)).toLowerCase();
		return guid;
	}

	self.setMap = function(map) {
		self.map = map;
	}
	
	self.getMap = function() {
		return self.map;
	}
	
	
	// Exported API Function
	self.useDefaultMap = function() {
		self.map = new google.maps.Map(document.getElementById('map'), self.mapOptions);
		self.bindDrawingManagerToMap(self.map);
	}
	
	// Exported API Function
	self.bindDrawingManagerToMap = function(map) {
		
		self.setMap(map);
		
		self.drawingManager = new google.maps.drawing.DrawingManager(self.drawingManagerConfiguration);
		
		self.drawingManager.setMap(self.getMap());
		
		google.maps.event.addListener(self.drawingManager, 'overlaycomplete', self.drawingCallback);
	}
	
	// Exported API Function
	self.exportGeoJsonFromDataLayer = function(exportCallback, map) {
		
		if(!map) {
			map = self.getMap();
		}
		
		map.data.toGeoJson(function(feature) {
			
		    var featureAsGeoJson = JSON.stringify(feature);
		    self.exportedGeoJson = featureAsGeoJson;
		    
		    if(exportCallback) {
		    		exportCallback.call(null, self.exportedGeoJson);
		    }
		    
		});
	}
	
	// Exported API Function
	self.importGeoJsonFromDataLayer = function(geoJsonAsText, map) {
		
		if(!map) {
			map = self.getMap();
		}

		var geometryBag = self.drawingManagerConfiguration.geometryBag;
		
		self.clearAllDrawingsOnMap(geometryBag);
		
		self.clearAllFeaturesFromDataLayer(map);
		
		var response = self.generateFeatureListFromGeoJson(geoJsonAsText);
		
	    map.data.addGeoJson(response.featureList)
	}
	
	// Exported API Function
	self.generateFeatureListFromGeoJson = function(geoJsonAsText) {
		
		if(!geoJsonAsText) {
			return;
		}
		
		var featureList = null;
		var processMessage = "Successfull!";
		
		try {
			featureList = JSON.parse(geoJsonAsText);
		} 
		catch (error) {
			processMessage = error;
			console.log(processMessage);
		}
		
		var response = {
			'featureList': featureList,
			'processMessage': processMessage 
		};
		
		return response;
	}
	
	// Exported API Function
	self.prepareDrawedGeometriesFromMap = function() {
		return self.drawingManagerConfiguration.geometryBag;
	}
	
	// Exported API Function
	self.prepareFeaturesFromDataLayer = function(featureResultCallback, map) {
		
		if(featureResultCallback) {
			
			if(!map) {
				map = self.getMap();
			}
			
			var featureList = [];
			
			map.data.forEach(function(feature) {
				featureList.push(feature);
			});
			
			featureResultCallback.call(null, featureList);
		}
	}
	
	// Exported API Function
	self.clearMapGeometries = function(map) {
		
		if(!map) {
			map = self.getMap();
		}
		
		var geometryBag = self.drawingManagerConfiguration.geometryBag;
		
		self.clearAllDrawingsOnMap(geometryBag);
		
		self.clearAllFeaturesFromDataLayer(map);
	}
	
	// Exported API Function
	self.saveDrawingProject = function(geoJsonAsText, storageType) {
		
		if(storageType == self.StorageType.WEB_SQL) {

			if(!self.drawingProjectDb) {
				self.prepareDatabase();
			}
			
			var guid = self.createGuid();
			
			self.insertToDatabase('INSERT INTO drawing_project (project_guid, json_text) VALUES (?, ?)', [guid, geoJsonAsText]);
			
			self.insertToDatabase('INSERT INTO drawing_project_index (project_guid, storage_type) VALUES (?, ?)', [guid, storageType]);
			
		}
		else if(storageType == self.StorageType.LOCAL_STORAGE) {
			
			var guid = self.createGuid();
			
			self.insertToDatabase('INSERT INTO drawing_project_index (project_guid, storage_type) VALUES (?, ?)', [guid, storageType]);
			
			self.insertToLocalStorage(guid, geoJsonAsText);
		}
	}
	
	// Exported API Function
	self.queryLastDrawingProjectFromDatabase = function(resultCallback) {
		
		var queryResultCallback = function (transaction, results) {
			
			if(resultCallback) {
				resultCallback.call(null, results.rows);
			}
		}
		
		self.selectFromDatabase('SELECT * FROM drawing_project ORDER BY id ASC LIMIT 1', [], queryResultCallback);
	}
	
	// Exported API Function
	self.queryAllDrawingProjectsFromDatabase = function(resultCallback) {
		
		var queryResultCallback = function (transaction, results) {
			
			if(resultCallback) {
				resultCallback.call(null, results.rows);
			}
		}
		
		self.selectFromDatabase('SELECT * FROM drawing_project', [], queryResultCallback);
	}
	
	
	// Exported API Function
	self.queryLocalStorageGuidsFromDatabase = function(resultCallback) {
		
		var queryResultCallback = function (transaction, results) {
			
			if(resultCallback) {
				resultCallback.call(null, results.rows);
			}
		}
		
		self.selectFromDatabase('SELECT * FROM drawing_project_index WHERE storage_type=?', [self.StorageType.LOCAL_STORAGE], queryResultCallback);
	}
	
	
	self.exportApiFunction('useDefaultMap', self.useDefaultMap);
	self.exportApiFunction('clearMapGeometries', self.clearMapGeometries);
	self.exportApiFunction('saveDrawingProject', self.saveDrawingProject);
	self.exportApiFunction('queryLastDrawingProjectFromDatabase', self.queryLastDrawingProjectFromDatabase);
	self.exportApiFunction('queryAllDrawingProjectsFromDatabase', self.queryAllDrawingProjectsFromDatabase);
	self.exportApiFunction('queryLocalStorageGuidsFromDatabase', self.queryLocalStorageGuidsFromDatabase);
	self.exportApiFunction('bindDrawingManagerToMap', self.bindDrawingManagerToMap);
	self.exportApiFunction('exportGeoJsonFromDataLayer', self.exportGeoJsonFromDataLayer);
	self.exportApiFunction('importGeoJsonFromDataLayer', self.importGeoJsonFromDataLayer);
	self.exportApiFunction('generateFeatureListFromGeoJson', self.generateFeatureListFromGeoJson);
	self.exportApiFunction('prepareDrawedGeometriesFromMap', self.prepareDrawedGeometriesFromMap);
	self.exportApiFunction('prepareFeaturesFromDataLayer', self.prepareFeaturesFromDataLayer);
	self.exportApiFunction('StorageType', self.StorageType);
	
	return geoWizardApiFunctions;
	
})();

