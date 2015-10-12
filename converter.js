// ==UserScript==
// @name         RohBot Imperial to Metric
// @version      1.14
// @description  Converts imperial to metric if it finds any
// @author       Spans
// @match        https://rohbot.net
// @grant        none
// @updateURL	 https://raw.githubusercontent.com/Spanfile/RohBot-Imperial-to-Metric-Converter/master/converter.js
// ==/UserScript==

chatMgr.lineFilter.add(function (line, prepend, e) {
	line.Content = applyConversions(line.Content);
});

String.prototype.splice = function(idx, rem, s) {
	return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
};

var conversions = [
	{ name: "meters", regex: /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(ft|feet|foot)(?=\s|$)/ig, divide: 3.2808 },
	{ name: "meters", regex: /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(yd|yards|yard)(?=\s|$)/ig, divide: 1.0936 },
	{ name: "centimeters", regex: /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(in|inches|inch|&quot;)(?=\s|$)/ig, divide: 0.39370 },
	{ name: "meters", regex: /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(yd|yards|yard)(?=\s|$)/ig, divide: 1.0936 },
	{ name: "kilometers", regex: /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(miles|mi)(?=\s|$)/ig, divide: 0.62137 },
	{ name: "Celsius", regex: /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(f|fahrenheit|degrees fahrenheit)(?=\s|$)/ig, divide: 1.8, subtract: 32},
	{ name: "kilograms", regex: /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(lb|lbs|pounds|pound)(?=\s|$)/ig, divide: 2.2046 },
	{ name: "kilograms", regex: /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(st|stone)(?=\s|$)/ig, divide: 0.157473 },
	{ name: "grams", regex: /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(oz|ounces|ounce)(?=\s|$)/ig, divide: 0.035274 },
	{ name: "liters", regex: /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(gal|gallons|gallon)(?=\s|$)/ig, divide: 0.26417 },
	{ name: "KPH", regex: /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(mph|miles per hour)(?=\s|$)/ig, divide: 1/1.6093 },
	
	{ name: "meters", specialFunc: function(message) {
		// the &#39; there in the middle is for ' and &quot; is for "
		var regex = /(?:\s|^)(\d+(?:(?:\.|,)\d+)?)&#39;(\d+(?:(?:\.|,)\d+)?)?(?:&quot;)?(?=\s|$)/ig;
		var m;
		var results = [];
		while ((m = regex.exec(message)) !== null) {
			if (m.index === regex.lastIndex) {
				regex.lastIndex++;
			}

			var feet = m[1].replace(',', '.');
			var inches = 0;

			if (m[2] != null) {
				inches = m[2].replace(',', '.');
			}

			var convertedFeet = feet / 3.2808;
			var convertedInches = inches / 39.370;

			var total = Math.round((convertedFeet + convertedInches) * 100) / 100;
			results[results.length] = {original:m[0], index:m.index, conversion:total, unit:"meters"};
		}

		return results;
	}}
];

function applyConversions(message) {
	var results = [];

	// aggregate the results
	conversions.forEach(function(conversion) {
		var result = conversion.specialFunc ? conversion.specialFunc(message) : commonConversion(message, conversion.regex, conversion.divide, conversion.subtract || 0, conversion.name);
																								   
		if (result.length > 0) {
			//console.log(result);
			results[results.length] = result;
		}
	});
	
	// since the converters can return multiple conversions, flatten the results
	// the result looks like [[{stuff here}, {stuff here}], [{stuff here}, {stuff here}]]
	// flattening it turns it into [{stuff here}, {stuff here}, {stuff here}, {stuff here}]
	var flattened = [].concat.apply([], results);
	
	// sort them
	flattened.sort(function(a, b) {
		if (a.index > b.index) {
			return 1;
		}
		
		if (a.index < b.index) {
			return -1;
		}
		
		return 0;
	});

	var newMsg = message;
	var inserted = 0;
	// combine them all
	flattened.forEach(function(result) {
		var title = result.conversion.toLocaleString() + " " + result.unit;
		var original = result.original;
		var begin = "";
		
		// because the js regex engine doesn't support positive lookbehinds, the regexes return the whitespace before every match
		// most of the time they do it unless the match is at the start of the message
		// in case there is a whitespace, remove it and have one added before the <abbr> tag
		if (original.substring(0, 1) == " ") {
			original = original.substring(1);
			begin = " ";
		}
		
		var toInsert = begin + "<abbr title=\"" + title + "\" style=\"cursor:help; border-bottom:1px dotted #777\">" + original + "</abbr>";
		newMsg = newMsg.splice(result.index + inserted, result.original.length, toInsert);
		inserted += toInsert.length - result.original.length;
	});

	return newMsg;
}

function commonConversion(message, regex, divide, subtract, unit) {
	var m;
	var results = [];
	while ((m = regex.exec(message)) !== null) {
		if (m.index === regex.lastIndex) {
			regex.lastIndex++;
		}

		var amount = Number(m[1].replace(',', '.')); // js wants dots as decimal separators
		var converted = Math.round(((amount - subtract) / divide) * 100) / 100;
		//console.log("Conversion: " + amount + " "  + m[2] + " to " + converted + " " + unit);
		results[results.length] = { original:m[0], index:m.index, conversion:converted, unit:unit };
	}

	return results;
}
