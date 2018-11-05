const Cookie = require('cookie');

function fillDefaults(a, b) {
	Object.keys(b).forEach(key => {
		if (!(key in a)) {
			a[key] = b[key];
		} else if (typeof b[key] == "object" && b[key] != null) {
			a[key] = fillDefaults(a[key], b[key]);
		}
	});
	return a;
}

module.exports = {
  getHostFromWebservice(webservice) {
    return webservice.url.replace(":443", "").replace("https://", "");
  },
  cookiesToStr(cookies) {
    return cookies.map(function(cookie) {
      return Object.keys(cookie)[0] + '="' + cookie[Object.keys(cookie)[0]] + '"';
    }).join("; ");
  },
  parseCookieStr(str) {
    return str.map(cookie => Cookie.parse(cookie))
  },
  fillCookies(object, fill) {
    Object.keys(fill).forEach(function(key) {
      object[key] = fill[key];
    });


    return object;
  },
  newId() {
    var structure = [8, 4, 4, 4, 12];
    var chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
    var id = structure.map(function(part) {
      var partStr = "";
      for (var i = 0; i < part; i++) {
        partStr += chars[Math.trunc(Math.random() * chars.length)];
      }
      return partStr;
    });
    return id.join("-");
  },
  indexOfKey(value, key, start = 0, exclude = []) {
    for (var i = start; i < this.length; i++) {
      if (this[i][key] === value && exclude.indexOf(i) < 0) {
        return i;
      }
    }
    return -1;
  },
  paramStr(object) {
    return Object.keys(object).map(function(parameter) {
      return parameter + "=" + object[parameter];
    }).join("&");


  },
  paramString: object => Object.keys(object).map(parameter => parameter + "=" + object[parameter]).join("&"),
  timeArray(date) {
    //[20170607, 2017, 6, 7, 12, 0, 720];
    if (!date || date instanceof Array) return date;
    return [parseInt(date.toISOString().slice(0,10).replace(/-/g,"")), date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), 720];

  },
  arrayTime(array) {
    if (!array || array instanceof Date) return array;
    array[2]--;
    return Date.applyConstructor(array.slice(1, 6));
  },
  fillMethods(main, obj, self) {
    // Loop trough all keys of the given object
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === "object") {
        // If the current propterty contains an object, loop trough this in the same way. 'main' is here an empty object
        main[key] = module.exports.fillMethods({}, obj[key], self);
      }
      else {
        // Replace the function with a custom one that applies the function with a custom 'this' reference (self client instance)
        main[key] = function() {
          // The arguments of the parent function are passed normally as an array
          return obj[key].apply(self, arguments);
        }
      }
    });
    return main;
  },
  fillDefaults: fillDefaults
};
Function.prototype.applyConstructor = function(args) {
  return new (Function.prototype.bind.apply(this, [null].concat(args)));
}
