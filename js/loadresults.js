/**
 * Loads the measurements with the given name and stores them to be displayed on the HTML page
 * @param name {string} Name of the required benchmark tool, i.e heaven/valley/glmark2
 */
function loadResults(name) {
	var rawFile = new XMLHttpRequest();
    rawFile.open("GET", "measurements/" + name + ".txt", false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var text = rawFile.responseText;
            }
        }
    }
    rawFile.send(null);
}

/**
 * 
 * @param file {File} The text file that should be parsed
 */
function parse(file) {
	
}

/**
 * Displays an error on the HTML page
 * @param msg {string} The message to be displayed to the user
 */
function displayError(msg) {
	console.log("Error! " + msg);
	
	// TODO: Popup window or DOM element change to display error
}