class ChangeCSVFile {
	// disaply census data depending on which drop-down menu is picked
    static selectionDidChange() {
		var selectedPlace = $("#changeData").val();

		if (selectedPlace == "total 2016") {
			changeCensusData(2);;
		}
		if (selectedPlace == "15-24") {
			changeCensusData(3);
		}
		if (selectedPlace == "35-44") {
			changeCensusData(4);
		}
		if (selectedPlace == "65-74") {
			changeCensusData(5);
		}
		if (selectedPlace == "total 2011") {
			changeCensusData(7);
		}
	}
}

function changeCensusData(column) {
	var x = 1;
	// Non-english speakers variables
	var globalNonEnglishSpeakerDictionary = {};
	var minNonEnglishSpeakers;
	var maxNonEnglishSpeakers;

	// Colours
	var weakEndRGB = {red: 173, green: 216, blue: 230}; 
	var midwayRGB = {red: 2, green: 136, blue: 209};  
	var strongEndRGB = {red: 25, green: 25, blue: 112};

	// get the csv file with all postcode data
	$.get("non-english speakers/language_data_2016.csv", function(nESpeakerCSVString) {
		var nESpeakerArray = Papa.parse(nESpeakerCSVString);
		

		for (var i = 1; i < nESpeakerArray.data.length; i++) {
			// generate dictionary
			var thisPostcode = nESpeakerArray.data[i][1];
			var thisPostcodeNonEnglishSpeakers = parseInt(nESpeakerArray.data[i][column]);
			var thisPostcodeTotalPopulation = (parseFloat(nESpeakerArray.data[i][column])/parseFloat(nESpeakerArray.data[i][6])*100).toFixed(2);
			var thisPostcodeSuburb = nESpeakerArray.data[i][8]
			globalNonEnglishSpeakerDictionary[thisPostcode] = [thisPostcodeNonEnglishSpeakers,thisPostcodeTotalPopulation, thisPostcodeSuburb];

			// update min and max	
			if (thisPostcodeNonEnglishSpeakers != 0) {
				if (!minNonEnglishSpeakers) minNonEnglishSpeakers = thisPostcodeNonEnglishSpeakers;
				if (!maxNonEnglishSpeakers) maxNonEnglishSpeakers = thisPostcodeNonEnglishSpeakers;
				if (thisPostcodeNonEnglishSpeakers < minNonEnglishSpeakers) minNonEnglishSpeakers = thisPostcodeNonEnglishSpeakers;
				if (thisPostcodeNonEnglishSpeakers > maxNonEnglishSpeakers) maxNonEnglishSpeakers = thisPostcodeNonEnglishSpeakers;
			}
		}
		// get the geojson file for sydney postcodes 
		$.getJSON('postcodes-geojson/au-postcodes-Visvalingam-0.1.geojson', function(incomingGeoJSON) {
			// loop through each feature of the geojson file
			incomingGeoJSON["features"].forEach(function(item, index) {
				// get only postcodes between 2000 & 2200
				if (
					parseInt(item["properties"]["POA_CODE16"]) >= "2000"
					&& parseInt(item["properties"]["POA_CODE16"]) < "2200"
				) {
					// get postcode from geojson file
					var thisId = "POA" + item["properties"]["POA_CODE16"];
					// get postcode's data using globalNonEnglishSpeakerDictionary
					var thisNonEnglishSpeakers = globalNonEnglishSpeakerDictionary[thisId][0];
					var thisNonEnglishSpeakerPercentage = globalNonEnglishSpeakerDictionary[thisId][1];
					var thisPostcodeSuburb = globalNonEnglishSpeakerDictionary[thisId][2];
					// use colour helper 
					var thisEnglishSpeakerRelativePosition = ColourHelper.valueToPercentile(
						minNonEnglishSpeakers
						, maxNonEnglishSpeakers
						, thisNonEnglishSpeakers
					);
					// add postcode's data to geojson file
					item["properties"]["NESPEAKER"] = thisNonEnglishSpeakers;
					item["properties"]["NESPEAKERPERCENTAGE"] = thisNonEnglishSpeakerPercentage;
					item["properties"]["POSTCODESUBURB"] = thisPostcodeSuburb;

					// create style for choropleth  
					var thisStyle = {
						"color": ColourHelper.colourGradientHTMLString3(
							weakEndRGB, midwayRGB, strongEndRGB, thisEnglishSpeakerRelativePosition
						)
					};

					// for first postcode being added, use MapHelper function to clear map
					if (x == 1) {
						MapHelper.clearLayerGroup();
					}
					// add postcode to map
					MapHelper.processAddedPostalArea(item, thisStyle);
					x++;
				}
			});
		});
	});
}