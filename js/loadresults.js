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
	        	displayError("Invalidly formatted data in: " + path)
	        	return;
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
 * Class for "graphics cards" used in benchmarking
 * @param name {String} the name of the card
 */
function Card(name) {
	var pairs = []; // Array of DataPair instances
	
	/**
	 * Returns the name of the card
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
		    sum += parseFloat(values[i]);
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


function MultiCard(name, machine, values) {
	var split = name.split("&");
	var cards = [];
	var mappedValues = values.map(function(valueString){
		var temp = valueString.split("&");
		
		if(temp.length != split.length) {
			displayError("The number of cards and the number of values in a segment is not equal.");
		}

		return temp;
	});
	
	for(var i = 0; i < split.length; i++){
		var card = new Card(split[i]);
		card.pushPair(machine, mappedValues.map(function(valueArray){
			var float = parseFloat(valueArray[i]);
			if(isNaN(float)){
        		displayError("Non-numeric value(s) in multicard: " + split);
        		return;
        	}
			return float;
		}));
		cards.push(card);
	}
	
	this.getName = function() {
		return name.replace("&", " & ");
	};
	
	this.getMachine = function() {
		return machine;
	}
	
	this.getCards = function() {
		return cards;
	}
	
	this.getCardCount = function() {
		return cards.length;
	}
	
	this.getPairs = function() {
		// All cards have the same 
		return cards[0].getPairs();
	};
	
	/**
	 * Debug function
	 */
	this.print = function(){
		console.log("-----------------");
		console.log("Multicard: " + this.getName());
		for(var i = 0; i < cards.length; i++){
			cards[i].print();
		}
		console.log("-----------------");
	};
}


function DataHandler() {
	
	var cards = []; // Array of graphics cards
	var multiCards = []; // Array of card combinations
	
	/**
	 * Push values into a machine
	 * @param name {String} The name of the machine
	 * @param machine {String} The name of the machine
	 * @param values {Array} The measurement values
	 */
	this.pushValues = function(name, machine, values){
		
		// Check multi-gpu
		if(name.indexOf("&") > -1){
			multiCards.push(new MultiCard(name, machine, values));
			return;
		}

		// Check that values are all numerical and parse them to floats
		for(var i = 0; i < values.length; i++){
			var float = parseFloat(values[i]);
			if(isNaN(float)){
        		displayError("Non-numeric value(s) in: " + path);
        		return;
        	}
			values[i] = float;
		}
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
		
		createSelectionMulti(multiCards);
		createGraphsMulti(multiCards);
		
		$(".select-block").click(function(){
			// Toggle selection block transparency
			$(this).toggleClass("inactive");
			
			// Show/Hide the graph
			$("#" + jQueryString($(this).data("graph"))).toggleClass("hidden");
		});
	};
	
	function createSelectionMulti(multiCards) {
		var name = multiCards[0].getName();
		
		// Create the selection area
		var area = document.createElement("div");
		$(area).addClass("select-area");
		
		// Create the area title and append it to area
		var areaTitle = document.createElement("p");
		var text = document.createTextNode(name);
		areaTitle.appendChild(text);
		$(areaTitle).addClass("center-text");
		$(area).append(areaTitle);
		
		for(var i = 0; i < multiCards.length; i++){
			var multiCard = multiCards[i];
			// Initialize block
			var block = document.createElement("div");
			$(block).addClass("select-block"); // Start the blocks as inactive?
			$(block).data("graph", withoutSpaces(name) + "-" + multiCard.getMachine());
			
			// Initialize text paragraph
			var blockText = document.createElement("p");
			var t = document.createTextNode(multiCard.getMachine());
			blockText.appendChild(t);
			$(blockText).addClass("center-text");
			
			$(block).append(blockText);
			$(area).append(block);
		}
		
		$("#select-multi").append(area);
	}
	
	function createGraphsMulti(multiCards) {
		var graphHeight = 200;
		var cardsName = multiCards[0].getName();
		
		var rowTitle = document.createElement("h3");
		var titleText = document.createTextNode(cardsName);
		rowTitle.appendChild(titleText);
		$(rowTitle).addClass("center-text");
		$("#content-multi").append(rowTitle);
		
		var row = document.createElement("div");
		$(row).addClass("row");
		
		for(var i = 0; i < multiCards.length; i++){
			var multiCard = multiCards[i];
			var graphWidth = 120.0 / multiCard.getCardCount();
			var maxValue = getMaxOfArray(multiCard.getPairs().map(function(p){
				return p.getAverage();
			}));
			var machineName = multiCard.getMachine();
			var areaId = withoutSpaces(cardsName) + "-" + machineName;
			
			
			var graphsArea = document.createElement("div");
			$(graphsArea).height(graphHeight + "px");
			$(graphsArea).addClass("graph-area");
			$(graphsArea).attr("id", areaId); // Add id for the selection onclick show/hide effect
			
			var cards = multiCard.getCards();			
			for(var j = 0; j < cards.length; j++){
				var average = cards[j].getPairs()[0].getAverage();
				
				// Create graph
				var graph = document.createElement("div");
				var gHeight = 0.9 * graphHeight * average / maxValue; // 0.9 coefficient to limit max-height
				$(graph).height(gHeight + "px");
				$(graph).width(graphWidth + "px");
				$(graph).addClass("graph");
				$(graph).css("margin-left", (graphWidth * j) + "px");
				
				// Initialize the element containing the average value
				var valueTitle = document.createElement("h4");
				var valueText = document.createTextNode(Math.round(average * 100) / 100); // Convert average score to a 2-decimal float
				valueTitle.appendChild(valueText);
				$(valueTitle).addClass("center-text graph-value");
				$(graph).append(valueTitle);
				
				$(graphsArea).append(graph);
			}
			var machineTitle = document.createElement("h4");
			var machineText = document.createTextNode(machineName);
			machineTitle.appendChild(machineText);
			$(machineTitle).addClass("center-text graph-title");
			$(graphsArea).append(machineTitle);
			$(row).append(graphsArea);
		}
		$("#content-multi").append(row);
	}
	
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
		var graphWidth = 120;
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
			var gHeight = 0.9 * graphHeight * average / maxValue; // 0.9 coefficient to limit max-height
			$(graph).height(gHeight + "px");
			$(graph).width(graphWidth + "px");
			$(graph).addClass("graph");
			
			// Initialize the element containing the average value
			var valueTitle = document.createElement("h4");
			var valueText = document.createTextNode(Math.round(average * 100) / 100); // Convert average score to a 2-decimal float
			valueTitle.appendChild(valueText);
			$(valueTitle).addClass("center-text graph-value");

			// Initialize the element containing the machine name
			var machineTitle = document.createElement("h4");
			var machineText = document.createTextNode(machineName);
			machineTitle.appendChild(machineText);
			$(machineTitle).addClass("center-text graph-title")

			$(graph).append(valueTitle);
			$(graphsArea).append(machineTitle);
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
		for(var i = 0; i < multiCards.length; i++){
			multiCards[i].print();
		}
	};
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
 * 
 * @param numArray
 * @returns the maximum value of the given array
 */
function getMaxOfArray(numArray) {
	return Math.max.apply(null, numArray);
}

function withoutSpaces(str) {
	return str.replace(/\s+/g, '');
}

function jQueryString(str) {
	return str.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&");
}