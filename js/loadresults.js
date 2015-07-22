/**
 * Loads the measurements with the given name and stores them to be displayed on the HTML page
 * @param name {string} Name of the required benchmark tool, i.e heaven/valley/glmark2
 */
function loadResults(name) {
	var path = "measurements/" + name + ".txt";
	
	$.get(path, function(data){
		parse(data, path);
	}, "json")
	.fail(function(a, b, c){
		displayError("Invalid file: " + path);
	});
}

/**
 * Parses measurement data into usable class objects
 * @param data {Object} The JSON representation of the measurement data
 * @param path {String} The path of the data file
 */
function parse(data, path) {
	var dataHandler = new DataHandler()
	
	for (var property in data) {
	    if (data.hasOwnProperty(property)) {
	        var split = property.split("/"); 			// Machine/Card, i.e Qemu/Quadro K2000
	        var values =  data[property].split("/"); 	// Values, i.e 345/346/347
	        
	        // Check if 1st part is formatted correctly
	        if(split.length != 2){
	        	displayError("Machine/Card format " + property + " not valid in: " + path);
	        	return;
	        }
	        
	        // Check that every value is a numeric value and convert them to floating numbers
	        for(var i = 0; i < values.length; i++){
	        	var float = parseFloat(values[i]);
	        	if(isNaN(float)){
	        		displayError("Non-numeric value(s) in: " + path);
	        		return;
	        	}
	        	values[i] = float;
	        }
	        dataHandler.pushValues(split[1], split[0], values); // Card, Machine, Values
	    }
	}
	dataHandler.constructInterface();
	
	// Debug
	// console.log(data);
	dataHandler.print();
}

/**
 * Displays an error on the HTML page
 * @param msg {string} The message to be displayed to the user
 */
function displayError(msg) {
	alert("Error! " + msg);
	
	// TODO: DOM element change to display error?
}

/**
 * Class for "machines" used in benchmarking
 * @param name {String} the name of the machine
 */
function Card(name) {
	var pairs = []; // Array of DataPair instances
	
	/**
	 * Returns the name of the machine
	 */
	this.getName = function() {
		return name;
	};
	
	/**
	 * Creates a DataPair instance form machine name and measurement values
	 * and pushes it to the pairs array
	 * @param machineName {String} name of the machine
	 * @param values {Array} array of the measurement values
	 */
	this.pushPair = function(machineName, values) {
		pairs.push(new DataPair(machineName, values));
	};
	
	/**
	 * Gets the pair with machine with given name, if not found displays an error
	 * @param machineName {String} Name of the machine
	 */
	this.getPair = function(machineName){
		for(var i = 0; i < pairs.length; i++){
			if(pairs[i].hasCard(machineName)){
				return pairs[i];
			}
		}
		displayError("No pair found for card " + cardName + " in machine " + name);
		return null;
	};
	
	/**
	 * Returns the array of DataPairs
	 */
	this.getPairs = function(){
		return pairs;
	}
	
	/**
	 * Debug function
	 */
	this.print = function() {
		console.log(name + ": ");
		for(var i = 0; i < pairs.length; i++){
			pairs[i].print();
		}
	};
}

/**
 * Class for "graphics card"-"benchmark score" pairs
 * @param machine {String} The name of the machine
 * @param values {Array} The benchmark score values
 */
function DataPair(machine, values) {
	
	this.hasMachine = function(name) {
		return (machine === name)
	};
	
	this.getValues = function(){
		return values;
	};
	
	this.getMachine = function(){
		return machine;
	};
	
	this.getAverage = function() {
		var sum = 0;
		var length = values.length;
		for(var i = 0; i < length; i++){
		    sum += parseInt(values[i], 10);
		}
		return sum / length;
	};
	
	/**
	 * Debug function
	 */
	this.print = function(){
		console.log("  - " + machine + ": " + values);
	};
}

function DataHandler() {
	
	var cards = []; // Array of graphics cards
	
	/**
	 * Push values into a machine
	 * @param name {String} The name of the machine
	 * @param machine {String} The name of the machine
	 * @param values {Array} The measurement values
	 */
	this.pushValues = function(name, machine, values){
		var cardExists = false;
		
		for(var i = 0; i < cards.length; i++){
			var card = cards[i];
			if(card.getName() == name){
				// If machine already exits just push the values into it
				card.pushPair(machine, values);
				cardExists = true;
				
				// Break out of loop
				break;
			}
		}
		
		// No matching machine found: create a new one
		if(!cardExists){
			var card = new Card(name);
			card.pushPair(machine, values);
			cards.push(card);
		}
	};
	
	/**
	 * Constructs a DOM interface from the machines array
	 */
	this.constructInterface = function(){
		for(var i = 0; i < cards.length; i++){
			var card = cards[i];
			createSelection(card);
			createGraphs(card);
		}
		
		$(".select-block").click(function(){
			// Toggle selection block transparency
			$(this).toggleClass("inactive");
			
			// Show/Hide the graph
			$("#" + $(this).data("graph")).toggleClass("hidden");
		});
	};
	
	function createSelection(card) {
		var name = card.getName();
		
		// Create the selection area
		var area = document.createElement("div");
		$(area).addClass("select-area");
		
		// Create the area title and append it to area
		var areaTitle = document.createElement("p");
		var text = document.createTextNode(name);
		areaTitle.appendChild(text);
		$(areaTitle).addClass("center-text");
		$(area).append(areaTitle);
		
		// Create the clickable blocks and append them to area
		var pairs = card.getPairs();
		for(var i = 0; i < pairs.length; i++){
			var pair = pairs[i];
			
			// Initialize block
			var block = document.createElement("div");
			$(block).addClass("select-block"); // Start the blocks as inactive?
			$(block).data("graph", withoutSpaces(name) + "-" + pair.getMachine());
			
			// Initialize text paragraph
			var blockText = document.createElement("p");
			var t = document.createTextNode(pair.getMachine());
			blockText.appendChild(t);
			$(blockText).addClass("center-text");
			
			$(block).append(blockText);
			$(area).append(block);
		}
		$("#select").append(area);
	}
	
	/**
	 * Creates a single DOM block to display results
	 * @param card {Card} the graphcis card
	 */
	function createGraphs(card) {
		var graphHeight = 200;
		var cardName = card.getName();
		var pairs = card.getPairs();
		var maxValue = getMaxOfArray(pairs.map(function(p){
			return p.getAverage();
		}));
		
		var rowTitle = document.createElement("h3");
		var titleText = document.createTextNode(cardName);
		rowTitle.appendChild(titleText);
		$(rowTitle).addClass("center-text");
		$("#content").append(rowTitle);
		
		var row = document.createElement("div");
		$(row).addClass("row");
		
		for(var i = 0; i < pairs.length; i++) {
			var pair = pairs[i];
			var machineName = pair.getMachine();
			var average = pair.getAverage();
			var areaId = withoutSpaces(cardName) + "-" + machineName;
			
			// Create the are for the graph
			var graphsArea = document.createElement("div");
			$(graphsArea).height(graphHeight + "px");
			$(graphsArea).addClass("graph-area");
			$(graphsArea).attr("id", areaId); // Add id for the selection onclick show/hide effect
			
			// Create graph
			var graph = document.createElement("div");
			var gHeight = 0.9 * graphHeight * average / maxValue; // 0.95 coefficient to limit max-height
			$(graph).height(gHeight + "px");
			$(graph).addClass("graph");
			
			// Initialize the element containing the average value
			var valueTitle = document.createElement("h4");
			var valueText = document.createTextNode(Math.floor(average)); // Convert average score to an integer
			valueTitle.appendChild(valueText);
			$(valueTitle).addClass("center-text graph-value");

			// Initialize the element containing the machine name
			var machineTitle = document.createElement("h4");
			var machineText = document.createTextNode(machineName);
			machineTitle.appendChild(machineText);
			$(machineTitle).addClass("center-text graph-title")

			$(graph).append(valueTitle);
			$(graph).append(machineTitle);
			$(graphsArea).append(graph);
			$(row).append(graphsArea);
		}
		$("#content").append(row);
	}
	
	/**
	 * Debug function
	 */
	this.print = function() {
		for(var i = 0; i < cards.length; i++) {
			cards[i].print();
		}
	};
}

function getMaxOfArray(numArray) {
	return Math.max.apply(null, numArray);
}

function withoutSpaces(str) {
	return str.replace(/\s+/g, '');
}