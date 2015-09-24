// ==UserScript==
// @name         RohBot Imperial to Metric
// @version      1.3
// @description  Converts imperial to metric if it finds any
// @author       Spans
// @match        https://rohbot.net
// @grant        none
// ==/UserScript==

chatMgr.lineFilter.add(function (line, prepend, e) {
	line.Content = applyConversions(line.Content, feet, inches, feetAndInches, yards, fahrenheit, pounds, ounces, gallons, mph, stone);
});

String.prototype.splice = function(idx, rem, s) {
	return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
};

function applyConversions(message) {
	var funcs = Array.slice(arguments, 1);
	var results = [];
	var lastIndex = 0;

	// aggregate the results
	funcs.forEach(function(func) {
		var result = func(message);

		if (result !== null) {
			results.splice(lastIndex++, 0, result);
		}
	});
	
	// sort them
	results.sort(function(a, b) {
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
	results.forEach(function(result) {
		var title = result.conversion.toLocaleString() + " " + result.unit;
		var toInsert = "<abbr title=\"" + title + "\" style=\"cursor:help; border-bottom:1px dotted #777\">" + result.original + "</abbr>";
		newMsg = newMsg.splice(result.index + inserted, result.original.length, toInsert);
		inserted += toInsert.length - result.original.length;
	});

	return newMsg;
}

function commonConversion(message, regex, divide, subtract, unit) {
	var m;
	while ((m = regex.exec(message)) !== null) {
		if (m.index === regex.lastIndex) {
			regex.lastIndex++;
		}

		var amount = Number(m[1]);
		var converted = Math.round(((amount - subtract) / divide) * 100) / 100;
		//console.log("Conversion: " + amount + " "  + m[2] + " to " + converted + " " + unit);
		return {original:m[0], index:m.index, conversion:converted, unit:unit};
	}

	return null;
}

function feet(message) {
	return commonConversion(message, /(\b\d+(?:(?:\.|,)\d+)?) ?(ft|feet|foot)\b/ig, 3.2808, 0, "meters");
}

function inches(message) {
	return commonConversion(message, /(\b\d+(?:(?:\.|,)\d+)?) ?(in|inches|inch)\b/ig, 0.39370, 0, "centimeters");
}

function feetAndInches(message) {
	// the &#39; there in the middle is for '
	var regex = /(\b\d+(?:(?:\.|,)\d+)?)&#39;((?:\d+(?:(?:\.|,)\d+)?)?\b)?/ig;
	var m;
	console.log(message);
	while ((m = regex.exec(message)) !== null) {
		if (m.index === regex.lastIndex) {
			regex.lastIndex++;
		}
		
		var feet = m[1];
		var inches = 0;
		
		if (m[2] != null) {
			inches = m[2];
		}
		
		var convertedFeet = feet / 3.2808;
		var convertedInches = inches / 39.370;
		
		var total = Math.round((convertedFeet + convertedInches) * 100) / 100;
		return {original:m[0], index:m.index, conversion:total, unit:"meters"};
	}
	
	return null;
}

function yards(message) {
	return commonConversion(message, /(\b\d+(?:(?:\.|,)\d+)?) ?(yd|yards|yard)\b/ig, 1.0936, 0, "meters");
}

function fahrenheit(message) {
	return commonConversion(message, /(\b\d+(?:(?:\.|,)\d+)?) ?(f|fahrenheit|degrees fahrenheit)\b/ig, 1.8, 32, "Celsius");
}

function pounds(message) {
	return commonConversion(message, /(\b\d+(?:(?:\.|,)\d+)?) ?(lb|lbs|pounds|pound)\b/ig, 2.2046, 0, "kilograms");
}

function stone(message) {
    return commonConversion(message, /(\b\d+(?:(?:\.|,)\d+)?) ?(st|stone)\b/ig, 0.157473, 0, "kilograms");
}

function ounces(message) {
	return commonConversion(message, /(\b\d+(?:(?:\.|,)\d+)?) ?(oz|ounces|ounce)\b/ig, 0.035274, 0, "grams");
}

function gallons(message) {
	return commonConversion(message, /(\b\d+(?:(?:\.|,)\d+)?) ?(gal|gallons|gallon)\b/ig, 0.26417, 0, "liters");
}

function mph(message) {
	return commonConversion(message, /(\b\d+(?:(?:\.|,)\d+)?) ?(mph|miles per hour)\b/ig, 1/1.6093, 0, "KPH");
}