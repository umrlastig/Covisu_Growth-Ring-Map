



//IMPORTANT CHANGER LES TRUCS COMMENTES ET FAIRE LA SELECTION SUR LES DATES AVANT LA CLUSTERISATION EN PRENANT LA DATE MIN ET MAX DES COULEURS

//var nb_classes = 9;
//var cst_area = 12;
//var agg_radius = 20;
//var color_classes = color_classes_9_ter

var lat_map = 46.90296;
var lng_map = 1.90925;
var zoom_map = 6;




$("#update_button").click(function() {
	var cst_area = parseInt(document.getElementById("cst_area").value)
	var agg_radius = parseInt(document.getElementById("radius").value)
	var selected_color_class = $('#color_class_select').val();
	
	color_classes_array
	
	var color_classes = color_classes_array[selected_color_class];
	var nb_classes = color_classes.length;
	

	event_to_keep = [];
	
	var date_min;
	var date_max;
	if(selected_color_class.split("inner_old").length > 1){
		date_min = new Date(color_classes[color_classes.length - 1].bdate).getTime();
		date_max = new Date(color_classes[0].edate).getTime();
	} else {
		date_min = new Date(color_classes[0].bdate).getTime();
		date_max = new Date(color_classes[color_classes.length - 1].edate).getTime();
	}	
	
	

	for(var g=0; g<data_events.length; g++){
		var date_event = new Date(data_events[g].date)
		if(date_event.getTime()>=date_min && date_event.getTime()<=date_max){
		  event_to_keep.push(data_events[g]);
		} 
	}
  
	$("#div_map_container").empty();
	$("#div_map_container").html("<div id='divmap'></div>")
	
  
	var mapwidth = $("#div_map_container").width();
	var mapheight = $("#div_map_container").height();

	$("#divmap").width(mapwidth);
	$("#divmap").height(mapheight);

	var map = L.map('divmap').setView([lat_map, lng_map], zoom_map);
	
	map.on('moveend', function (a) {
			lat_map = map.getCenter().lat;
			lng_map = map.getCenter().lng;
			zoom_map = map.getZoom();
		}
	)
	
	/*
	var stamenToner = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
		attribution: 'Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap',
		subdomains: 'abcd',
		minZoom: 0,
		maxZoom: 20,
		ext: 'png'
	});*/
	var stamenToner = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
		attribution: 'Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap',
		subdomains: 'abcd',
		minZoom: 0,
		maxZoom: 20,
		ext: 'png'
	});

	map.addLayer(stamenToner);

	var markersCluster = new L.markerClusterGroup({
				maxClusterRadius: agg_radius,
				singleMarkerMode: true,
				iconCreateFunction: function (cluster) {
					
					var nb_events_by_class = [];
					for(var i=0; i<nb_classes; i++){
					  nb_events_by_class.push(0);
					}
					cluster.getAllChildMarkers().forEach((m)=>{ 
						/*var date_event = new Date(m.options.date);
						var time_min_beginning = new Date(objetJS.dateDebutPeriode);
						var time_max_beginning = new Date(objetJS.dateFinPeriode);
						var time_extent = time_max_beginning.getTime() - time_min_beginning.getTime();
						for(var g=0; g<nb_classes; g++){
							var date_limit_down = time_min_beginning.getTime() + time_extent*(g/nb_classes);
							var date_limit_up = time_min_beginning.getTime() + time_extent*((g+1)/nb_classes);
							if(date_event.getTime()>=date_limit_down && date_event.getTime()<date_limit_up){
							  nb_events_by_class[g] = nb_events_by_class[g] +1;
							} 
						}*/
						var date_event = new Date(m.options.date);
						for(var g=0; g<nb_classes; g++){
							var date_limit_down = new Date(color_classes[g].bdate).getTime();
							var date_limit_up = new Date(color_classes[g].edate).getTime();
							if(date_event.getTime()>=date_limit_down && date_event.getTime()<=date_limit_up){
							  nb_events_by_class[g] = nb_events_by_class[g] +1;
							} 
						}
					})
					var nb_events_by_class_sum = 0 
					for(var i =0; i<nb_events_by_class.length; i++){
						nb_events_by_class_sum = nb_events_by_class_sum + nb_events_by_class[i];
					}
					var portion_done = 0;
					var max_area = cluster.getChildCount() * cst_area;
					//var max_area = nb_events_by_class_sum * cst_area;
					var max_radius = Math.sqrt(max_area/Math.PI);

					var ns = 'http://www.w3.org/2000/svg';
					var svg = document.createElementNS(ns, 'svg');
					var vis = d3.select(svg)
						.attr('class', 'grm_class')
						.attr('width', max_radius*2)
						.attr('height', max_radius*2);
						
					//nb_events_by_class = [parseInt(cluster.getChildCount()/4),parseInt(cluster.getChildCount()/4),parseInt(cluster.getChildCount()/4),parseInt(cluster.getChildCount()/4)]
					
					if(nb_events_by_class_sum>0){
						for(var i =0; i<nb_events_by_class.length; i++){
						  var area = (cluster.getChildCount()-portion_done) * cst_area;
						  //var area = (nb_events_by_class_sum-portion_done) * cst_area;
						  var radius = Math.sqrt(area/Math.PI);
						  var color = color_classes[i].color;
						  portion_done = portion_done + nb_events_by_class[i];
						  vis.append("circle")
							.attr("cx", max_radius)
							.attr("cy", max_radius)
							.attr("r", radius)
							.style("fill", color);
						}

						return L.divIcon({
						  html: svg,
						  className: 'marker-cluster-custom',
						  iconSize: L.point(40, 40, true),
						});
					}
					
				},
				//Disable all of the defaults:
				spiderfyOnMaxZoom: true, showCoverageOnHover: true, zoomToBoundsOnClick: false, animate:true, animateAddingMarkers: true
			});


	for (var i = 0; i < event_to_keep.length; i++) {
		var latLng = new L.LatLng(event_to_keep[i].lat, event_to_keep[i].lon);
		var marker = new L.Marker(latLng, {date: event_to_keep[i].date});
		
		
		
		markersCluster.addLayer(marker);
		
	}

	markersCluster.on('clusterclick', function (a) {
			// a.layer is actually a cluster
			console.log('cluster ' + a.layer.getAllChildMarkers().length);
			var nb_events_by_class = [];
			for(var i=0; i<nb_classes; i++){
			  nb_events_by_class.push(0);
			}
			a.layer.getAllChildMarkers().forEach((m)=>{ 
				var date_event = new Date(m.options.date);
				for(var g=0; g<nb_classes; g++){
					var date_limit_down = new Date(color_classes[g].bdate).getTime();
					var date_limit_up = new Date(color_classes[g].edate).getTime();
					if(date_event.getTime()>=date_limit_down && date_event.getTime()<=date_limit_up){
					  nb_events_by_class[g] = nb_events_by_class[g] +1;
					} 
				}
			})
			for(var i=0; i<nb_classes; i++){
			  nb_events_by_class[i] = parseInt((nb_events_by_class[i] / a.layer.getAllChildMarkers().length)*100);
			}
			console.log(nb_events_by_class)
			
		});

	map.addLayer(markersCluster);
	
	
	$("#div_interface_graphic").empty();
	$("#div_interface_graphic").html("<div id='div_interface_graphic_container'></div>")
	
	var gwidth = $("#div_interface_graphic_container").width() - 5;
	var gheight = $("#div_interface_graphic_container").height() -5;

	//calcul nbr_jours
	nbr_jours= parseInt((date_max - date_min)/86400000 +1);

		
	nbr_case_day_array = [];	
	var max_nb_event = 0;
	for (var j=0; j<nbr_jours; j++){
		nbr_case_day_array.push(0);
	}
	for(var e=0; e<data_events.length; e++){
		var this_event = data_events[e]
		var date_event = new Date(this_event.date).getTime()
		for (var j=0; j<nbr_jours; j++){
			//calcul this_date
			var this_date_time_plus = date_min + 86400000*(j+1);
			var this_date_time_moins = date_min + 86400000*(j-1);
			//calcul this_eventdate
			
			if(date_event > this_date_time_moins && date_event < this_date_time_plus){
				nbr_case_day_array[j] = nbr_case_day_array[j] + 1;
				if(nbr_case_day_array[j]>max_nb_event){
					max_nb_event = nbr_case_day_array[j];
				}
				break;
			}
		}
	}
	
	var grx = d3.scaleLinear()
		.domain([0, nbr_jours]) 
		.range([0, gwidth]) // unit: pixels

	var gry = d3.scaleLinear()
		.domain([0, max_nb_event]) 
		.range([0, gheight]) // unit: pixels
		
	var svg = d3.select("#div_interface_graphic_container").append("svg")
		.attr("id", "graph")
		.attr("width", gwidth)
		.attr("height", gheight)
		
	
	for (var j=0; j<nbr_case_day_array.length; j++){
		
		var date_jour = Math.round((date_min + 86400000*(j))/86400000);
		
		var color_histo = "#000000";
		
		for(var g=0; g<nb_classes; g++){
			var date_limit_down = Math.round(new Date(color_classes[g].bdate).getTime()/86400000);
			var date_limit_up = Math.round(new Date(color_classes[g].edate).getTime()/86400000);
			if(date_jour>=date_limit_down && date_jour<=date_limit_up){
			  color_histo = color_classes[g].color
			} 
		}
		
		svg.append("rect")
			.attr("class", "bar")
			.attr("x", grx(j))
			.attr("width", grx(1))
			.attr("y", 0)
			.attr('fill', color_histo)
			.attr("height", gry(nbr_case_day_array[j]))	
			.attr("transform", "translate(" + 0 + "," + (gheight - gry(nbr_case_day_array[j])) + ")")	
	}
	
	$("#list_date").empty()
	var list_date_string ="";
	for(var g=0; g<nb_classes; g++){
		list_date_string = list_date_string + color_classes[g].bdate + " - " + color_classes[g].edate + "<br>"
	}
	list_date_string = list_date_string + max_nb_event
	$("#list_date").html(list_date_string)
  
});






