// keep track of Leaflet map for use between functions
var globalMapObject;


// keep track of which map tiles have been selected
var globalCurrentTilesSelection;
var globalCurrentTiles;

// keep track of items added
var globalFeatureIDTracker = {};

// Non-english speakers variables
var globalNonEnglishSpeakerDictionary = {};
var minNonEnglishSpeakers;
var maxNonEnglishSpeakers;

// Colours
var weakEndRGB = {red: 173, green: 216, blue: 230}; 
var midwayRGB = {red: 2, green: 136, blue: 209};  
var strongEndRGB = {red: 25, green: 25, blue: 112};

function bodyDidLoad() {
	ShowtimeHelper.setDarkModeAccordingToBrowser();
	ShowtimeHelper.initialiseSelect2();
		
	// OK - Ready to Initialise the map! :)
	globalMapObject = L.map('mapid').setView([-33.868820, 151.209290], 11);
	globalCurrentTiles.addTo(globalMapObject);

	// get the csv file with all postcode data
	$.get("non-english speakers/language_data_2016.csv", function(nESpeakerCSVString) {
		var nESpeakerArray = Papa.parse(nESpeakerCSVString);
		

		for (var i = 1; i < nESpeakerArray.data.length; i++) {
			// generate dictionary
			var thisPostcode = nESpeakerArray.data[i][1];
			var thisPostcodeNonEnglishSpeakers = parseInt(nESpeakerArray.data[i][2]);
			var thisPostcodeTotalPopulation = (parseFloat(nESpeakerArray.data[i][2])/parseFloat(nESpeakerArray.data[i][6])*100).toFixed(2);
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

					// Add postcode to search
					NavbarHelper.addItemToSelector(thisId);

					// add postcode to map
					MapHelper.processAddedPostalArea(item, thisStyle);
				}
			});
		});
	});
}