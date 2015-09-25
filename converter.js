// ==UserScript==
// @name         RohBot Imperial to Metric
// @version      1.5
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
		var original = result.original;
		
		if (original.substring(0, 1) == " ") {
			original = original.substring(1);
		}
		
		var toInsert = " <abbr title=\"" + title + "\" style=\"cursor:help; border-bottom:1px dotted #777\">" + original + "</abbr>";
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

		var amount = Number(m[1].replace(',', '.')); // js wants dots as decimal separators
		var converted = Math.round(((amount - subtract) / divide) * 100) / 100;
		//console.log("Conversion: " + amount + " "  + m[2] + " to " + converted + " " + unit);
		return {original:m[0], index:m.index, conversion:converted, unit:unit};
	}

	return null;
}

function feet(message) {
	return commonConversion(message, /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(ft|feet|foot)(?=\s|$)/ig, 3.2808, 0, "meters");
}

function inches(message) {
	return commonConversion(message, /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(in|inches|inch)(?=\s|$)/ig, 0.39370, 0, "centimeters");
}

function feetAndInches(message) {
	// the &#39; there in the middle is for '
	var regex = /(?:\s|^)(\d+(?:(?:\.|,)\d+)?)&#39;(\d+(?:(?:\.|,)\d+)?)?(?=\s|$)/ig;
	var m;
	console.log(message);
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
		return {original:m[0], index:m.index, conversion:total, unit:"meters"};
	}
	
	return null;
}

function yards(message) {
	return commonConversion(message, /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(yd|yards|yard)(?=\s|$)/ig, 1.0936, 0, "meters");
}

function fahrenheit(message) {
	return commonConversion(message, /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(f|fahrenheit|degrees fahrenheit)(?=\s|$)/ig, 1.8, 32, "Celsius");
}

function pounds(message) {
	return commonConversion(message, /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(lb|lbs|pounds|pound)(?=\s|$)/ig, 2.2046, 0, "kilograms");
}

function stone(message) {
    return commonConversion(message, /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(st|stone)(?=\s|$)/ig, 0.157473, 0, "kilograms");
}

function ounces(message) {
	return commonConversion(message, /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(oz|ounces|ounce)(?=\s|$)/ig, 0.035274, 0, "grams");
}

function gallons(message) {
	return commonConversion(message, /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(gal|gallons|gallon)(?=\s|$)/ig, 0.26417, 0, "liters");
}

function mph(message) {
	return commonConversion(message, /(?:\s|^)(\d+(?:(?:\.|,)\d+)?) ?(mph|miles per hour)(?=\s|$)/ig, 1/1.6093, 0, "KPH");
}