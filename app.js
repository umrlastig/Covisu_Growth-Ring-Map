



//IMPORTANT CHANGER LES TRUCS COMMENTES ET FAIRE LA SELECTION SUR LES DATES AVANT LA CLUSTERISATION EN PRENANT LA DATE MIN ET MAX DES COULEURS

//var nb_classes = 9;
//var cst_area = 12;
//var agg_radius = 20;
//var color_classes = color_classes_9_ter

$('body').height($(window).height());
$('body').width($(window).width()-10);

$('#div_color_legend').height($(window).height()*0.8);
$('#div_color_legend').width($(window).width()*0.3);


var lat_map = 46.90296;
var lng_map = 1.90925;
var zoom_map = 6;
var map_bounds;
var map;

var data_events = [];

var legend_status = "legend_activated";
//var legend_status == "legend_non_activated";

/*
$("#update_button").click(function() {
	
	update_map();
  
});
*/

$("#legend_menu_button").click(function() {
	
	if($("#div_color_legend").css("visibility") == "hidden"){
		$("#div_color_legend").css("visibility","visible");
	} else {
		$("#div_color_legend").css("visibility","hidden");
	}
	
});	

$("#number_ofclasses").on("change",function() {
	
	create_legend_cursors(parseInt($(this).val()));
	
	update_map();
	
});

$("#number_ofclasses").on("change",function() {
		
	update_map();
	
});

$("#date_order").on("change",function() {
		
	update_map();
	
});

$("#glyph_construction_type").on("change",function() {
		
	update_map();
	
});


$("#number_ofclasses").on("input",function() {
	
	create_legend_cursors(parseInt($(this).val()));
	
	var color_classes;
	
	if(legend_status == "legend_activated"){
		color_classes = []; 
		if($("#date_order").val() == "inner_new"){
			for(var f=0; f<d3.selectAll(".bar_legend_color")._groups[0].length; f++){
				var new_color_class = {
					'bdate':d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("bdate_legend"),
					'edate':d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("edate_legend"),
					'color': d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("color_legend"),
					'legend_bar_value': d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("legend_bar_value")
				}
				color_classes.push(new_color_class);
			}
		} else if($("#date_order").val() == "inner_old"){	
			for(var f=0; f<d3.selectAll(".bar_legend_color")._groups[0].length; f++){
				var new_color_class = {
					'bdate':d3.select(d3.selectAll(".bar_legend_color")._groups[0][d3.selectAll(".bar_legend_color")._groups[0].length - 1 - f]).attr("bdate_legend"),
					'edate':d3.select(d3.selectAll(".bar_legend_color")._groups[0][d3.selectAll(".bar_legend_color")._groups[0].length - 1 - f]).attr("edate_legend"),
					'color': d3.select(d3.selectAll(".bar_legend_color")._groups[0][d3.selectAll(".bar_legend_color")._groups[0].length - 1 - f]).attr("color_legend"),
					'legend_bar_value': d3.select(d3.selectAll(".bar_legend_color")._groups[0][d3.selectAll(".bar_legend_color")._groups[0].length - 1 - f]).attr("legend_bar_value")
				}
				color_classes.push(new_color_class);
			}
		}
	} else if(legend_status == "legend_non_activated"){	
		color_classes = color_classes_array[selected_color_class];
	}
	
	var nb_classes = color_classes.length;
	
	event_to_keep = [];
	
	var date_min;
	var date_max;
	
	if(legend_status == "legend_activated"){
		date_min = new Date($("#dataset_start").val()).getTime();
		date_max = new Date($("#dataset_end").val()).getTime();
	} else if(legend_status == "legend_non_activated"){	
		if(selected_color_class.split("inner_old").length > 1){
			date_min = new Date(color_classes[color_classes.length - 1].bdate).getTime();
			date_max = new Date(color_classes[0].edate).getTime();
		} else {
			date_min = new Date(color_classes[0].bdate).getTime();
			date_max = new Date(color_classes[color_classes.length - 1].edate).getTime();
		}
	}
	create_histogram(date_max,date_min,data_events,nb_classes,color_classes);
	
});


$("#color_palette").on("change",function() {
	create_color_legend();
	
	update_map();
});

$("#color_order").on("change",function() {
	create_color_legend();
	
	update_map();
});


$("#cst_area").on("change",function() {	
	update_map();
});

$("#cst_area").on("input",function() {	
	$("#cst_area_label").html($("#cst_area").val());
});

$("#radius").on("change",function() {	
	update_map();
});

$("#radius").on("input",function() {	
	$("#radius_label").html($("#radius").val());
});




$("#data_file").on("change",function(e) {
	var file = e.target.files[0];
	  if (!file) {
		return;
	  }
	  var reader = new FileReader();
	  reader.onload = function(e) {
		var contents = e.target.result;
		data_events = JSON.parse(contents);
		 
		var date_min_dataset;
		var date_max_dataset;
		
		for(var o=0; o<data_events.length; o++){
			if(o==0){
				date_min_dataset = new Date(data_events[o].date).getTime();
				date_max_dataset = new Date(data_events[o].date).getTime();
			} else {
				var new_date = new Date(data_events[o].date).getTime();
				if(new_date<date_min_dataset){
					date_min_dataset = new_date;
				}
				if(new_date>date_max_dataset){
					date_max_dataset = new_date;
				}
			}
		}
		
		var date_min_dataset_date = new Date();
		var date_max_dataset_date = new Date();
		
		date_min_dataset_date.setTime(date_min_dataset);
		date_max_dataset_date.setTime(date_max_dataset);
		
		var date_min_dataset_date_1;
		if(date_min_dataset_date.getDate()<10){date_min_dataset_date_1 = "0" + date_min_dataset_date.getDate()}else{date_min_dataset_date_1 = "" + date_min_dataset_date.getDate() + ""}
		var date_min_dataset_date_2;
		if((date_min_dataset_date.getMonth() + 1)<10){date_min_dataset_date_2 = "0" + (date_min_dataset_date.getMonth() + 1)}else{date_min_dataset_date_2 = "" + (date_min_dataset_date.getMonth() + 1) + ""}
		var date_min_dataset_date_3 = date_min_dataset_date.getFullYear();
		
		var date_max_dataset_date_1;
		if(date_max_dataset_date.getDate()<10){date_max_dataset_date_1 = "0" + date_max_dataset_date.getDate()}else{date_max_dataset_date_1 = "" + date_max_dataset_date.getDate() + ""}
		var date_max_dataset_date_2;
		if((date_max_dataset_date.getMonth() + 1)<10){date_max_dataset_date_2 = "0" + (date_max_dataset_date.getMonth() + 1)}else{date_max_dataset_date_2 = "" + (date_max_dataset_date.getMonth() + 1) + ""}
		var date_max_dataset_date_3 = date_max_dataset_date.getFullYear();
		
		var date_min_dataset_string = date_min_dataset_date_3 + "-" + date_min_dataset_date_2 + "-" + date_min_dataset_date_1;
		var date_max_dataset_string = date_max_dataset_date_3 + "-" + date_max_dataset_date_2 + "-" + date_max_dataset_date_1;
				
		$("#dataset_start").val(date_min_dataset_string);
		$("#dataset_end").val(date_max_dataset_string);
		
		$("#number_ofclasses_label").html(parseInt($("#number_ofclasses").val()) +  " classes");
		$('#classes_border_selectors').html("");	
		for(var nc = 0; nc<(parseInt($("#number_ofclasses").val())-1); nc++){
			create_date_selectors_slider(nc, nc + 1,  parseInt($("#number_ofclasses").val()),new Date($("#dataset_start").val()),new Date($("#dataset_end").val()));
		}

		create_color_legend();
		
		
		update_map();
		
		map_center = [
			(map_bounds._northEast.lat + map_bounds._southWest.lat)/2,
			(map_bounds._southWest.lng + map_bounds._northEast.lng)/2
		];
		
		map.setView(map_center, 11);
		
	  };
	  reader.readAsText(file);
	  
})

$("#number_ofclasses_label").html(parseInt($("#number_ofclasses").val()) +  " classes");
$('#classes_border_selectors').html("");	
for(var nc = 0; nc<(parseInt($("#number_ofclasses").val())-1); nc++){
	create_date_selectors_slider(nc, nc + 1,  parseInt($("#number_ofclasses").val()),new Date($("#dataset_start").val()),new Date($("#dataset_end").val()));
}

create_color_legend();


update_map();

function update_map(){
	
	var cst_area = parseInt(document.getElementById("cst_area").value)
	var agg_radius = parseInt(document.getElementById("radius").value)
	var selected_color_class = $('#color_class_select').val();
		
	var color_classes;
	
	if(legend_status == "legend_activated"){
		color_classes = []; 
		if($("#date_order").val() == "inner_new"){
			for(var f=0; f<d3.selectAll(".bar_legend_color")._groups[0].length; f++){
				var new_color_class = {
					'bdate':d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("bdate_legend"),
					'edate':d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("edate_legend"),
					'color': d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("color_legend"),
					'legend_bar_value': d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("legend_bar_value")
				}
				color_classes.push(new_color_class);
			}
		} else if($("#date_order").val() == "inner_old"){	
			for(var f=0; f<d3.selectAll(".bar_legend_color")._groups[0].length; f++){
				var new_color_class = {
					'bdate':d3.select(d3.selectAll(".bar_legend_color")._groups[0][d3.selectAll(".bar_legend_color")._groups[0].length - 1 - f]).attr("bdate_legend"),
					'edate':d3.select(d3.selectAll(".bar_legend_color")._groups[0][d3.selectAll(".bar_legend_color")._groups[0].length - 1 - f]).attr("edate_legend"),
					'color': d3.select(d3.selectAll(".bar_legend_color")._groups[0][d3.selectAll(".bar_legend_color")._groups[0].length - 1 - f]).attr("color_legend"),
					'legend_bar_value': d3.select(d3.selectAll(".bar_legend_color")._groups[0][d3.selectAll(".bar_legend_color")._groups[0].length - 1 - f]).attr("legend_bar_value")
				}
				color_classes.push(new_color_class);
			}
		}
	} else if(legend_status == "legend_non_activated"){	
		color_classes = color_classes_array[selected_color_class];
	}
	
	var nb_classes = color_classes.length;
	
	event_to_keep = [];
	
	var date_min;
	var date_max;
	
	if(legend_status == "legend_activated"){
		date_min = new Date($("#dataset_start").val()).getTime();
		date_max = new Date($("#dataset_end").val()).getTime();
	} else if(legend_status == "legend_non_activated"){	
		if(selected_color_class.split("inner_old").length > 1){
			date_min = new Date(color_classes[color_classes.length - 1].bdate).getTime();
			date_max = new Date(color_classes[0].edate).getTime();
		} else {
			date_min = new Date(color_classes[0].bdate).getTime();
			date_max = new Date(color_classes[color_classes.length - 1].edate).getTime();
		}
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

	map = L.map('divmap').setView([lat_map, lng_map], zoom_map);
	
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
					
					var selected_glyph_type = $('#glyph_construction_type').val();
					
					if(selected_glyph_type == "area_type"){
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
					} else if(selected_glyph_type == "radius_type"){
						if(nb_events_by_class_sum>0){
							for(var i =0; i<nb_events_by_class.length; i++){
							  var radius = ((cluster.getChildCount()-portion_done)/cluster.getChildCount())* max_radius;
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
			var nb_events_all = 0;
			for(var i=0; i<nb_classes; i++){
			  nb_events_by_class[i] = parseInt((nb_events_by_class[i] / a.layer.getAllChildMarkers().length)*100);
			  nb_events_all = nb_events_all + nb_events_by_class[i];
			}
			
			$("#div_interface_graphic_container_selectedcluster").html("");
			
			var gwidth_selectedcluster = $("#div_interface_graphic_container_selectedcluster").width() - 5;
			var gheight_selectedcluster = $("#div_interface_graphic_container_selectedcluster").height() -5;
						
			//create new graph for the cluster 
			var grx_selectedcluster = d3.scaleLinear()
					.domain([0, nb_events_by_class.length]) 
					.range([0, gwidth_selectedcluster]) // unit: pixels

			var gry_selectedcluster = d3.scaleLinear()
				.domain([0, Math.max(...nb_events_by_class)]) 
				.range([0, gheight_selectedcluster]) // unit: pixels

			var svg_selectedcluster = d3.select("#div_interface_graphic_container_selectedcluster").append("svg")
					.attr("id", "graph_selectedcluster")
					.attr("width", gwidth_selectedcluster)
					.attr("height", gheight_selectedcluster)


			if(legend_status == "legend_activated"){
				if($("#date_order").val() == "inner_old"){
					
					var x_ini = 0;
					for(var u=0; u<nb_events_by_class.length; u++){

						var s = nb_events_by_class.length - u - 1;
						
						var color_histo_selectedcluster = color_classes[s].color;
						var bdate_selectedcluster = color_classes[s].bdate;
						var edate_selectedcluster = color_classes[s].edate;
						var legend_bar_value = parseInt(color_classes[s].legend_bar_value);
						
						var width_bar = nb_events_by_class.length * (legend_bar_value/100);
						
						svg_selectedcluster.append("rect")
						.attr("class", "bar_selectedcluster")
						.attr("x", grx_selectedcluster(x_ini))
						.attr("width", grx_selectedcluster(width_bar))
						.attr("y", 0)
						.attr('fill', color_histo_selectedcluster)
						.attr("height", gry_selectedcluster(nb_events_by_class[s]))	
						.attr("transform", "translate(" + 0 + "," + (gheight_selectedcluster - gry_selectedcluster(nb_events_by_class[s])) + ")")	
						.attr("bdate", bdate_selectedcluster)	
						.attr("edate", edate_selectedcluster)
						.attr("color_class", s)
						.attr('color_histo', color_histo_selectedcluster)	
						.attr('number_event', nb_events_by_class[s])
						.attr('number_event_all', nb_events_all)					
						.on("mouseover", handleMouseOver_selectedcluster)
						.on("mouseout", handleMouseOut_selectedcluster);
						
						x_ini = x_ini + width_bar;
					}
				} else if ($("#date_order").val() == "inner_new"){
					
					var x_ini = 0;
					for(var u=0; u<nb_events_by_class.length; u++){

						var color_histo_selectedcluster = color_classes[u].color;
						var bdate_selectedcluster = color_classes[u].bdate;
						var edate_selectedcluster = color_classes[u].edate;
						var legend_bar_value = parseInt(color_classes[u].legend_bar_value);
						
						var width_bar = nb_events_by_class.length * (legend_bar_value/100);
						
						svg_selectedcluster.append("rect")
						.attr("class", "bar_selectedcluster")
						.attr("x", grx_selectedcluster(x_ini))
						.attr("width", grx_selectedcluster(width_bar))
						.attr("y", 0)
						.attr('fill', color_histo_selectedcluster)
						.attr("height", gry_selectedcluster(nb_events_by_class[u]))	
						.attr("transform", "translate(" + 0 + "," + (gheight_selectedcluster - gry_selectedcluster(nb_events_by_class[u])) + ")")	
						.attr("bdate", bdate_selectedcluster)	
						.attr("edate", edate_selectedcluster)
						.attr("color_class", u)
						.attr('color_histo', color_histo_selectedcluster)	
						.attr('number_event', nb_events_by_class[u])
						.attr('number_event_all', nb_events_all)		
						.on("mouseover", handleMouseOver_selectedcluster)
						.on("mouseout", handleMouseOut_selectedcluster);
						
						x_ini = x_ini + width_bar;
					}
				}
			} else if(legend_status == "legend_non_activated"){		
					
				if(selected_color_class.split("inner_old").length > 1){
					for(var u=0; u<nb_events_by_class.length; u++){

						var s = nb_events_by_class.length - u - 1;
						
						var color_histo_selectedcluster = color_classes[s].color;
						var bdate_selectedcluster = color_classes[s].bdate
						var edate_selectedcluster = color_classes[s].edate
						
						svg_selectedcluster.append("rect")
						.attr("class", "bar_selectedcluster")
						.attr("x", grx_selectedcluster(u))
						.attr("width", grx_selectedcluster(1))
						.attr("y", 0)
						.attr('fill', color_histo_selectedcluster)
						.attr("height", gry_selectedcluster(nb_events_by_class[s]))	
						.attr("transform", "translate(" + 0 + "," + (gheight_selectedcluster - gry_selectedcluster(nb_events_by_class[s])) + ")")	
						.attr("bdate", bdate_selectedcluster)	
						.attr("edate", edate_selectedcluster)
						.attr("color_class", s)
						.attr('color_histo', color_histo_selectedcluster)	
						.attr('number_event', nb_events_by_class[s])
						.attr('number_event_all', nb_events_all)					
						.on("mouseover", handleMouseOver_selectedcluster)
						.on("mouseout", handleMouseOut_selectedcluster);
					}
				} else {
					for(var u=0; u<nb_events_by_class.length; u++){

						var color_histo_selectedcluster = color_classes[u].color;
						var bdate_selectedcluster = color_classes[u].bdate
						var edate_selectedcluster = color_classes[u].edate
						
						svg_selectedcluster.append("rect")
						.attr("class", "bar_selectedcluster")
						.attr("x", grx_selectedcluster(u))
						.attr("width", grx_selectedcluster(1))
						.attr("y", 0)
						.attr('fill', color_histo_selectedcluster)
						.attr("height", gry_selectedcluster(nb_events_by_class[u]))	
						.attr("transform", "translate(" + 0 + "," + (gheight_selectedcluster - gry_selectedcluster(nb_events_by_class[u])) + ")")	
						.attr("bdate", bdate_selectedcluster)	
						.attr("edate", edate_selectedcluster)
						.attr("color_class", u)
						.attr('color_histo', color_histo_selectedcluster)	
						.attr('number_event', nb_events_by_class[u])
						.attr('number_event_all', nb_events_all)		
						.on("mouseover", handleMouseOver_selectedcluster)
						.on("mouseout", handleMouseOut_selectedcluster);
					}
				}
			
			}
				
		});

	map.addLayer(markersCluster);
	
	map_bounds = markersCluster.getBounds();
	
	create_histogram(date_max,date_min,data_events,nb_classes,color_classes);
	
}

function create_histogram(date_max,date_min,data_events,nb_classes,color_classes){
	
	
	$("#div_interface_graphic").empty();
	$("#div_interface_graphic").html("<div id='div_interface_graphic_container'></div>")
	
	var gwidth = $("#div_interface_graphic_container").width() - 5;
	var gheight = $("#div_interface_graphic_container").height() -5;

	//calcul nbr_jours
	var nbr_jours= parseInt((date_max - date_min)/86400000 +1);

		
	var nbr_case_day_array = [];	
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
		
		var bdate_bar = "";
		var edate_bar = "";
		var color_class_bar = "";
		
		var actual_day = new Date();
		actual_day.setTime(date_jour*86400000);
		
		for(var g=0; g<nb_classes; g++){
			var date_limit_down = Math.round(new Date(color_classes[g].bdate).getTime()/86400000);
			var date_limit_up = Math.round(new Date(color_classes[g].edate).getTime()/86400000);
			if(date_jour>=date_limit_down && date_jour<=date_limit_up){
			  color_histo = color_classes[g].color
			  
				bdate_bar = color_classes[g].bdate;
				edate_bar = color_classes[g].edate;
				color_class_bar = g;
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
			.attr("bdate", bdate_bar)	
			.attr("edate", edate_bar)
			.attr("color_class", color_class_bar)
			.attr('color_histo', color_histo)	
			.attr("number_cases_day", nbr_case_day_array[j])	
			.attr("day", actual_day.getDate())	
			.attr("month", parseInt(actual_day.getMonth())+1)	
			.attr("year", actual_day.getFullYear())	
			.on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut);
	}
}



function create_legend_cursors(number_of_class){
	
	$("#number_ofclasses_label").html(number_of_class +  " classes");
	
	$('#classes_border_selectors').html("");
	
	var dataset_start = new Date($("#dataset_start").val());
	var dataset_end = new Date($("#dataset_end").val());
	
	for(var nc = 0; nc<(number_of_class-1); nc++){
		create_date_selectors_slider(nc, nc + 1,  number_of_class,dataset_start,dataset_end);
	}
	
	if(number_of_class * $(".div_date_selectors_slider").height() > $("#classes_border_selectors").height()){
		$(".div_date_selectors_slider").height($("#classes_border_selectors").height()/number_of_class);
	}
	
	create_color_legend();
	
}


function create_date_selectors_slider(class_id_ante, class_id_post, number_total_of_class,dataset_start,dataset_end){
	
	var id_div = "div_date_selectors_slider_classes_" + class_id_ante + "_to_" + class_id_post + "";
	var class_div = "div_date_selectors_slider";
	var id_range = "range_date_selectors_slider_classes_" + class_id_ante + "_to_" + class_id_post + "";
	var class_range = "range_date_selectors_slider";
	var id_p = "p_date_selectors_slider_classes_" + class_id_ante + "_to_" + class_id_post + "";;
	var class_p = "p_date_selectors_slider";
	
	var html_to_input = "";
	html_to_input += "<div id=" + id_div + " class=" + class_div + " 'class_id_ante'='" + class_id_ante + "' 'class_id_post'='" + class_id_post + "' >";
	html_to_input += "<input type='range' id=" + id_range + " class=" + class_range + "  name='date_selectors_slider_classes_" + class_id_ante + "_to_" + class_id_post + "' min='0' max='100' value='" + parseInt((class_id_post/number_total_of_class)*100) + "' step='1'  'class_id_ante'='" + class_id_ante + "' 'class_id_post'='" + class_id_post + "' >";
	html_to_input += "<p  id=" + id_p + " class=" + class_p + " 'class_id_ante'='" + class_id_ante + "' 'class_id_post'='" + class_id_post + "' >Exemple</p>";
	html_to_input += "</div>";
	
	$('#classes_border_selectors').append(html_to_input);
	
	var border_date_ini = new Date();
	border_date_ini.setTime(dataset_start.getTime() + parseInt((dataset_end.getTime() - dataset_start.getTime())*(parseInt(parseInt((class_id_post/number_total_of_class)*100))/100)));
	
	var border_day_ini;
	if(border_date_ini.getDate()<10){border_day_ini = "0" + border_date_ini.getDate()}else{border_day_ini = "" + border_date_ini.getDate() + ""}
	var border_month_ini;
	if((border_date_ini.getMonth() + 1)<10){border_month_ini = "0" + (border_date_ini.getMonth() + 1)}else{border_month_ini = "" + (border_date_ini.getMonth() + 1) + ""}
	var border_year_ini = border_date_ini.getFullYear();
	
	$("#" + id_p + "").html("" + border_day_ini + "/" + border_month_ini + "/" + border_year_ini);
	
	$("#" + id_range + "").on("change",function() {
		
		try {
		  update_map();
		} catch (error) {
		  console.error(error);
		  // expected output: ReferenceError: nonExistentFunction is not defined
		  // Note - error messages will vary depending on browser
		}

	});
	
	$("#" + id_range + "").on("input",function() {
		
		try {
			var percentage_value = parseInt($(this).val());
			var delta_time = (dataset_end.getTime() - dataset_start.getTime())*(percentage_value/100);
			var border_date = new Date();
			border_date.setTime(dataset_start.getTime() + parseInt(delta_time));
			
			var border_day;
			if(border_date.getDate()<10){border_day = "0" + border_date.getDate()}else{border_day = "" + border_date.getDate() + ""}
			var border_month;
			if((border_date.getMonth() + 1)<10){border_month = "0" + (border_date.getMonth() + 1)}else{border_month = "" + (border_date.getMonth() + 1) + ""}
			var border_year = border_date.getFullYear();
			
			$("#" + id_p + "").html("" + border_day + "/" + border_month + "/" + border_year);
			
		
			create_color_legend();
							
			var color_classes;
		
			if(legend_status == "legend_activated"){
				color_classes = []; 
				if($("#date_order").val() == "inner_new"){
					for(var f=0; f<d3.selectAll(".bar_legend_color")._groups[0].length; f++){
						var new_color_class = {
							'bdate':d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("bdate_legend"),
							'edate':d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("edate_legend"),
							'color': d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("color_legend"),
							'legend_bar_value': d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("legend_bar_value")
						}
						color_classes.push(new_color_class);
					}
				} else if($("#date_order").val() == "inner_old"){	
					for(var f=0; f<d3.selectAll(".bar_legend_color")._groups[0].length; f++){
						var new_color_class = {
							'bdate':d3.select(d3.selectAll(".bar_legend_color")._groups[0][d3.selectAll(".bar_legend_color")._groups[0].length - 1 - f]).attr("bdate_legend"),
							'edate':d3.select(d3.selectAll(".bar_legend_color")._groups[0][d3.selectAll(".bar_legend_color")._groups[0].length - 1 - f]).attr("edate_legend"),
							'color': d3.select(d3.selectAll(".bar_legend_color")._groups[0][d3.selectAll(".bar_legend_color")._groups[0].length - 1 - f]).attr("color_legend"),
							'legend_bar_value': d3.select(d3.selectAll(".bar_legend_color")._groups[0][d3.selectAll(".bar_legend_color")._groups[0].length - 1 - f]).attr("legend_bar_value")
						}
						color_classes.push(new_color_class);
					}
				}
			} else if(legend_status == "legend_non_activated"){	
				color_classes = color_classes_array[selected_color_class];
			}
			
			
			var nb_classes = color_classes.length;
			
			event_to_keep = [];
			
			var date_min;
			var date_max;
			
			if(legend_status == "legend_activated"){
				date_min = new Date($("#dataset_start").val()).getTime();
				date_max = new Date($("#dataset_end").val()).getTime();
			} else if(legend_status == "legend_non_activated"){	
				if(selected_color_class.split("inner_old").length > 1){
					date_min = new Date(color_classes[color_classes.length - 1].bdate).getTime();
					date_max = new Date(color_classes[0].edate).getTime();
				} else {
					date_min = new Date(color_classes[0].bdate).getTime();
					date_max = new Date(color_classes[color_classes.length - 1].edate).getTime();
				}
			}
			
			
			create_histogram(date_max,date_min,data_events,nb_classes,color_classes);
		} catch (error) {
		  console.error(error);
		  // expected output: ReferenceError: nonExistentFunction is not defined
		  // Note - error messages will vary depending on browser
		}
		
		
	});

	
	
}

function create_color_legend(){
	
	$("#color_legend").html("");
	var gwidth_color_legend = $("#color_legend").width() - 10;
	var gheight_color_legend = $("#color_legend").height() -10;
	
	//create new graph for the cluster 
	var grx_color_legend = d3.scaleLinear()
			.domain([0, 100]) 
			.range([0, gwidth_color_legend]) // unit: pixels

	var gry_color_legend = d3.scaleLinear()
		.domain([0, 1]) 
		.range([0, gheight_color_legend]) // unit: pixels
		
	var svg_color_legend = d3.select("#color_legend").append("svg")
		.attr("id", "graph_color_legend")
		.attr("width", gwidth_color_legend)
		.attr("height", gheight_color_legend)
		
	var selected_color_class = $('#color_class_select').val();
	var color_classes_ini = color_scales_palettes[$("#color_palette").val()][$("#number_ofclasses").val()];
		
	var color_classes = [];
	if($("#color_order").val() == "right_order"){
		for(var t=0; t<color_classes_ini.length; t++){
			color_classes.push(color_classes_ini[t]);
		}
	} else {
		for(var t=0; t<color_classes_ini.length; t++){
			color_classes.push(color_classes_ini[color_classes_ini.length - 1 -t]);
		}
	}
	
	var x_legend;
	var width_legend;
	var color_legend;
	var id_legend_bar;
	var bdate_legend;
	var edate_legend;
	var legend_bar_value;
		
		for(var u=0; u<(parseInt($("#number_ofclasses").val())-1); u++){
			
			id_legend_bar = u;
			
			if(u == 0){
				x_legend = 0;
				width_legend = parseInt($("#range_date_selectors_slider_classes_" + u + "_to_" + (u+1) + "").val()) - x_legend;
				
				bdate_legend = $("#dataset_start").val();
				var edate_string = $("#p_date_selectors_slider_classes_" + u + "_to_" + (u+1) + "").html();
				edate_legend = edate_string.split("/")[2] + "-" + edate_string.split("/")[1] + "-" + edate_string.split("/")[0];
				
				legend_bar_value = parseInt($("#range_date_selectors_slider_classes_" + u + "_to_" + (u+1) + "").val());
			} else {
				x_legend = parseInt($("#range_date_selectors_slider_classes_" + (u-1) + "_to_" + u + "").val());
				width_legend = parseInt($("#range_date_selectors_slider_classes_" + u + "_to_" + (u+1) + "").val()) - x_legend;
				
				var bdate_string = $("#p_date_selectors_slider_classes_" + (u-1) + "_to_" + u + "").html();
				bdate_legend = bdate_string.split("/")[2] + "-" + bdate_string.split("/")[1] + "-" + bdate_string.split("/")[0];
				var edate_string = $("#p_date_selectors_slider_classes_" + u + "_to_" + (u+1) + "").html();
				edate_legend = edate_string.split("/")[2] + "-" + edate_string.split("/")[1] + "-" + edate_string.split("/")[0];
				
				legend_bar_value = parseInt($("#range_date_selectors_slider_classes_" + u + "_to_" + (u+1) + "").val()) - parseInt($("#range_date_selectors_slider_classes_" + (u-1) + "_to_" + u + "").val());
			}
			
			
			color_legend = color_classes[u];
			
			svg_color_legend.append("rect")
			.attr("class", "bar_legend_color")
			.attr("x", grx_color_legend(x_legend))
			.attr("width", grx_color_legend(width_legend))
			.attr("y", 0)
			.attr('fill', color_legend)
			.attr("height",gry_color_legend(1))
			.attr("id_legend_bar", id_legend_bar)
			.attr("bdate_legend", bdate_legend)
			.attr("edate_legend", edate_legend)
			.attr("color_legend", color_legend)
			.attr("legend_bar_value", legend_bar_value)
		}
						
		x_legend = parseInt($("#range_date_selectors_slider_classes_" + (parseInt($("#number_ofclasses").val())-2) + "_to_" + (parseInt($("#number_ofclasses").val())-1) + "").val());
		width_legend = 100 - x_legend;
		color_legend = color_classes[parseInt($("#number_ofclasses").val())-1];
		
		id_legend_bar = (parseInt($("#number_ofclasses").val())-1);
		
		var bdate_string = $("#p_date_selectors_slider_classes_" + (parseInt($("#number_ofclasses").val())-2) + "_to_" + (parseInt($("#number_ofclasses").val())-1) + "").html();
		bdate_legend = bdate_string.split("/")[2] + "-" + bdate_string.split("/")[1] + "-" + bdate_string.split("/")[0];
		edate_legend = $("#dataset_end").val()
		
		legend_bar_value = 100 - parseInt($("#range_date_selectors_slider_classes_" + (u-1) + "_to_" + u + "").val());
		
		svg_color_legend.append("rect")
		.attr("class", "bar_legend_color")
		.attr("x", grx_color_legend(x_legend))
		.attr("width", grx_color_legend(width_legend))
		.attr("y", 0)
		.attr('fill', color_legend)
		.attr("height",gry_color_legend(1))
		.attr("id_legend_bar", id_legend_bar)
		.attr("bdate_legend", bdate_legend)
		.attr("edate_legend", edate_legend)	
		.attr("color_legend", color_legend)
		.attr("legend_bar_value", legend_bar_value)
		
	
}



function handleMouseOver(d, i) {  // Add interactivity

      // Use D3 to select element, change color and size      
	  d3.select(this).style("fill", "#000000");
	  
	  
	  var color_histo =d3.select(this).attr("color_histo");
	  var color_class =d3.select(this).attr("color_class");
	  var bdate =d3.select(this).attr("bdate");
	  var edate =d3.select(this).attr("edate");
	  var actual_day = "" + d3.select(this).attr("day") + " " + d3.select(this).attr("month") + " " + d3.select(this).attr("year");
	  var number_of_cases_day = parseInt(d3.select(this).attr("number_cases_day"));
	  
	  var all_bars = d3.selectAll(".bar");
	  //console.log(d3.select(all_bars._groups[0][0]).attr("color_histo"));
	  
	  var number_of_cases_per_color = 0;
	  for(var r=0; r<all_bars._groups[0].length; r++){
		  if(d3.select(all_bars._groups[0][r]).attr("color_histo") == color_histo){
			  number_of_cases_per_color = number_of_cases_per_color + parseInt(d3.select(all_bars._groups[0][r]).attr("number_cases_day"));
		  }
	  }
	  console.log(color_histo,color_class,number_of_cases_day,number_of_cases_per_color)
	  var bar_info_html = "";
	  bar_info_html += "<div>";
	  bar_info_html += "Classe " + color_class + "";
	  bar_info_html += "</div>";
	  bar_info_html += "<div>";
	  bar_info_html += "Jour " + actual_day + "";
	  bar_info_html += "</div>";
	  bar_info_html += "<div>";
	  bar_info_html += "Début de la classe " + bdate + "";
	  bar_info_html += "</div>";
	  bar_info_html += "<div>";
	  bar_info_html += "Fin de la classe " + edate + "";
	  bar_info_html += "</div>";
	  bar_info_html += "<div>";
	  bar_info_html += "Nbr_cas_jour " + number_of_cases_day + "";
	  bar_info_html += "</div>";
	  bar_info_html += "<div>";
	  bar_info_html += "Nbr_cas_classe " + number_of_cases_per_color + "";
	  bar_info_html += "</div>";
	  $("#bar_info").html(bar_info_html);

		
    }

function handleMouseOut(d, i) {
      // Use D3 to select element, change color back to normal
	  var color_histo =d3.select(this).attr("color_histo");
      d3.select(this).style("fill", color_histo);
		$("#bar_info").html("");
	  /*
      // Select text by id and then remove
      d3.select("#t" + d.x + "-" + d.y + "-" + i).remove();  // Remove text location
	  */
    }

function handleMouseOver_selectedcluster(d, i) {  // Add interactivity

      // Use D3 to select element, change color and size      
	  d3.select(this).style("fill", "#000000");
	  
	  
	  var color_histo =d3.select(this).attr("color_histo");
	  var color_class =d3.select(this).attr("color_class");
	  var bdate =d3.select(this).attr("bdate");
	  var edate =d3.select(this).attr("edate");
	  var number_of_cases_class = parseInt(d3.select(this).attr("number_event"));
	  var number_of_cases_all = parseInt(d3.select(this).attr("number_event_all"));
	  
	  
	  var bar_info_html = "";
	  bar_info_html += "<div>";
	  bar_info_html += "Selected cluster " + number_of_cases_all + " events";
	  bar_info_html += "</div>";
	  bar_info_html += "<div>";
	  bar_info_html += "Classe " + color_class + "";
	  bar_info_html += "</div>";
	  bar_info_html += "<div>";
	  bar_info_html += "Début de la classe " + bdate + "";
	  bar_info_html += "</div>";
	  bar_info_html += "<div>";
	  bar_info_html += "Fin de la classe " + edate + "";
	  bar_info_html += "</div>";
	  bar_info_html += "<div>";
	  bar_info_html += "Nbr_cas_classe " + number_of_cases_class + "";
	  bar_info_html += "</div>";
	  $("#bar_info").html(bar_info_html);

    }

function handleMouseOut_selectedcluster(d, i) {
      // Use D3 to select element, change color back to normal
	  var color_histo =d3.select(this).attr("color_histo");
      d3.select(this).style("fill", color_histo);
		$("#bar_info").html("");

    }

	



