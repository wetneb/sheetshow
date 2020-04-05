

// Custom JSON pretty printer for diagram JSON (making lists of integers more compact)
let prettyPrintJSON = function(obj) {
	let text = JSON.stringify(obj, null, 4);
	let replacer = function(match, d1, d2) {
	    return ''+d1+' '+d2
	};
	let prettyPrint = function(json) {
	    let currentStr = json.replace(/(\[|\d,)\n *(\d)/, replacer).replace(/(\d)\n *(\])/, replacer);
	    if (currentStr !== json) {
		return prettyPrint(currentStr);
	    } else {
		return currentStr;
	    }
	}
	return prettyPrint(text);
}

module.exports = {prettyPrintJSON}
