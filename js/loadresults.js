$(window).ready(function(){
	var dataHandler = new DataHandler();
	
	loadResults("heaven");
	
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
		for (var property in data) {
		    if (data.hasOwnProperty(property)) {
		        var split = property.split("/"); 			// Machine/Card, i.e Qemu/Quadro K2000
		        var values =  data[property].split("/"); 	// Values, i.e 345/346/347
		        	
		        if(split.length != 2){
		        	displayError("Machine/Card format " + property + " not valid in: " + path);
		        	return;
		        }
		        dataHandler.pushValues(split[0], split[1], values); // Machine, Card, Values
		    }
		}
		
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

	
	function Machine(name) {
		
		var pairs = []; // Array of DataPair instances
		
		this.getName = function() {
			return name;
		};
		
		this.pushPair = function(card, values) {
			pairs.push(new DataPair(card, values));
		};
		
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
	function DataPair(card, values) {
		
		this.hasCard = function(name) {
			return (card === name)
		};
		
		this.getValues = function(){
			return values;
		}
		
		this.print = function(){
			console.log(card + ": " + values);
		};
	}

	function DataHandler() {
		
		var machines = []; // Array of machines
		
		this.pushValues = function(name, card, values){
			var machineExists = false;
			
			for(var i = 0; i < machines.length; i++){
				var m = machines[i];
				if(m.getName() == name){
					// If machine already exits just push the values into it
					m.pushPair(card, values);
					machineExists = true;
					
					// Break out of loop
					break;
				}
			}
			
			// No matching machine found: create a new one
			if(!machineExists){
				var machine = new Machine(name);
				machine.pushPair(card, values);
				machines.push(machine);
			}
		};
		
		this.constructInterface = function(){
			// TODO: Create DOM objects to display data
		};
		
		/**
		 * Debug function
		 */
		this.print = function() {
			for(var i = 0; i < machines.length; i++) {
				machines[i].print();
			}
		};
	}
});

