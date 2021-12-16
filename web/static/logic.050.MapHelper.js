// create layergroup to store each dataset's choropleth
var layerGroup = new L.LayerGroup();
class MapHelper {
	/**
	 * 
	 * @param {string} incomingGeoJSON String representation of the geoJSON, with the feature to be added.
	 * @param {Object.<string, string>} style A dictionary with `color`, `opacity`, `weight`, `dashArray`, etc.
	 */
	
	static processAddedPostalArea(incomingGeoJSON, style) {
		var this_id = "POA" + incomingGeoJSON["properties"]["POA_CODE16"];

		var settings = {
			// add data for pop-up for each postcode
			onEachFeature: function(feature, layer) {
				var preparedString = "";
				if (feature.properties && feature.properties["POA_CODE16"]) {
                    preparedString += "<strong>Postcode: " + feature.properties["POA_CODE16"] + "</strong>";
				}

				if (feature.properties && feature.properties["NESPEAKER"]) {
                    preparedString += "<p>Non-english Speakers: " + feature.properties["NESPEAKER"] + "</p>";
				}

				if (feature.properties && feature.properties["NESPEAKERPERCENTAGE"]) {
                    preparedString += "<p>Non-english Speakers / Postcode Population: " + feature.properties["NESPEAKERPERCENTAGE"] + "%" + "</p>";
				}

				if (feature.properties && feature.properties["POSTCODESUBURB"]) {
                    preparedString += "<p>Suburb/s: " + feature.properties["POSTCODESUBURB"] + "</p>";
				}

				if (preparedString.length > 0) {
					layer.bindPopup(preparedString);
				}
		
				// // https://stackoverflow.com/questions/14756420/emulate-click-on-leaflet-map-item
				if (feature.properties && feature.properties["POA_CODE16"]) {
					globalFeatureIDTracker[this_id] = layer._leaflet_id;

				}
			}
		}

		if (style) {
			settings.style = style;
		}
		// create new feature for map
		var addedFeature = L.geoJSON(incomingGeoJSON, settings);
		// add new feature to map layer
		layerGroup.addLayer(addedFeature).addTo(globalMapObject);

		// add feature data for postcode  
		globalFeatureIDTracker[this_id] = {
			"leaflet_id": Object.keys(addedFeature["_layers"])[0],
			"captured_geojson_object": addedFeature
		};
	}

	/**
	 * Simulates a mouse click on a place on the map.
	 * 
	 * @param {Object} selectedPlace The logical ID of the place on the map.
	 */
	static simulateMouseClick(selectedPlace) {
		var leafletID = globalFeatureIDTracker[selectedPlace]["leaflet_id"];
		var capturedGeoJSONObject = globalFeatureIDTracker[selectedPlace]["captured_geojson_object"];
		var layer = capturedGeoJSONObject.getLayer(leafletID);
		
		// https://stackoverflow.com/questions/14756420/emulate-click-on-leaflet-map-item
		// fire event 'click' on target layer 
		layer.fireEvent('click');
	}

	// changeCSVFile call this to clear map
	static clearLayerGroup() {
		layerGroup.clearLayers();
	}
}