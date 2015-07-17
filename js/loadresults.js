$(window).ready(function(){
	loadResults("test");
	
	/**
	 * Loads the measurements with the given name and stores them to be displayed on the HTML page
	 * @param name {string} Name of the required benchmark tool, i.e heaven/valley/glmark2
	 */
	function loadResults(name) {
		var path = "measurements/" + name + ".txt";
		
		$.get(path, function(data){
			parse(data);
		}, "json")
		.fail(function(a, b, c){
			displayError("Invalid file: " + path);
		});
	}

	/**
	 * Parses measurement data into usable class objects
	 * @param data {Object} The JSON representation of the measurement data
	 */
	function parse(data) {
		for (var property in data) {
		    if (data.hasOwnProperty(property)) {
		        console.log(property); // Quadro K2000 etc
		        console.log(data[property]); // Value 345
		    }
		}
		
		// Debug
		// console.log(data);
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
	 * Class for graphics cards used in benchmarking
	 * @param name {String} Name of the graphics card
	 */
	function Card(name) {
		
		this.getName = function(){
			return name;
		};
	}

	/**
	 * Class for "graphics card"-"benchmark score" pairs
	 * @param card {Card} The Card class instance
	 * @param value {Number} The benchmark score value
	 */
	function DataPair(card, value) {
		
		this.hasCard = function(name) {
			return (card.getName === name)
		};
		
		this.getValue = function(){
			return value;
		}
	}

	function DataHandler() {
		
		// Array of DataPair objects
		var pairs = [];
		
		this.getValue = function(name) {
			for(var pair in pairs){
				if(pair.hasCard(name)){
					return pair.getValue();
				}
			}
			
			// TODO: throw exception?
			return null;
		};
		
		this.constructInterface = function(){
			// TODO: Create DOM objects to display data
		};
	}
});

