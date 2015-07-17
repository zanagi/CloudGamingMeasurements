$(window).ready(function(){
	
	function loadInstruction(name) {
		var path = "instructions/" + name + ".txt";

		$.get(path, function(data) {
			parse(data);
		}, "json").fail(function(a, b, c) {
			displayError("Invalid file: " + path);
		});
	}
	
	function parse(data){
		
	}
});
