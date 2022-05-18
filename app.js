// ------------------- main function ------------------


//app global variables
var lat_map = 46.90296;
var lng_map = 1.90925;
var zoom_map = 6;
var map_bounds;
var map;

var absolute_max_nb_event = 0;									//used to define the height of the temporal diagram
var selected_graph_max_value = 'relative_max';					//used to define the height of the temporal diagram related to a selected glyph, according to the absolute maximum of events per day, or according to the maximum of events for this glyph
var data_events = [];											//used to store the event dataset
var legend_status = "legend_activated";							//old parameter. has to be kept with this value
var current_time_value= new Date($("#dataset_start").val());	//used for animation
var markersCluster;												//used to store the markercluster layer, used to cluster the element on the map
var event_to_keep;												//used to store the event selected from the dataset according to the dates selected in the legend interface

var focus_on = false;												//to change color of a selected extend
var start_date_focus;
var end_date_focus;
var start_date_focus_slider;
var end_date_focus_slider;
var percentage_value_start = 10;
var percentage_value_end = 30;
var list_classes;

var ante_wave = null;
var antepic = null;
var pic = null;
var postpic = null;
var post_wave = null;

//Moving the labels along with the number of classes
var nb_ofclasses_rg = document.getElementById("number_ofclasses");
$("#number_ofclasses_label").parent().css({position: 'relative'});
$("#number_ofclasses_label").css({top: -20, left: ((nb_ofclasses_rg.value-4)*$("#number_ofclasses").width()/7-30)+"px", position:'absolute'});

$("#number_ofclasses").on("input", function() {
	$("#number_ofclasses_label").css({top: -20, left: ((nb_ofclasses_rg.value-4)*$("#number_ofclasses").width()/7-25)+"px", position:'absolute'});
})



//website's elements size
$('body').height($(window).height());
$('body').width($(window).width()-10);

$('#div_color_legend').height($(window).height()*0.8);
$('#div_color_legend').width($(window).width()*0.3);

$('#animation_activation').val('animation_non_active');

//changing the height of the temporal diagram related to a selected glyph
$("#selected_graph_max_value").on("change",function() {
	selected_graph_max_value = $('#selected_graph_max_value').val();
});	

//open animation menu
$("#open_animation_menu").click(function() {
	if($("#animation_div").css("visibility") == "hidden"){
		$("#animation_div").css("visibility","visible");
	} else {
		$("#animation_div").css("visibility","hidden");
	}	
});	

//open legend menu
$("#legend_menu_button").click(function() {
	
	if($("#div_color_legend").css("visibility") == "hidden"){
		$("#div_color_legend").css("visibility","visible");
	} else {
		$("#div_color_legend").css("visibility","hidden");
	}
	
});	

//changing how the size of the ring represents the number of events (radius or area)
$("#glyph_construction_type").on("change",function() {
	update_map();
});

//changing the order of the rings position inside a glyph
$("#date_order").on("change",function() {
	update_map();
});

//updating the legend and the temporal diagram during the dynamic modification of the number of temporal classes
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

//updating the map after the dynamic modification of the number of temporal classes
$("#number_ofclasses").on("change",function() {
	create_legend_cursors(parseInt($(this).val()));
	update_map();
});


//changing the color palette for the representation of events according to their temporal component
$("#color_palette").on("change",function() {
	//$("#checkbox_focus_container").css("visibility","visible");
	$('#number_ofclasses_label').css({left : 10, top : -5});

	//test to see which is the selected color palette (some of them have been created for specific timesteps for the different time subperiods)
	if($("#color_palette").val() == "SM_Maxime_1"){
		$('#number_ofclasses').hide();
		$('#number_ofclasses').val(8);
		$('#number_ofclasses_label').html('8 classes');
		create_legend_cursors(8);
		
		//$('.range_date_selectors_slider').hide();
		$('#range_date_selectors_slider_classes_0_to_1').val(5);
		$('#range_date_selectors_slider_classes_1_to_2').val(13);
		$('#range_date_selectors_slider_classes_2_to_3').val(21);
		$('#range_date_selectors_slider_classes_3_to_4').val(29);
		$('#range_date_selectors_slider_classes_4_to_5').val(35);
		$('#range_date_selectors_slider_classes_5_to_6').val(48);
		$('#range_date_selectors_slider_classes_6_to_7').val(64);
		
		
		$('#p_date_selectors_slider_classes_0_to_1').html('18/08/2021');
		$('#p_date_selectors_slider_classes_1_to_2').html('23/08/2021');
		$('#p_date_selectors_slider_classes_2_to_3').html('28/08/2021');
		$('#p_date_selectors_slider_classes_3_to_4').html('01/09/2021');
		$('#p_date_selectors_slider_classes_4_to_5').html('05/09/2021');
		$('#p_date_selectors_slider_classes_5_to_6').html('12/09/2021');
		$('#p_date_selectors_slider_classes_6_to_7').html('25/09/2021');
	} else if($("#color_palette").val() == "SM_Maxime_2"){
		$('#number_ofclasses').hide();
		$('#number_ofclasses').val(8);
		$('#number_ofclasses_label').html('8 classes');
		create_legend_cursors(8);
		//$('.range_date_selectors_slider').hide();
		$('#range_date_selectors_slider_classes_0_to_1').val(5);
		$('#range_date_selectors_slider_classes_1_to_2').val(13);
		$('#range_date_selectors_slider_classes_2_to_3').val(21);
		$('#range_date_selectors_slider_classes_3_to_4').val(29);
		$('#range_date_selectors_slider_classes_4_to_5').val(35);
		$('#range_date_selectors_slider_classes_5_to_6').val(48);
		$('#range_date_selectors_slider_classes_6_to_7').val(64);
		
		
		$('#p_date_selectors_slider_classes_0_to_1').html('18/08/2021');
		$('#p_date_selectors_slider_classes_1_to_2').html('23/08/2021');
		$('#p_date_selectors_slider_classes_2_to_3').html('28/08/2021');
		$('#p_date_selectors_slider_classes_3_to_4').html('01/09/2021');
		$('#p_date_selectors_slider_classes_4_to_5').html('05/09/2021');
		$('#p_date_selectors_slider_classes_5_to_6').html('12/09/2021');
		$('#p_date_selectors_slider_classes_6_to_7').html('25/09/2021');
	} else if($("#color_palette").val() == "SM_Maxime_3" || $("#color_palette").val() == "SM_Maxime_4" || $("#color_palette").val() == "SM_Maxime_5"){
		$("#number_ofclasses").attr('max',12)
		$('#number_ofclasses').hide();
		$('#number_ofclasses').val(12);
		$('#number_ofclasses_label').html('12 classes');
		create_legend_cursors(12);
		//$('.range_date_selectors_slider').hide();
		$('#range_date_selectors_slider_classes_0_to_1').val(4);
		$('#range_date_selectors_slider_classes_1_to_2').val(13);
		$('#range_date_selectors_slider_classes_2_to_3').val(18);
		$('#range_date_selectors_slider_classes_3_to_4').val(22);
		$('#range_date_selectors_slider_classes_4_to_5').val(27);
		$('#range_date_selectors_slider_classes_5_to_6').val(33);
		$('#range_date_selectors_slider_classes_6_to_7').val(36);
		$('#range_date_selectors_slider_classes_7_to_8').val(48);
		$('#range_date_selectors_slider_classes_8_to_9').val(56);
		$('#range_date_selectors_slider_classes_9_to_10').val(66);
		$('#range_date_selectors_slider_classes_10_to_11').val(73);
		
		
		$('#p_date_selectors_slider_classes_0_to_1').html('18/08/2021');
		$('#p_date_selectors_slider_classes_1_to_2').html('23/08/2021');
		$('#p_date_selectors_slider_classes_2_to_3').html('26/08/2021');
		$('#p_date_selectors_slider_classes_3_to_4').html('28/08/2021');
		$('#p_date_selectors_slider_classes_4_to_5').html('31/08/2021');
		$('#p_date_selectors_slider_classes_5_to_6').html('03/09/2021');
		$('#p_date_selectors_slider_classes_6_to_7').html('05/09/2021');
		$('#p_date_selectors_slider_classes_7_to_8').html('12/09/2021');
		$('#p_date_selectors_slider_classes_8_to_9').html('17/09/2021');
		$('#p_date_selectors_slider_classes_9_to_10').html('22/09/2021');
		$('#p_date_selectors_slider_classes_10_to_11').html('26/09/2021');
	}  else if ($("#color_palette").val() == "JB_phases_vague"){
		//$("#checkbox_focus_container").css("visibility","hidden");
		$('#number_ofclasses').hide();
		$('#number_ofclasses').val(5);
		$('#number_ofclasses_label').html('5 classes');
		create_legend_cursors(5);
		$('#range_date_selectors_slider_classes_0_to_1').val(18);
		$('#range_date_selectors_slider_classes_1_to_2').val(23);
		$('#range_date_selectors_slider_classes_2_to_3').val(32);
		$('#range_date_selectors_slider_classes_2_to_3').val(48);
		
		$('#p_date_selectors_slider_classes_0_to_1').html('26/08/2021');
		$('#p_date_selectors_slider_classes_1_to_2').html('29/08/2021');
		$('#p_date_selectors_slider_classes_2_to_3').html('04/09/2021');
		$('#p_date_selectors_slider_classes_3_to_4').html('12/09/2021');

	} else if ($("#color_palette").val() == "JB_phases_vague_focus"){
		//$("#checkbox_focus_container").css("visibility","hidden");
		$('#number_ofclasses').hide();
		$('#number_ofclasses').val(5);
		$('#number_ofclasses_label').html('5 classes');
		create_legend_cursors(5);
		$('#range_date_selectors_slider_classes_0_to_1').val(18);
		$('#range_date_selectors_slider_classes_1_to_2').val(23);
		$('#range_date_selectors_slider_classes_2_to_3').val(32);
		$('#range_date_selectors_slider_classes_2_to_3').val(48);
		
		$('#p_date_selectors_slider_classes_0_to_1').html('26/08/2021');
		$('#p_date_selectors_slider_classes_1_to_2').html('29/08/2021');
		$('#p_date_selectors_slider_classes_2_to_3').html('04/09/2021');
		$('#p_date_selectors_slider_classes_3_to_4').html('12/09/2021');

	} else if ($("#color_palette").val() == "JB_phases_vague_pic"){
		//$("#checkbox_focus_container").css("visibility","hidden");
		$('#number_ofclasses').hide();
		$('#number_ofclasses').val(4);
		$('#number_ofclasses_label').html('4 classes');
		create_legend_cursors(4);
		$('#range_date_selectors_slider_classes_0_to_1').val(22);
		$('#range_date_selectors_slider_classes_1_to_2').val(33);
		$('#range_date_selectors_slider_classes_2_to_3').val(36);
		
		$('#p_date_selectors_slider_classes_0_to_1').html('28/08/2021');
		$('#p_date_selectors_slider_classes_1_to_2').html('03/09/2021');
		$('#p_date_selectors_slider_classes_2_to_3').html('08/09/2021');

	} else if ($("#color_palette").val() == "JB_multi_vagues"){
		//$("#checkbox_focus_container").css("visibility","hidden");
		$('#number_ofclasses').hide();
		$('#number_ofclasses').val(4);
		$('#number_ofclasses_label').html('4 classes');
		create_legend_cursors(4);
		$('#range_date_selectors_slider_classes_0_to_1').val(11);
		$('#range_date_selectors_slider_classes_1_to_2').val(33);
		$('#range_date_selectors_slider_classes_2_to_3').val(73);
		
		$('#p_date_selectors_slider_classes_0_to_1').html('21/08/2021');
		$('#p_date_selectors_slider_classes_1_to_2').html('03/09/2021');
		$('#p_date_selectors_slider_classes_2_to_3').html('26/09/2021');

	} else if ($("#color_palette").val() == "JB_evt_politique"){
		//$("#checkbox_focus_container").css("visibility","hidden");
		$('#number_ofclasses').hide();
		$('#number_ofclasses').val(4);
		$('#number_ofclasses_label').html('4 classes');
		create_legend_cursors(4);
		$('#range_date_selectors_slider_classes_0_to_1').val(3);
		$('#range_date_selectors_slider_classes_1_to_2').val(26);
		$('#range_date_selectors_slider_classes_2_to_3').val(36);
		
		$('#p_date_selectors_slider_classes_0_to_1').html('22/08/2021');
		$('#p_date_selectors_slider_classes_1_to_2').html('29/08/2021');
		$('#p_date_selectors_slider_classes_2_to_3').html('05/09/2021');

	} else if ($("#color_palette").val() == "JB_auto_vague"){
		detect_structural_breaks();
		$('#number_ofclasses').hide();
		$('#number_ofclasses').val(4);
		$('#number_ofclasses_label').html('4 classes');
		create_legend_cursors(4);
		$('#range_date_selectors_slider_classes_0_to_1').val(ante_wave.id*100/58);
		$('#range_date_selectors_slider_classes_1_to_2').val(pic.id*100/58);
		$('#range_date_selectors_slider_classes_2_to_3').val(post_wave.id*100/58);
		
		display_date_slider($("#range_date_selectors_slider_classes_0_to_1").val(), "p_date_selectors_slider_classes_0_to_1");
		display_date_slider($("#range_date_selectors_slider_classes_1_to_2").val(), "p_date_selectors_slider_classes_1_to_2");
		display_date_slider($("#range_date_selectors_slider_classes_2_to_3").val(), "p_date_selectors_slider_classes_2_to_3");
		//$('#p_date_selectors_slider_classes_0_to_1').html('22/08/2021');
		//$('#p_date_selectors_slider_classes_1_to_2').html('29/08/2021');
		//$('#p_date_selectors_slider_classes_2_to_3').html('05/09/2021');

	} else if ($("#color_palette").val() == "JB_auto_vague_3class"){
		detect_structural_breaks();
		$('#number_ofclasses').hide();
		$('#number_ofclasses').val(5);
		$('#number_ofclasses_label').html('5 classes');
		create_legend_cursors(5);
		$('#range_date_selectors_slider_classes_0_to_1').val(ante_wave.id*100/58);
		$('#range_date_selectors_slider_classes_1_to_2').val(antepic.id*100/58);
		$('#range_date_selectors_slider_classes_2_to_3').val(postpic.id*100/58);
		$('#range_date_selectors_slider_classes_3_to_4').val(post_wave.id*100/58);
		
		display_date_slider($("#range_date_selectors_slider_classes_0_to_1").val(), "p_date_selectors_slider_classes_0_to_1");
		display_date_slider($("#range_date_selectors_slider_classes_1_to_2").val(), "p_date_selectors_slider_classes_1_to_2");
		display_date_slider($("#range_date_selectors_slider_classes_2_to_3").val(), "p_date_selectors_slider_classes_2_to_3");
		display_date_slider($("#range_date_selectors_slider_classes_3_to_4").val(), "p_date_selectors_slider_classes_3_to_4");

	} else {
		$("#number_ofclasses").attr('max',11)
		$('#number_ofclasses').show()
		$('.range_date_selectors_slider').show()
	}
	
	create_color_legend();
	create_color_legend_focus();
	
	update_map();
});

//changing the order of the colored rings in the glyphs
$("#color_order").on("change",function() {
	create_color_legend();
	create_color_legend_focus();
	update_map();
});

// changing graphical size the punctual entities in the map
$("#cst_area").on("change",function() {	
	update_map();
});

$("#cst_area").on("input",function() {	
	$("#cst_area_label").html($("#cst_area").val());
});

// changing aggregation radius for the punctual entities in the map
$("#radius").on("change",function() {	
	update_map();
});

$("#radius").on("input",function() {	
	$("#radius_label").html($("#radius").val());
});


$("#animation_activation").on("change",function() {	
	if($("#animation_activation").val() == "animation_non_active"){
		reset_function();
		update_map();
	} else if($("#animation_activation").val() == "animation_active"){
		//set event to show
		reset_function();
	}
	
});

//uploading data
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
		create_color_legend_focus();
		update_map();
		
		map_center = [
			(map_bounds._northEast.lat + map_bounds._southWest.lat)/2,
			(map_bounds._southWest.lng + map_bounds._northEast.lng)/2
		];
		
		map.setView(map_center, 11);
		
	  };
	  reader.readAsText(file);
	  
});

$("#number_ofclasses_label").html(parseInt($("#number_ofclasses").val()) +  " classes");
$('#classes_border_selectors').html("");	
for(var nc = 0; nc<(parseInt($("#number_ofclasses").val())-1); nc++){
	create_date_selectors_slider(nc, nc + 1,  parseInt($("#number_ofclasses").val()),new Date($("#dataset_start").val()),new Date($("#dataset_end").val()));
}

// first color legend creation
create_color_legend();

// first map creation
update_map();

// ------------------- end main function ------------------


function update_map(){
	//refresh map and create new visualization according to chosen parameters
	
	var cst_area = parseInt(document.getElementById("cst_area").value)
	var agg_radius = parseInt(document.getElementById("radius").value)
	var selected_color_class = $('#color_class_select').val();
		
	var color_classes;
	
	// creation of an array of color classes object, used to define the number of events for each ring
	if(legend_status == "legend_activated"){
		color_classes = []; 
		if($("#date_order").val() == "inner_new"){
			//newest events at the center
			for(var f=0; f<d3.selectAll(".bar_legend_color")._groups[0].length; f++){
				//creating the color classes from the legend elements
				
				var bdate_day = d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("bdate_legend").split('-')[2];
				var bdate_month = d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("bdate_legend").split('-')[1];
				var bdate_year = d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("bdate_legend").split('-')[0];
				
				var edate_day = d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("edate_legend").split('-')[2];
				var edate_month = d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("edate_legend").split('-')[1];
				var edate_year = d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("edate_legend").split('-')[0];
		
				var new_bdate_day = parseInt(bdate_day) +1;
				var new_edate_day = parseInt(edate_day) +1;
				
				var new_bdate_month = parseInt(bdate_month);
				var new_edate_month = parseInt(edate_month);
				
				if(new_bdate_day == 32){
					new_bdate_day = 1;
					new_bdate_month = new_bdate_month +1;
				} else if(new_bdate_day == 29 && bdate_month == '02' ){
					new_bdate_day = 1;
					new_bdate_month = new_bdate_month +1;
				} else if(new_bdate_day == 31 && (bdate_month == '04' || bdate_month == '06' || bdate_month == '09' || bdate_month == '11')){
					new_bdate_day = 1;
					new_bdate_month = new_bdate_month +1;
				} 
				
				if(new_edate_day == 32){
					new_edate_day = 1;
					new_edate_month = new_edate_month +1;
				} else if(new_edate_day == 29 && new_edate_month == '02' ){
					new_edate_day = 1;
					new_edate_month = new_edate_month +1;
				} else if(new_edate_day == 31 && (new_edate_month == '04' || new_edate_month == '06' || new_edate_month == '09' || new_edate_month == '11')){
					new_edate_day = 1;
					new_edate_month = new_edate_month +1;
				} 
				
				var new_bdate_day_string;
				var new_edate_day_string;
				var new_bdate_month_string;
				var new_edate_month_string;
				
				if(new_bdate_day<10){
					new_bdate_day_string = '0' + new_bdate_day;
				} else {
					new_bdate_day_string = new_bdate_day;
				}
				
				if(new_edate_day<10){
					new_edate_day_string = '0' + new_edate_day;
				} else {
					new_edate_day_string = new_edate_day;
				}
				
				if(new_bdate_month<10){
					new_bdate_month_string = '0' + new_bdate_month;
				} else {
					new_bdate_month_string = new_bdate_month;
				}
				
				if(new_edate_month<10){
					new_edate_month_string = '0' + new_edate_month;
				} else {
					new_edate_month_string = new_edate_month;
				}
				
				//color class object, with begin date, end date, corresponding color, and number of days (length of the color class corresponding period)
				var new_color_class = {
					'bdate': bdate_year + '-' + new_bdate_month_string + '-' + new_bdate_day_string,
					'edate': edate_year + '-' + new_edate_month_string + '-' + new_edate_day_string,
					'color': d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("color_legend"),
					'legend_bar_value': d3.select(d3.selectAll(".bar_legend_color")._groups[0][f]).attr("legend_bar_value")
				}
				color_classes.push(new_color_class);
			}
		} else if($("#date_order").val() == "inner_old"){	
			//oldest events at the center
			for(var f=0; f<d3.selectAll(".bar_legend_color")._groups[0].length; f++){
				//creating color classes from legend elements
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
	
	
	//filtering event dataset according to the min and max date chosen in the legend interface
	for(var g=0; g<data_events.length; g++){
		var date_event = new Date(data_events[g].date)
		if(date_event.getTime()>=date_min && date_event.getTime()<=date_max){
		  event_to_keep.push(data_events[g]);
		} 
	}
  
  
	//creating new map object
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
	
	//adding basemap
	var stamenToner = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
		attribution: 'Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap',
		subdomains: 'abcd',
		minZoom: 0,
		maxZoom: 20,
		ext: 'png'
	});

	map.addLayer(stamenToner);

	//adding the markercluster layer, managing the graphic entities clustering
	markersCluster = new L.markerClusterGroup({
				maxClusterRadius: agg_radius,
				singleMarkerMode: true,
				spiderfyOnMaxZoom: false,
				iconCreateFunction: function (cluster) {
					
					//creating nb_events_by_class array, containing the number of events in each color class for each glyphs
					var nb_events_by_class = [];
					for(var i=0; i<nb_classes; i++){
					  nb_events_by_class.push(0);
					}
					cluster.getAllChildMarkers().forEach((m)=>{ 
						//counting the number of events in each color class for each glyphs, and updating the value of the corresponding elements in nb_events_by_class array
						
						var date_event = new Date(m.options.date);
						
						for(var g=0; g<nb_classes; g++){
							var date_limit_down = new Date(color_classes[g].bdate).getTime();
							var date_limit_up = new Date(color_classes[g].edate).getTime();
							if(date_event.getTime()>=date_limit_down && date_event.getTime()<=date_limit_up){
							  nb_events_by_class[g] = nb_events_by_class[g] +1;
							} 
						}
					})
					
					//creating the glyphs
					var nb_events_by_class_sum = 0 
					for(var i =0; i<nb_events_by_class.length; i++){
						nb_events_by_class_sum = nb_events_by_class_sum + nb_events_by_class[i];
					}
					var portion_done = 0;
					//the area of the entire glyph is calculated from the entire number of events
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
					
					// the different rings are created here
					// the rings are in fact the visible part of circles placed each above others
					// the outer ring is in fact the first circle created with the largest possible area/radius calculated from the entire number of events for the glyph
					// for each circle created, we substract the number of events in the corresponding time period from the number of events in the glyph
					// the inner ring is in fact the last circle created with an area/radius calculated from the rest of the number of events 
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
				spiderfyOnMaxZoom: false, showCoverageOnHover: true, zoomToBoundsOnClick: false, animate:true, animateAddingMarkers: true
			});

			
	create_histogram(date_max,date_min,data_events,nb_classes,color_classes);
			
	//add_data_to_map;	
	//TODO	
	if($("#animation_activation").val() == "animation_non_active"){
		markersCluster.clearLayers();
		var event_to_show = event_to_keep;
		load_data_to_markersCluster(event_to_show);
	} else if($("#animation_activation").val() == "animation_active"){
		//set event to show
		reset_function();
	}
	


	markersCluster.on('clusterclick', function (a) {
		//when the user click on a glyph in the map, an additionnal histogram is calculated here
		
		var nbr_jours= parseInt((date_max - date_min)/86400000 +1);
		
		var nbr_case_day_array = [];	
		var max_nb_event = 0;
		for (var j=0; j<nbr_jours; j++){
			nbr_case_day_array.push(0);
		}
		
		console.log(date_min,date_max)
			
		a.layer.getAllChildMarkers().forEach((m)=>{
			var date_event = new Date(m.options.date);
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
		});
		
			
		var nb_events_all = 0;
		for(var i=0; i<nbr_case_day_array.length; i++){
		  nb_events_all = nb_events_all + nbr_case_day_array[i];
		}
		
		
		
		$("#div_interface_graphic_container_selectedcluster").html("");
		
		var gwidth_selectedcluster = $("#div_interface_graphic_container_selectedcluster").width() - 5;
		var gheight_selectedcluster = $("#div_interface_graphic_container_selectedcluster").height() -5;
				
				
		//create new graph for the cluster 
		var grx_selectedcluster = d3.scaleLinear()
			.domain([0, nbr_jours]) 
			.range([0, gwidth_selectedcluster]) // unit: pixels

		var gry_selectedcluster;
			
		if(selected_graph_max_value	== 'relative_max'){
			gry_selectedcluster = d3.scaleLinear()
			.domain([0, max_nb_event]) 
			.range([0, gheight_selectedcluster]) // unit: pixels
		} else if(selected_graph_max_value	== 'absolute_max'){
			gry_selectedcluster = d3.scaleLinear()
			.domain([0, absolute_max_nb_event]) 
			.range([0, gheight_selectedcluster]) // unit: pixels
		}
		

		var svg_selectedcluster = d3.select("#div_interface_graphic_container_selectedcluster").append("svg")
				.attr("id", "graph_selectedcluster")
				.attr("width", gwidth_selectedcluster)
				.attr("height", gheight_selectedcluster)

		
		
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
				
			svg_selectedcluster.append("rect")
				.attr("class", "bar_selectedcluster")
				.attr("x", grx_selectedcluster(j))
				.attr("width", grx_selectedcluster(1))
				.attr("y", 0)
				.attr('fill', color_histo)
				.attr("height", gry_selectedcluster(nbr_case_day_array[j]))	
				.attr("transform", "translate(" + 0 + "," + (gheight_selectedcluster - gry_selectedcluster(nbr_case_day_array[j])) + ")")		
				.attr("bdate", bdate_bar)	
				.attr("edate", edate_bar)
				.attr("color_class", color_class_bar)
				.attr('color_histo', color_histo)
				.attr('number_event', nbr_case_day_array[j])
				.attr('number_event_all', nb_events_all)					
				.on("mouseover", handleMouseOver_selectedcluster)
				.on("mouseout", handleMouseOut_selectedcluster);
		}
		
			
	});

	map.addLayer(markersCluster);
	
	map_bounds = markersCluster.getBounds();
	
	
}

function create_histogram(date_max,date_min,data_events,nb_classes,color_classes){
	//create main temporal histogram from dataset date max and date min, events dataset, the number of classes, and the used color scale	
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
	
	absolute_max_nb_event = max_nb_event;
	
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
	//create interface cursors in legend interface according to the selected number of classes in order to modify the color legend
	
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
	create_color_legend_focus();
	
}


function create_date_selectors_slider(class_id_ante, class_id_post, number_total_of_class,dataset_start,dataset_end){
	//create interface cursors in order to modify the temporal extent of each temporal class 
	
	var id_div = "div_date_selectors_slider_classes_" + class_id_ante + "_to_" + class_id_post + "";
	var class_div = "div_date_selectors_slider";
	var id_range = "range_date_selectors_slider_classes_" + class_id_ante + "_to_" + class_id_post + "";
	var class_range = "range_date_selectors_slider";
	var id_label = "p_label_range_"+ class_id_ante + "_to_" + class_id_post + "";
	var class_label = "p_label_date_selector"
	var id_p = "p_date_selectors_slider_classes_" + class_id_ante + "_to_" + class_id_post + "";;
	var class_p = "p_date_selectors_slider";
	
	//creating html elements
	
	var html_to_input = "";
	html_to_input += "<div id=" + id_div + " class=" + class_div + " 'class_id_ante'='" + class_id_ante + "' 'class_id_post'='" + class_id_post + "' >";
	html_to_input += "<p id=" + id_label + " class=" + class_label + "> Limit classes " + (class_id_ante+1) + " - " + (class_id_post+1) + "</p>";
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

	//Moving label and date along the range input
	var rangeSlider = document.getElementById(id_range);
	var range_width = $("#" + id_range + "").width();
	$("#" + id_p + "").parent().css({position: 'relative'});
	$("#" + id_p + "").css({top: 30, left: (rangeSlider.value*range_width/100)+"px", position:'absolute'});
	$("#" + id_label + "").css({top: -5, left: (rangeSlider.value*range_width/100)+"px", position:'absolute'});

	
	
	$("#" + id_range + "").on("input", function() {
		var rangeSlider = document.getElementById(id_range);
		$("#" + id_p + "").css({top: 30, left: (rangeSlider.value*range_width/100)+"px", position:'absolute'});
		$("#" + id_label + "").css({top: -5, left: (rangeSlider.value*range_width/100)+"px", position:'absolute'});
	})

	//updating JS events

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
			create_color_legend_focus();
							
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
	//recreate new color legend according to chosen parameters
	
	$("#color_legend").html("");
	var gwidth_color_legend = $("#color_legend").width();
	var gheight_color_legend = $("#color_legend").height();
	
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
			.attr("x_legend", x_legend)
			.attr("width_legend", width_legend)
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
		.attr("x_legend", x_legend)
		.attr("width_legend", width_legend)
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

	
/*
		----------------------creation of the timelinecursor---------------
*/
var width_slider = $('#slider_div').width() -10;
var height_slider = $('#slider_div').width();

var svg2 = d3
    .select("#slider_div")
    .attr("class", "chart")
    .append("svg")
    .attr("width", width_slider)
    .attr("height", height_slider);

var time_interval = new Date($("#dataset_end").val()).getTime() - new Date($("#dataset_start").val()).getTime();
var days_interval = time_interval / (1000 * 3600 * 24);
var daydomain = [0, days_interval]
var graphicdomain = [0, width_slider]	
	

//function called when the timeline cursor is dragged
var dragged = function(e,d){
	//function allowing to convert the timeline graphical space into a temporal duration
	var scale_space_to_time =  d3.scaleLinear().domain(graphicdomain).range(daydomain);	
	//function allowing to convert a temporal duration into a graphical space on the timeline
	var scale_time_to_space =  d3.scaleLinear().domain(daydomain).range(graphicdomain);
	//updating cursor position
	if(event.x < 0){
		d3.select(this).attr("cx", d.x = 0);
	} else if(event.x > width_slider){
		d3.select(this).attr("cx", d.x = width_slider);
	} else{
		d3.select(this).attr("cx", d.x = event.x);
	}
	//calculating the date corresponding to the cursor position
	var time_offset = parseInt(scale_space_to_time(d3.select(this).attr("x")))*(1000 * 3600 * 24);
	var new_time = new Date($("#dataset_start").val()).getTime() + time_offset;
	current_time_value = new Date(new_time)
	//updating map and current time label
	var datestr = getDatestr(current_time_value);
	$('#current_date_div').html(datestr);
	
}

var drag = d3.drag()
  .on("drag", dragged);

//creation of the timeline horizontal axis
svg2
    .append("g")
    .append("rect")
    .attr("id", "slideraxis")
    .attr("width", width_slider)
    .attr("height", 2)
    .attr("x", 0)
    .attr("y", 16);
//creation of the timeline cursor
var cursor = svg2.append('circle')
    .attr("id", "slidercursor")
  .attr('cx', -2)
  .attr('cy', 16)
  .attr('r', 8)
  .attr('stroke', 'black')
  .attr('fill', '#69a3b2')
	.call(drag);




/*
	----------------------convert Javascript date in string date---------------
*/
function getDatestr() {
	var day = current_time_value.getDate();
	var month = current_time_value.getMonth() +1;
	var daystr;
	var monthstr;
	if(day<10){
		daystr = '0' + day;
	} else {
		daystr = '' + day + '';
	}
	if(month<10){
		monthstr = '0' + month;
	} else {
		monthstr = '' + month + '';
	}
	return '2021-' + monthstr + '-' + daystr;
}

/*
	----------------------animation---------------
*/
var animation_time = 1000;
var timerId = null;
var animation = false;	
$('#current_date_div').html(getDatestr(current_time_value));
$('#anim_div').html('animation : ' + animation);
$('#anim_speed').html(animation_time + ' ms per day');

function start(){
	//function allowing to convert the timeline graphical space into a temporal duration
	var scale_space_to_time =  d3.scaleLinear().domain(graphicdomain).range(daydomain);	
	//function allowing to convert a temporal duration into a graphical space on the timeline
	var scale_time_to_space =  d3.scaleLinear().domain(daydomain).range(graphicdomain);	
	if(current_time_value.getTime() < new Date($("#dataset_end").val()).getTime()){
		animation = true;
		$('#anim_div').html('animation : ' + animation);
		if (timerId !== null) {
			clearInterval(timerId);
			timerId = null;
		}
		timerId = setInterval(function(){ 
			//function launched each 'animation_time' millisecond
			if(current_time_value.getTime() == new Date($("#dataset_end").val()).getTime() || current_time_value.getTime() > (new Date($("#dataset_end").val()).getTime()-(1000 * 3600 * 24))){
				stop();
			}
			
			var old_current_time_value = new Date(current_time_value.getTime());
			//adding an other time to current time each 'animation_time' millisecond
			current_time_value.setDate(current_time_value.getDate() + 1);
			
			//updating the map and the current time label
			var datestr = getDatestr(current_time_value);
			$('#current_date_div').html(datestr);

			if($("#animation_activation").val() == "animation_non_active"){
				
			} else if($("#animation_activation").val() == "animation_active"){
				//set event to show
								
				var event_to_show = [];
				for(var g=0; g<data_events.length; g++){
					var date_event = new Date(data_events[g].date)
					if(date_event.getTime()>=old_current_time_value.getTime() && date_event.getTime()<current_time_value.getTime()){
					  event_to_show.push(data_events[g]);
					} 
				}
				load_data_to_markersCluster(event_to_show);
			}
			
			//slider update
			var time_offset = current_time_value.getTime() - new Date($("#dataset_start").val()).getTime();
			var days_offset = time_offset / (1000 * 3600 * 24);
			d3.select("#slidercursor").attr("cx", scale_time_to_space(days_offset));
				
		}, animation_time);
	} else {
		stop();
	}
	
}

function stop(){
	animation = false;
	$('#anim_div').html('animation : ' + animation);
	if (timerId !== null) {
		//stopping the animation
		clearInterval(timerId);
		timerId = null;
	}
}

function reset_function(){
	//function allowing to convert the timeline graphical space into a temporal duration
	var scale_space_to_time =  d3.scaleLinear().domain(graphicdomain).range(daydomain);	
	//function allowing to convert a temporal duration into a graphical space on the timeline
	var scale_time_to_space =  d3.scaleLinear().domain(daydomain).range(graphicdomain);	
	//stopping the animation
	stop();
	//set the current time to the first value date
	current_time_value= new Date($("#dataset_start").val());
	//updating the map and the current time label
	var datestr = getDatestr(current_time_value);
	$('#current_date_div').html(datestr);
	
	markersCluster.clearLayers();
	
	//updating slider
	var time_offset = current_time_value.getTime() - new Date($("#dataset_start").val()).getTime();
	var days_offset = time_offset / (1000 * 3600 * 24);
	d3.select("#slidercursor").attr("x", scale_time_to_space(days_offset));
}

function decrease(){
	//increasing animation_time to slow down the animation
	if(animation_time<=3000){
		animation_time = animation_time + 100;
		$('#anim_speed').html(animation_time + ' ms per day');
	}
	if(animation == true){
		start();
	} 
}

function increase(){
	//decreasing animation_time to speed up the animation
	if(animation_time>=100){
		animation_time = animation_time - 100;
		$('#anim_speed').html(animation_time + ' ms per day');
	}
	if(animation == true){
		start();
	} 
}

//initializing the control
$("#start").click(function() {
  start();
})
$("#stop").click(function() {
  stop();
})
$("#stop").click(function() {
  stop();
})
$("#reset").click(function() {
  reset_function();
})
$("#IS").click(function() {
  increase();
})
	
function load_data_to_markersCluster(list_of_event){
	
	for (var i = 0; i < list_of_event.length; i++) {
		var latLng = new L.LatLng(list_of_event[i].lat, list_of_event[i].lon);
		var marker = new L.Marker(latLng, {date: list_of_event[i].date});
		
		
		
		markersCluster.addLayer(marker);
		
	}

	
}


//Choice of a extend in the user to apply a different color on it

window.onload = update_slider_focus();
 $("#checkbox_focus").on('click', function() {
    if(this.checked) {
		focus_on = true;
		$("#slider_focus_container").css("visibility","visible");
		update_slider_focus();
		create_color_legend();
		create_color_legend_focus();
		update_map();
    } else {
		focus_on = false;
    	$("#slider_focus_container").css("visibility","hidden");
		create_color_legend();//create_legend_cursors($("#number_ofclasses").val());
		update_map();
    }
});

//Updates the limits of the legend colors according to the slider of focus
function update_slider_focus(){
     
	range = $("#range_focus")
	range.slider({
		min: 0,
		max: 100,
		values: [10, 20, 30]
	});

	range.on( "slide", function(event, ui){
		          
        mean = (range.slider('values', 0) + range.slider('values', 2))/2;

        if (ui.handleIndex === 0){
            range.slider('values', 1, mean);
        } 
      	else if (ui.handleIndex === 2){
        	range.slider('values', 1, mean);
        } 
      	else if (ui.handleIndex === 1){
        	extend = range.slider('values', 2) - range.slider('values', 0);
            range.slider('values', 0, ui.value - (extend/2));
			range.slider('values', 2, ui.value + (extend/2));
		}

		
		//create_legend_cursors($("#number_ofclasses").val());
		update_color_legend_focus();
		create_color_legend();
		create_color_legend_focus();
	});
		
	range.on("slidechange", function( event, ui ) {
		
		update_map();
	});
};

//Updates the variables that contains the slider of focus extend
function update_color_legend_focus() {

	// Get the dates corresponding to the focus extend
	range = $("#range_focus");
	dataset_start = new Date($("#dataset_start").val());
	dataset_end = new Date($("#dataset_end").val());

	percentage_value_start = parseFloat(range.slider('values', 0));
	var delta_time_start = (dataset_end.getTime() - dataset_start.getTime())*(percentage_value_start/100);
	percentage_value_end = parseFloat(range.slider('values', 2));
	var delta_time_end = (dataset_end.getTime() - dataset_start.getTime())*(percentage_value_end/100);

	start_date_focus = new Date();
	start_date_focus.setTime(dataset_start.getTime() + parseFloat(delta_time_start));
	end_date_focus = new Date();
	end_date_focus.setTime(dataset_start.getTime() + parseFloat(delta_time_end));

	//end_date_focus.setTime(dataset_start.getTime() + parseFloat(delta_time_end) + 86400000);
	//console.log(end_date_focus)
	
	var border_day_ini;
	if(start_date_focus.getDate()<10) {
		border_day_ini = "0" + start_date_focus.getDate()
	} else {
		border_day_ini = "" + start_date_focus.getDate() + ""
	}
	var border_month_ini;
	if((start_date_focus.getMonth() + 1)<10) {
		border_month_ini = "0" + (start_date_focus.getMonth() + 1)
	} else {
		border_month_ini = "" + (start_date_focus.getMonth() + 1) + ""
	}
	var border_year_ini = start_date_focus.getFullYear();
	
	start_date_focus_slider = "" + border_year_ini + "-" + border_month_ini + "-" + border_day_ini;

	var border_day_ini;
	if(end_date_focus.getDate()<10){
		border_day_ini = "0" + end_date_focus.getDate()
	} else {
		border_day_ini = "" + end_date_focus.getDate() + ""
	}
	var border_month_ini;
	if((end_date_focus.getMonth() + 1)<10){
		border_month_ini = "0" + (end_date_focus.getMonth() + 1)
	} else {
		border_month_ini = "" + (end_date_focus.getMonth() + 1) + ""
	}
	var border_year_ini = end_date_focus.getFullYear();
	end_date_focus_slider = "" + border_year_ini + "-" + border_month_ini + "-" + border_day_ini;

	start_focus = $( "#start_focus" );
	end_focus = $( "#end_focus" );
	start_focus.html(start_date_focus_slider);
	end_focus.html(end_date_focus_slider);

	//Moving the labels along with the number of classes
	//$("#start_focus").parent().css({position: 'relative'});
	$("#start_focus").css({left: ($("#range_focus").slider('values',0)*$("#range_focus").width()/100-30)+"px", position:'absolute'});
	$("#end_focus").css({left: ($("#range_focus").slider('values',2)*$("#range_focus").width()/100-30)+"px", position:'absolute'});

	$("#range_focus").on("input", function() {
		$("#start_focus").css({left: ($("#range_focus").slider('values',0)*$("#range_focus").width()/100-30)+"px", position:'absolute'});
		$("#end_focus").css({left: ($("#range_focus").slider('values',2)*$("#range_focus").width()/100-30)+"px", position:'absolute'});
	})

}

$("#number_ofclasses").on("change",function() {
	update_slider_focus();
});


//Gets the focus slider extend and the palette chosen to apply colors of focus within the initial palette
function create_color_legend_focus() {

	if (focus_on) {
		list_classes_ini = []
	
		var rectangles = d3.selectAll(".bar_legend_color");
		c=0;
		rectangles.each(function(d,i) {
			rect = {
				id : c,
				start : parseFloat(d3.select(this).attr('x_legend')),
				end : parseFloat(d3.select(this).attr('x_legend')) + parseFloat(d3.select(this).attr('width_legend')),
				bdate : d3.select(this).attr('bdate_legend'),
				edate : d3.select(this).attr('edate_legend'),
				color : d3.select(this).attr('color_legend')
			}
			list_classes_ini.push(rect)
			c++;
		});
		
	
		$("#color_legend").html("");
		var gwidth_color_legend = $("#color_legend").width();
		var gheight_color_legend = $("#color_legend").height();
		
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

		list_classes = []
		console.log(list_classes_ini)
		for (i=0; i<list_classes_ini.length; i++){
			if (list_classes_ini[i].start <= percentage_value_start && list_classes_ini[i].end >= percentage_value_start || list_classes_ini[i].start <= percentage_value_end && list_classes_ini[i].end >= percentage_value_end){
				//focus limit inside class
				
				if(list_classes_ini[i].start <= percentage_value_start && list_classes_ini[i].end >= percentage_value_start && list_classes_ini[i].end < percentage_value_end){
					//start in
					console.log("ok")
					if(list_classes_ini[i].start == percentage_value_start){
						//start equal to class begin
						// 1 focus color
						var color;
						if($("#color_order").val() == "right_order"){
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][i];
						} else {
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][list_classes_ini.length - i -1]
						}
						var rect_classe1 = {
							id : 100,
							start : list_classes_ini[i].start,
							end : list_classes_ini[i].end,
							bdate : list_classes_ini[i].bdate,
							edate : list_classes_ini[i].edate,
							color : color
						};
						list_classes.push(rect_classe1);
					
					} else if(list_classes_ini[i].end <= percentage_value_start){
						//start equal to class end
						// 1 normal color
						var rect_classe1 = {
							id: 100,
							start : list_classes_ini[i].start,
							end : list_classes_ini[i].end,
							bdate : list_classes_ini[i].bdate,
							edate: list_classes_ini[i].edate,
							color : list_classes_ini[i].color
						}
						list_classes.push(rect_classe1);
					
					} else {
						//start between class begin and class end
						// 2 colors, 1 normal 1 focus 
						
						var rect_classe1 = {
							id: 100,
							start : list_classes_ini[i].start,
							end : percentage_value_start,
							bdate : list_classes_ini[i].bdate,
							edate: start_date_focus_slider,
							color : list_classes_ini[i].color
						}
						var color;
						if($("#color_order").val() == "right_order"){
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][i];
						} else {
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][list_classes_ini.length - i -1]
						}
						var rect_classe2 = {
							id : 100,
							start : percentage_value_start,
							end : list_classes_ini[i].end,
							bdate : start_date_focus_slider,
							edate : list_classes_ini[i].edate,
							color : color
						};
						list_classes.push(rect_classe1,rect_classe2);
					
					}
					
				} else if(list_classes_ini[i].start > percentage_value_start && list_classes_ini[i].start <= percentage_value_end && list_classes_ini[i].end >= percentage_value_end){
					//end in
					
					if(list_classes_ini[i].start == percentage_value_end){
						//end equal to class begin
						// 1 normal class 
						var rect_classe1 = {
							id: 100,
							start : list_classes_ini[i].start,
							end : list_classes_ini[i].end,
							bdate : list_classes_ini[i].bdate,
							edate: list_classes_ini[i].edate,
							color : list_classes_ini[i].color
						}
						list_classes.push(rect_classe1);
					
					} else if(list_classes_ini[i].end == percentage_value_end){
						//end equal to class end
						// 1 focus class 
						var color;
						if($("#color_order").val() == "right_order"){
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][i];
						} else {
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][list_classes_ini.length - i -1]
						}
						var rect_classe1 = {
							id : 100,
							start : list_classes_ini[i].start,
							end : list_classes_ini[i].end,
							bdate : list_classes_ini[i].bdate,
							edate : list_classes_ini[i].edate,
							color : color
						};
						list_classes.push(rect_classe1);
					
					} else {
						//end between class begin and class end
						// 2 colors, 1 focus 1 normal 
						var color;
						if($("#color_order").val() == "right_order"){
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][i];
						} else {
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][list_classes_ini.length - i -1]
						}
						var rect_classe1 = {
							id : 100,
							start : list_classes_ini[i].start,
							end : percentage_value_end,
							bdate : list_classes_ini[i].bdate,
							edate : end_date_focus_slider,
							color : color
						};
						var rect_classe2 = {
							id: 100,
							start : percentage_value_end,
							end : list_classes_ini[i].end,
							bdate : end_date_focus_slider,
							edate: list_classes_ini[i].edate,
							color : list_classes_ini[i].color
						}
						list_classes.push(rect_classe1,rect_classe2);
					
					}
					
				} else if(list_classes_ini[i].start <= percentage_value_start && list_classes_ini[i].end >= percentage_value_start && list_classes_ini[i].start <= percentage_value_end && list_classes_ini[i].end >= percentage_value_end){
					//start and end in
					
					if(list_classes_ini[i].start == percentage_value_start && list_classes_ini[i].end != percentage_value_end){
						//start equal to class begin and end before class end
						// 2 colors, 1 focus 1 normal 
						var color;
						if($("#color_order").val() == "right_order"){
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][i];
						} else {
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][list_classes_ini.length - i -1]
						}
						var rect_classe1 = {
							id : 100,
							start : list_classes_ini[i].start,
							end : percentage_value_end,
							bdate : list_classes_ini[i].bdate,
							edate : end_date_focus_slider,
							color : color
						};
						var rect_classe2 = {
							id: 100,
							start : percentage_value_end,
							end : list_classes_ini[i].end,
							bdate : end_date_focus_slider,
							edate: list_classes_ini[i].edate,
							color : list_classes_ini[i].color
						}
						list_classes.push(rect_classe1,rect_classe2);
					
					} else if(list_classes_ini[i].start != percentage_value_start && list_classes_ini[i].end == percentage_value_end){
						//end equal to class end and start after class start
						// 2 colors, 1 normal 1 focus 
						
						var rect_classe1 = {
							id: 100,
							start : list_classes_ini[i].start,
							end : percentage_value_start,
							bdate : list_classes_ini[i].bdate,
							edate: start_date_focus_slider,
							color : list_classes_ini[i].color
						}
						var color;
						if($("#color_order").val() == "right_order"){
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][i];
						} else {
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][list_classes_ini.length - i -1]
						}
						var rect_classe2 = {
							id : 100,
							start : percentage_value_start,
							end : list_classes_ini[i].end,
							bdate : start_date_focus_slider,
							edate : list_classes_ini[i].edate,
							color : color
						};
						list_classes.push(rect_classe1,rect_classe2);
					
					} else if(list_classes_ini[i].start == percentage_value_start && list_classes_ini[i].end == percentage_value_end){
						//start equal to start begin and end equal to class end
						// 1 focus color
						
						var color;
						if($("#color_order").val() == "right_order"){
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][i];
						} else {
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][list_classes_ini.length - i -1]
						}
						var rect_classe1 = {
							id : 100,
							start : list_classes_ini[i].start,
							end : list_classes_ini[i].end,
							bdate : list_classes_ini[i].bdate,
							edate : list_classes_ini[i].edate,
							color : color
						};
						list_classes.push(rect_classe1);
					
					} else {
						//start and end between class begin and class end
						// 3 color, 1 normal 1 focus 1 normal
						
						var rect_classe1 = {
							id: 100,
							start : list_classes_ini[i].start,
							end : percentage_value_start,
							bdate : list_classes_ini[i].bdate,
							edate: start_date_focus_slider,
							color : list_classes_ini[i].color
						}
						
						var color;
						if($("#color_order").val() == "right_order"){
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][i];
						} else {
							color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][list_classes_ini.length - i -1]
						}
						var rect_classe2 = {
							id : 100,
							start : percentage_value_start,
							end : percentage_value_end,
							bdate : start_date_focus_slider,
							edate : end_date_focus_slider,
							color : color
						};
						
						var rect_classe3 = {
							id : 100,
							start : percentage_value_end,
							end : list_classes_ini[i].end,
							bdate : end_date_focus_slider,
							edate : list_classes_ini[i].edate,
							color : list_classes_ini[i].color
						};
						
						list_classes.push(rect_classe1,rect_classe2,rect_classe3);
					
					}
				}
				
			} else {
				//focus limit outside class
				if(list_classes_ini[i].start > percentage_value_start && list_classes_ini[i].end < percentage_value_end){
					//inside focus
					// 1 focus color
					var color;
					if($("#color_order").val() == "right_order"){
						color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][i];
					} else {
						color = color_scales_palettes[$("#color_palette").val().concat('_inverse')][$("#number_ofclasses").val()][list_classes_ini.length - i -1]
					}
					var rect_classe1 = {
						id : 100,
						start : list_classes_ini[i].start,
						end : list_classes_ini[i].end,
						bdate : list_classes_ini[i].bdate,
						edate : list_classes_ini[i].edate,
						color : color
					};
					list_classes.push(rect_classe1);
					
				} else {
					//outsite focus
					// 1 normal color
					
					var rect_classe1 = {
						id : 100,
						start : list_classes_ini[i].start,
						end : list_classes_ini[i].end,
						bdate : list_classes_ini[i].bdate,
						edate : list_classes_ini[i].edate,
						color : list_classes_ini[i].color
					};
					list_classes.push(rect_classe1);
					
				}

			}
			
		}
		
		console.log(list_classes)
	
		//Drawing the rectangles in the color_legend
		for (i=0; i<list_classes.length; i++){
			svg_color_legend.append("rect")
				.attr("class", "bar_legend_color")
				.attr("x", grx_color_legend(list_classes[i].start))
				.attr("width", grx_color_legend(list_classes[i].end - list_classes[i].start))
				.attr("x_legend", list_classes[i].start)
				.attr("width_legend", list_classes[i].end)
				.attr("y", 0)
				.attr('fill', list_classes[i].color)
				.attr("height",gry_color_legend(1))
				.attr("id_legend_bar", list_classes[i].id)
				.attr("bdate_legend", list_classes[i].bdate)
				.attr("edate_legend", list_classes[i].edate)
				.attr("color_legend", list_classes[i].color)
				.attr("legend_bar_value", 100 - list_classes[i].start)
		}
		
		
	}

	
}


function detect_structural_breaks() {
	graph_histo = d3.selectAll(".bar");
	histo = []
	c = 0
	graph_histo.each(function () {
		bar = {
			id : c,
			height : parseFloat(d3.select(this).attr('height'))
		}
		histo.push(bar);
		c++;
	
	})

	var borders_antewave = [];
	var borders_postwave = [];
	var borders_antepic = [];
	var borders_postpic = [];
	
	for (i=1; i<histo.length; i++){
		delta = (histo[i].height / histo[i-1].height -1)*100;
		if (delta > 100 && delta < 10000) {							//delta = 100 if the number of positive cases doubles
			borders_antewave.push({id:histo[i].id, height : histo[i].height, delta: delta});
		}
	}
	
	/*let max_delta = Math.max.apply(Math,borders_antewave.map(function(o){return o.delta;}));
	ante_wave = borders_antewave.find(function(o){ return o.delta == max_delta; });*/
	ante_wave = borders_antewave[0];
	
	for (i=ante_wave.id; i<histo.length; i++){
		if (histo[ante_wave.id - 1].height > histo[i].height){
			borders_postwave.push({id:histo[i].id, height : histo[i].height});
		}
	}
	post_wave = borders_postwave[0]

	let max_height = Math.max.apply(Math,histo.map(function(o){return o.height;}))
	pic = histo.find(function(o){ return o.height == max_height; });

	/*id_pic = parseInt((ante_wave.id + post_wave.id)/2);
	pic = histo.find(function(o){ return o.id == id_pic; });*/

	for (i=ante_wave.id; i<post_wave.id; i++){
		if(histo[i].height > 0.85*pic.height){
			console.log(borders_antepic)
			borders_antepic.push(histo[i])
		}
	}
	antepic = borders_antepic[0];

	for (i=pic.id; i<post_wave.id; i++){
		if (histo[antepic.id - 1].height > histo[i].height){
			borders_postpic.push({id:histo[i].id, height : histo[i].height});
		}
	}
	postpic = borders_postpic[0]

}

function display_date_slider(slider_val, id) {
	var dataset_start = new Date($("#dataset_start").val());
	var dataset_end = new Date($("#dataset_end").val());
	
	var delta_time = (dataset_end.getTime() - dataset_start.getTime())*(slider_val/100);
	var border_date = new Date();
	border_date.setTime(dataset_start.getTime() + parseInt(delta_time));
	
	var border_day;
	if(border_date.getDate()<10){border_day = "0" + border_date.getDate()}else{border_day = "" + border_date.getDate() + ""}
	var border_month;
	if((border_date.getMonth() + 1)<10){border_month = "0" + (border_date.getMonth() + 1)}else{border_month = "" + (border_date.getMonth() + 1) + ""}
	var border_year = border_date.getFullYear();
	
	$("#" + id + "").html("" + border_day + "/" + border_month + "/" + border_year);
}