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
 * @param card {String} The name of the graphics card
 * @param values {Array} The benchmark score values
 */
function DataPair(machine, values) {
	
	this.hasMachine = function(name) {
		return (machine === name)
	};
	
	this.getValues = function(){
		return values;
	}
	
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
		// TODO: Create DOM objects to display data
		for(var i = 0; i < cards.length; i++){
			createSelection(cards[i]);
		}
	};
	
	function createSelection(card) {
		var name = card.getName();
		
		// Create the selection area
		var div = document.createElement("div");
		$(div).addClass("select-area");
		
		// Create the area title and append it to area
		var areaTitle = document.createElement("p");
		var text = document.createTextNode(name);
		areaTitle.appendChild(text);
		$(areaTitle).addClass("center-text");
		$(div).append(areaTitle);
		
		// Create the clickable blocks and append them to area
		var pairs = card.getPairs();
		for(var i = 0; i < pairs.length; i++){
			var block = document.createElement("div");
			$(block).addClass("select-block");
			
			$(div).append(block);
		}
		$("#select").append(div);
	}
	
	/**
	 * Creates a single DOM block to display results
	 * @param name {Card} The graphics card
	 * @param pair {DataPair} A DataPair instance to create the block from
	 */
	function createBlock(card, pair) {
		
		var div = document.createElement("div");
		
		$("#content").append(div);
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