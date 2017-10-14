var app = (function() {
	
	var geojson = '';
	
	geoWizard.useDefaultMap();
	
	var exportFunc = function() {
		geoWizard.exportGeoJsonFromDataLayer(function(exportedGeoJson) {
			
			geojson = exportedGeoJson;
			console.log(geojson);
			
			geoWizard.saveDrawingProject(geojson, StorageType.WEB_SQL);
			geoWizard.saveDrawingProject(geojson, StorageType.LOCAL_STORAGE);
			
			alert('GeoJSON was exported!');
		});
	}
	
	var importFunc = function() {
		
		var resultCallback = function(results) {
			console.log(results);
		}
		
		
		geoWizard.queryLastDrawingProjectFromDatabase(resultCallback);
		geoWizard.queryAllDrawingProjectsFromDatabase(resultCallback);
		geoWizard.queryLocalStorageGuidsFromDatabase(resultCallback);
		
		geoWizard.importGeoJsonFromDataLayer(geojson);
		alert('GeoJSON was imported!');
	}
	
	var clearMapGeometries = function() {
		geoWizard.clearMapGeometries();
	}
	
	return {
		'exportFunc': exportFunc,
		'importFunc': importFunc,
		'clearMapGeometries': clearMapGeometries
	}
	
})();

