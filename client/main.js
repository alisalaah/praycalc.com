Template.content.onRendered(function () {
	sessionGeo();
	setInterval(function() {
		var loc = Session.get('loc');
		var d = (loc.offset) ? calcDate(loc.offset) : new Date();
		Session.set('locdate',d);
	}, 1000);
});

function calcDate(offset, date) {
	var d = (date) ? new Date(date) : new Date();
	var localTime = d.getTime();
	var localOffset = d.getTimezoneOffset() * 60000;
	var utc = localTime + localOffset;
	var newtime = utc + (3600000*offset);
	return new Date(newtime);
	// .toLocaleString();
}
//alert("Local time in Erie is "+calcDate(-5).toLocaleString());

Template.header.events({
	'click #help': function () {
		bootbox.dialog({
			title: "Help",
			message: Blaze.toHTMLWithData(Template.help),
			onEscape: true,
			closeButton: true,
			buttons: {
				alert: {
					label: "Ok",
					className: "btn-primary",
					callback: function () {
						bootbox.hideAll();
					}
				}
			}
		});
	},
	'click #about': function () {
		bootbox.dialog({
			title: "About",
			message: Blaze.toHTMLWithData(Template.about),
			onEscape: true,
			closeButton: true,
			buttons: {
				alert: {
					label: "Ok",
					className: "btn-primary",
					callback: function () {
						bootbox.hideAll();
					}
				}
			}
		});
	},
	'click #contact': function () {
		bootbox.dialog({
			title: 'Contact',
			message: Blaze.toHTMLWithData(Template.contact),
			onEscape: true,
			closeButton: true,
			buttons: {
				alert: {
					label: "Ok",
					className: "btn-primary",
					callback: function () {
						bootbox.hideAll();
					}
				}
			}
		});
	}
});

//Template.registerHelper('city', function () {
//});

Template.content.helpers({
	city: function () {
		var loc = Session.get('loc');
		if (loc && loc.city) return loc.city+', '+loc.country;
		return "...";		
	},
	clock: function () {
		var d = Session.get('locdate');
		if (!d) return null;
		var h = (d.getHours() < 10) ? "0"+d.getHours() : d.getHours();
		var m = (d.getMinutes() < 10) ? "0"+d.getMinutes() : d.getMinutes();
		var s = (d.getSeconds() < 10) ? "0"+d.getSeconds() : d.getSeconds();
		return h+":"+m+":"+s;
	},
	map: function () {
		var loc = Session.get('loc');
		var lat = (loc && loc.lat) ? loc.lat : null;
		var lng = (loc && loc.lng) ? loc.lng : null;

		var dt = (loc && loc.display) ? loc.display.split("-").join("").split(" ").join("").split(".").join("").split(",").join("") : null;
		if (dt) {
			GoogleMaps.init({'sensor': true}, function () {
				var mapOptions = {
					center: new google.maps.LatLng(lat, lng),
					zoom: (dt > 9999999) ? 17 : 10,
					mapTypeId: (dt > 9999999) ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP
				};
				map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
				
				var lineCoordinates = [
						new google.maps.LatLng(lat, lng), // Location
						new google.maps.LatLng(21.422498, 39.826170) // Kabah
					];

				var line = new google.maps.Polyline({
					path: lineCoordinates,
					icons: [{
						icon: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
						offset: '100%'
					}],
				    fillColor: 'white',
					fillOpacity: 1,
					scale: 1,
					strokeColor: 'red',
					strokeWeight: 4,
					geodesic: true,
					map: map
				});
				
				var marker = new google.maps.Marker({
					position: map.getCenter(),
					icon: {
						path: google.maps.SymbolPath.CIRCLE,
					    fillColor: 'black',
						fillOpacity: 1,
						scale: 1,
						strokeColor: 'blue',
						strokeWeight: 4
					},
					map: map
				});
				
				var q = qiblahDirection(lat,lng);
				var qd = Math.round(q * 100) / 100;
				
				var infoWindow = new google.maps.InfoWindow({
					content: "<p style='margin:0;padding:0'><strong>"+loc.city+"</strong></p><p style='line-height:10%;font-size:10px;color:#999;margin:0;padding:0'>("+lat+", "+lng+")<p><p style='font-size:14px;color:red;'>Qiblah: "+qd+"°</p>"
				});

				google.maps.event.addListener(marker, 'click', function () {
					infoWindow.open(map, marker);
				});
				infoWindow.open(map, marker);
			
			});
			
			return null;
		}
		return "";
	},
	hijri: function () {
		var d = Session.get('locdate');
		if (!d) return null;
		var h = conv2hijri(d);
        var hdn = new Array("Ahad","Ithnin","Thulatha","Arba","Khams","Jumuah","Sabt");
        var hmn = new Array("Muharram","Safar","Rabiul Awwal","Rabiul Akhir","Jumadal Ula","Jumadal Akhir","Rajab","Shaban","Ramadan","Shawwal","Dhul Qida","Dhul Hijja");
        var hw = h[4];
        var hd = h[5];
        var hm = h[6];
        var hy = h[7];
        var hr = (hmn[hm] === undefined) ? "..." : (hdn[hw] + ", " + hd + " " + hmn[hm] + " " + hy + " AH");

		return hr;
	},
	grego: function () {
		var d = Session.get('locdate');
		if (!d) return null;
        var gdn = new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
        var gmn = new Array("January","February","March","April","May","June","July","August","September","October","November","December");
        var dw = d.getDay();
        var dd = d.getDate();
        var dm = d.getMonth();
        var dy = d.getFullYear();
        var dr = (gmn[dm] === undefined) ? "..." : (gdn[dw] + ", " + dd + " " + gmn[dm] + " " + dy + " CE");
		
		return dr;
	},
	showTimes: function () {
		var loc = Session.get('loc');
		if (!loc || !loc.lat) return null;
				
		var times = pcTimes(loc.lat,loc.lng,true);
		var html = '';
		for (var k in times){
			//calc
			var d = calcDate(loc.offset, times[k]);
			var h = (d.getHours() < 10) ? "0"+d.getHours() : d.getHours();
			var m = (d.getMinutes() < 10) ? "0"+d.getMinutes() : d.getMinutes();
			//var s = (d.getSeconds() < 10) ? "0"+d.getSeconds() : d.getSeconds();
		
			//12h
			var thf = Session.get('thf');
			if (thf) {
				h = h*1;
				var ap = (h > 11) ? "pm" : "am";
				h = (h > 12) ? h - 12 : h;
				var t = h+":"+m+" "+ap;
			}
			else {
				var t = h+":"+m;
			}

			//sunrise + qiyam = gray
			var sunrise = (k === "Sunrise" || k === "Qiyam") ? "sunrise" : "";
			
			//active - verbose but had hard time wrapping days (isha at start of new day etc)
			var current = "";
			if (new Date() < times['Fajr'] && k === "Isha") current = "current";
			if (new Date() > times['Isha'] && k === "Isha") current = "current";
			if (new Date() > times['Maghrib'] && new Date() < times['Isha'] && k === "Maghrib") current = "current";
			if (new Date() > times['Asr'] && new Date() < times['Maghrib'] && k === "Asr") current = "current";
			if (new Date() > times['Dhuhr'] && new Date() < times['Asr'] && k === "Dhuhr") current = "current";
			if (new Date() > times['Sunrise'] && new Date() < times['Dhuhr'] && k === "Sunrise") current = "sunrise-after";
			if (new Date() > times['Fajr'] && new Date() < times['Sunrise'] && k === "Fajr") current = "current";
			
			//put together
			html += '<div class="row '+sunrise+' '+current+'"><div class="col-lg-6 pname">'+k+'</div><div class="col-lg-6 ptime">'+t+'</div></div>';
		}
		return html;
	},
	sunTimes: function () {
		var loc = Session.get('loc');
		if (!loc || !loc.lat) return null;

		var now = calcDate(loc.offset);
		var stimes = SunCalc.getTimes(now, loc.lat, loc.lng);
		
		var times = {
			'Astronomical Dawn': stimes["nightEnd"],
			'Nautical Dawn': stimes["nauticalDawn"],
			'Civil Dawn': stimes["dawn"],
			'Sunrises': stimes["sunrise"],
			'Sunrise Ends': stimes["sunriseEnd"],
			'Solar Noon': stimes["solarNoon"],
			'Sunset Starts': stimes["sunsetStart"],
			'Sunsets': stimes["sunset"],
			'Civil Dusk': stimes["dusk"],
			'Nautical Dusk': stimes["nauticalDusk"],
			'Astronomical Dusk': stimes["night"]
		};

		var html = ''; var i = 0;
		for (var k in times){
			//calc
			var d = calcDate(loc.offset, times[k]);

			var h = (d.getHours() < 10) ? "0"+d.getHours() : d.getHours();
			var m = (d.getMinutes() < 10) ? "0"+d.getMinutes() : d.getMinutes();
			var s = (d.getSeconds() < 10) ? "0"+d.getSeconds() : d.getSeconds();
		
			//12h
			var thf = Session.get('thf');
			if (thf) {
				h = h*1;
				var ap = (h > 11) ? "pm" : "am";
				h = (h > 12) ? h - 12 : h;
				var t = h+":"+m+":"+s+" "+ap;
			}
			else {
				var t = h+":"+m+":"+s;
			}

			//color
			if (i > 7 || i < 3) { var color = "twilight"; }
			else if (i == 5) { var color = "daylight"; }
			else { color = "sunphase"; }
			
			//put together
			html += '<div class="row '+color+'"><div class="col-lg-7 spname">'+k+'</div><div class="col-lg-5 sptime">'+t+'</div></div>';
			
			i++;
		}
		return html;
	},
	sunRanges: function () {

	}
});