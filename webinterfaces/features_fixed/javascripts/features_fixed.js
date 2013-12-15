// {{{ stolen functions
//{{{ Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest); //}}}

$.fn.spin = function(opts) { //{{{ Spinner for Jquery
  this.each(function() {
    var $this = $(this),
        data = $this.data();

    if (data.spinner) {
      data.spinner.stop();
      delete data.spinner;
    }
    if (opts !== false) {
      data.spinner = new Spinner($.extend({color: $this.css('color')}, opts)).spin(this);
    }
  });
  return this;
};//}}}

}; //}}}

//{{{ Variables
var img
var canvas_imageA;
var canvas_imageB;
var ctxB;
var ctxA;
var canvas_width;
var canvas_height;
var image_name;
var category_name;

var viewportA_top_left_x = 0;
var viewportA_top_left_y = 0;
var viewportA_height;
var viewportA_width;
var max_viewportA_x;
var max_viewportA_y;

var viewport_top_left_x;
var viewport_top_left_y;
var viewport_height;
var viewport_width;
var max_viewport_x;
var max_viewport_y;

var begin_time="";

var base_url = '..';
//var base_url = 'http://restlesscat_mturk.s3.amazonaws.com';
//var base_url = ".";

//polygon coordinates
var fpoints = new Array();
var fpoint_selected = 1;

//tolerance radius
var tr=5;

//drawing styles
var linecolor = "rgba(255,0,0,0.9)";
var linewidth = 1.0;
var pt_size   = 2.0;
var pt_color  = "rgba(0,0,255,0.9)";

var is_original_image = true;

// index of the point selected
var selected_idx = -1; //}}}
  
//{{{ Utility functions
function t_distance(a_x,a_y,b_x,b_y) {
  return Math.sqrt(Math.pow(b_x-a_x,2) + Math.pow(b_y-a_y,2));
}

function pred_index(i, arr) { // get index of predecessor
  return i == 0 ? arr.length-1 : i-1;
}

function find_appropriate_edge(x_val,y_val) {
  ratios=x.map(function(elem, i) {
    return t_distance(x[i], y[i], x_val, y_val) + t_distance(x[pred_index(i,x)], y[pred_index(i,y)], x_val, y_val) - t_distance(x[i], y[i], x[pred_index(i,x)], y[pred_index(i,y)]);
  });
  smallest = ratios[0];
  i=0;
  ratios.forEach(function(elem, index) {
    if (elem < smallest) {
      smallest = elem;
      i = index;
    }
  });
  return i;
}
//}}}

function zoom_imageA(zoom){
	centerA_x = fpoints[fpoint_selected-1].x1;
    centerA_y = fpoints[fpoint_selected-1].y1;
	viewportA_height = true_image_height/zoom;
    viewportA_width = true_image_width/zoom;
    max_viewportA_x = true_image_width-viewportA_width;
    max_viewportA_y = true_image_height-viewportA_height;
	viewportA_top_left_x = centerA_x - viewportA_width/2;
    viewportA_top_left_y = centerA_y - viewportA_height/2;
    if (viewportA_top_left_x < 0) viewportA_top_left_x = 0;
    if (viewportA_top_left_y < 0) viewportA_top_left_y = 0;
    if (viewportA_top_left_x > max_viewportA_x) viewportA_top_left_x = max_viewportA_x;
    if (viewportA_top_left_y > max_viewportA_y) viewportA_top_left_y = max_viewportA_y;
}

function zoom_imageB(zoom){
	center_x = viewport_top_left_x + viewport_width/2;
    center_y = viewport_top_left_y + viewport_height/2;
	zoom_imageB_center(zoom, center_x, center_y);
}

function zoom_imageB_center(zoom, center_x, center_y){
    viewport_height = true_image_height/zoom;
    viewport_width = true_image_width/zoom;
    max_viewport_x = true_image_width-viewport_width;
    max_viewport_y = true_image_height-viewport_height;
	viewport_top_left_x = center_x - viewport_width/2;
    viewport_top_left_y = center_y - viewport_height/2;
	if (viewport_top_left_x < 0) viewport_top_left_x = 0;
    if (viewport_top_left_y < 0) viewport_top_left_y = 0;
    if (viewport_top_left_x > max_viewport_x) viewport_top_left_x = max_viewport_x;
    if (viewport_top_left_y > max_viewport_y) viewport_top_left_y = max_viewport_y;
}

function show_instructions_step(id){
	var steps = ["#step0", "#step1", "#step2", "#step3", "#step4"];
	for (var i=0; i<steps.length; i++){
		if (id != steps[i] &&  $(steps[i]).is(":visible"))  $(steps[i]).hide(100);
		if (id == steps[i] && !$(id).is(":visible"))  $(id).show(100);
	}
}

// Slider
var zoom = 1;
var options = {
  value:1,
  min: 1,
  max: 8,
  step: 0.1,
  slide: function(event, ui) {
    zoom = ui.value;
    $("#zoom").html(zoom.toFixed(1));
	if (zoom < 8.0) {
		$("#imageB_canvas").css("cursor","move");
		show_instructions_step("#step1");
	}
	if (zoom == 8.0) {
		$("#imageB_canvas").css("cursor","crosshair");
		show_instructions_step("#step2");
	}	
	zoom_imageA(zoom);
	zoom_imageB(zoom);
    draw_canvas();
  },
  change: function(event, ui) {
    zoom = ui.value;
    $("#zoom").html(zoom.toFixed(1));
	if (zoom < 8.0) {
		$("#imageB_canvas").css("cursor","move");
		show_instructions_step("#step1");
	}
	if (zoom == 8.0) {
		$("#imageB_canvas").css("cursor","crosshair");
		if (fpoints[fpoint_selected-1].x2 >= 0.0 && fpoints[fpoint_selected-1].y2 >= 0.0)
			show_instructions_step("#step3");
		else
			show_instructions_step("#step2");
	}
	
	zoom_imageA(zoom);
	draw_canvas();
  }
}//}}}

//{{{ Spinner options
var opts = {
  lines: 12, // The number of lines to draw
  length: 7, // The length of each line
  width: 4, // The line thickness
  radius: 10, // The radius of the inner circle
  color: '#000', // #rgb or #rrggbb
  speed: 1, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: false, // Whether to render a shadow
  hwaccel: false // Whether to use hardware acceleration
}; //}}}

$(document).ready(function() {
  $("#step0").hide();
  $("#step2").hide();
  $("#step3").hide();
  $("#step4").hide();
  $("#no-hint").hide();
  $("#hint").focus(function() {
    $("#no-hint").show();
    $("#hint").hide();
    $("#no-hint").focus();
  });
  $("#slider").slider(options);
  $("#zoom").html($("#slider").slider("value"));
  $("#imageB_canvas").mouseleave(mouseup_canvas);
  document.getElementById('change_contrast').disabled = true;
  
  // Events
  // Mouse Wheel
  $("#imageB_canvas").bind("mousewheel", function(event, delta) {
      if ($("#slider").slider("value") < 8.0 || delta < 0.0){
		  $("#slider").slider("value", $("#slider").slider("value") + delta * 0.4);
		  var x = (viewport_top_left_x + screen_to_viewport_x(event.pageX)*(viewport_width/canvas_width));
		  var y = (viewport_top_left_y + screen_to_viewport_y(event.pageY)*(viewport_height/canvas_height));
		  center_x = viewport_top_left_x + viewport_width/2;
		  center_y = viewport_top_left_y + viewport_height/2;
		  x = (x + 3.0*center_x)/4.0;
		  y = (y + 3.0*center_y)/4.0;
		  zoom_imageA(zoom);
		  zoom_imageB_center(zoom, x, y);
		  draw_canvas();
	  }
	  return false;
  });

  // Double Click
  $("#imageB_canvas").dblclick(function(event) {
    if ($("#slider").slider("value") == 8.0){
		var x = (viewport_top_left_x + screen_to_viewport_x(event.pageX)*(viewport_width/canvas_width));
		var y = (viewport_top_left_y + screen_to_viewport_y(event.pageY)*(viewport_height/canvas_height));
		fpoints[fpoint_selected-1].x2 = x;
		fpoints[fpoint_selected-1].y2 = y;
		draw_canvas();
		show_instructions_step("#step3");
	}
  });
  
  // WASD + Space/Enter Keys
  $(document).keydown(function(event){
    if ($("#slider").slider("value") == 8.0){
		switch (event.which) {
			case 87: fpoints[fpoint_selected-1].y2 -= 0.2; draw_canvas(); return false; // W
			case 65: fpoints[fpoint_selected-1].x2 -= 0.2; draw_canvas(); return false; // A
			case 83: fpoints[fpoint_selected-1].y2 += 0.2; draw_canvas(); return false; // S
			case 68: fpoints[fpoint_selected-1].x2 += 0.2; draw_canvas(); return false; // D
			case 13: // Enter
			case 32: // Space
				if (fpoints[fpoint_selected-1].x2 >= 0.0 && fpoints[fpoint_selected-1].y2 >= 0.0){
					fpoint_selected += 1;
					$("#status_completed").html((fpoint_selected-1)+" / "+fpoints.length+" points located");
					if (fpoint_selected <= fpoints.length){	
						zoom = 1.0;
						$("#slider").slider("value", zoom);
						zoom_imageA(zoom);
						zoom_imageB(zoom);
						draw_canvas();
					}
					else{
						show_instructions_step("#step4");
					}
				}
				return false;
		}
		draw_canvas();
	}
  });

  // {{{ Init
  initialize_fpoints();
  init_images();
  $("#status_completed").html((fpoint_selected-1)+" / "+fpoints.length+" points located");
	 
  document.getElementById('assignmentId').value = gup('assignmentId');
  // Check if the worker is PREVIEWING the HIT or if they've ACCEPTED the HIT
  if (gup('assignmentId') == "ASSIGNMENT_ID_NOT_AVAILABLE")
  {
    // If we're previewing, disable the button and give it a helpful message
    document.getElementById('submitButton').disabled = true;
    document.getElementById('submitButton').value = "You must ACCEPT the HIT before you can submit the results.";
	show_instructions_step("#step0");
	$(".row").hide();
  } else {
    var form = document.getElementById('mturk_form');
    if (document.referrer && ( document.referrer.indexOf('workersandbox') != -1) ) {
      form.action = "https://workersandbox.mturk.com/mturk/externalSubmit";
    }
  } //}}}
});


var loaded_images = 0;
function init_images(){
	img = new Image();
	imageA_img = new Image();
	imageB_img = new Image();
	var cat_img_name = get_category_image_name();
	// tokenize the category and image name based on comma
	var tokens = cat_img_name.split(',');
	category_name = tokens[0];
	imageA_name   = tokens[1];
	imageB_name   = tokens[2];
	imageA_img.src = base_url + '/' + category_name + '/' + imageA_name;
	imageB_img.src = base_url + '/' + category_name + '/' + imageB_name;
	imageA_img.onload = init_images_handler;
	imageB_img.onload = init_images_handler;
	img = imageB_img;
}

function init_images_handler(){
	loaded_images++;
	if (loaded_images == 2){
		init_canvas();
	}
}

// Original Script
function init_canvas(){//{{{ init function
  true_image_width  = imageA_img.width;
  true_image_height = imageA_img.height;
  canvas_width  = 460;
  canvas_height = (canvas_width * true_image_height/true_image_width);
  var corr_factor = canvas_width/true_image_width;
  
  //Image A
  max_viewportA_x = 0;
  max_viewportA_y = 0;
  viewportA_width  = true_image_width;
  viewportA_height = true_image_height;
  viewportA_top_left_x = 0;
  viewportA_top_left_y = 0;
  canvas_imageA = document.getElementById("imageA_canvas");
  canvas_imageA.width  = canvas_width;
  canvas_imageA.height = canvas_height;
  ctxA = canvas_imageA.getContext("2d");
  
  //Image B
  max_viewport_x = 0;
  max_viewport_y = 0;
  viewport_width  = true_image_width;
  viewport_height = true_image_height;
  viewport_top_left_x = 0;
  viewport_top_left_y = 0;
  canvas_imageB = document.getElementById("imageB_canvas");
  canvas_imageB.width       = canvas_width;
  canvas_imageB.height      = canvas_height;
  canvas_imageB.onmousedown = mousedown_canvas;
  canvas_imageB.onmousemove = mousemove_canvas;
  canvas_imageB.onmouseup   = mouseup_canvas;
  ctxB = canvas_imageB.getContext("2d");
  
  draw_canvas();
}
//}}}

function draw_canvas(){
  ctxA.clearRect(0, 0, true_image_width, true_image_height);
  ctxB.clearRect(0, 0, true_image_width, true_image_height);
  
  draw_imageA();
  draw_imageB();
  
  draw_fpointsA();
  draw_fpointsB();
}

function draw_imageB(){
	ctxB.drawImage(img, viewport_top_left_x, viewport_top_left_y, viewport_width, viewport_height, 0, 0, canvas_width, canvas_height);
}

function draw_imageA(){
	ctxA.drawImage(imageA_img, viewportA_top_left_x, viewportA_top_left_y, viewportA_width, viewportA_height, 0, 0, canvas_width, canvas_height);
}

function get_x_vp(i) {
  return image_to_viewport_x(x[i]);
}

function get_y_vp(i) {
  return image_to_viewport_y(y[i]);
}

function get_x(i) {
  return x[i];
}
function get_y(i) {
  return y[i];
}
function set_x(i, val) {
  x[i] = val;
}
function set_y(i, val) {
  y[i] = val;
}

// get bounding rectangle center x coordinate
function get_center_x(){
  total = 0;
  for(i=0; i<fpoints.length; i++){
    total += get_x(i);
  }
  return (total/fpoints.length);
}

// get bounding rectangle center y coordinate
function get_center_y(){
  total = 0;
  for(i=0; i<fpoints.length; i++){
    total += get_y(i);
  }
  return (total/fpoints.length);
}

function get_center_x_vp() {
  return image_to_viewport_x(get_center_x());
}

function get_center_y_vp() {
  return image_to_viewport_y(get_center_y());
}

function get_min_x(){
  min = 100000;
  for(i=0; i<fpoints.length; i++){
    if(get_x(i)<min)
      min = get_x(i);
  }
  return (min);
}

function get_min_x_vp() {
  return image_to_viewport_x(get_min_x());
}

function get_max_x(){
  max = -1;
  for(i=0; i<fpoints.length; i++){
    if(get_x(i)>max)
      max = get_x(i);
  }
  return (max);
}

function get_max_x_vp() {
  return image_to_viewport_x(get_max_x());
}

function get_min_y(){
  min = 100000;
  for(i=0; i<fpoints.length; i++){
    if(get_y(i)<min)
      min = get_y(i);
  }
  return (min);
}

function get_min_y_vp() {
  return image_to_viewport_y(get_min_y());
}

function get_max_y(){
  max = -1;
  for(i=0; i<fpoints.length; i++){
    if(get_y(i)>max)
      max = get_y(i);
  }
  return (max);
}

function get_max_y_vp() {
  return image_to_viewport_y(get_max_y());
}


// reset the annotation
function reset_annotation(){
  selected_idx = -1;
  fpoints = [];
  fpoint_selected = 1;
  initialize_fpoints();
  draw_canvas();
}

//change image contrast
function change_contrast(){
  if(is_original_image){
    img = flipped_img;
    is_original_image = false;
  } else{
    img = original_img;
    is_original_image = true;
  }
  draw_canvas();
}

// true if the point is close to the start
function is_close_to_start(event){
  if(fpoints.length > 0){
    var d2 = Math.pow((screen_to_image_x(event.pageX)-get_x(0)),2) + Math.pow((screen_to_image_y(event.pageY-get_y(0)), 2));
    return d2 < tr*tr;
  }else{
    return false;
  }
}

//Draw a feature point
function draw_fpoint(ctx, id, x, y){
	ctx.fillStyle = '#00f';
	ctx.fillRect(x, y, 2, 2);
	
	ctx.font="18px Verdana";
	ctx.fillStyle = '#000';
	ctx.fillText(id, x+1, y-3);
	ctx.fillText(id, x-1, y-3);
	ctx.fillText(id, x, y-3+1);
	ctx.fillText(id, x, y-3-1);
	ctx.fillStyle = '#fff';
	ctx.fillText(id, x, y-3);
}

//Draw the feature points in Image A
function draw_fpointsA(){
	var fpoint_x = image_to_viewportA_x(fpoints[fpoint_selected-1].x1);
	var fpoint_y = image_to_viewportA_y(fpoints[fpoint_selected-1].y1);
	draw_fpoint(ctxA, fpoint_selected, fpoint_x, fpoint_y);
}

//Draw the feature points in Image A
function draw_fpointsB(){
	var fpoint_x = image_to_viewport_x(fpoints[fpoint_selected-1].x2);
	var fpoint_y = image_to_viewport_y(fpoints[fpoint_selected-1].y2);
	draw_fpoint(ctxB, fpoint_selected, fpoint_x, fpoint_y);
}

// GUI input handling
// {{{ Point conversion between screen image and viewport
function viewport_to_image_x(coord) {
  return viewport_top_left_x + coord/zoom/(canvas_width/true_image_width);
}

function viewport_to_image_y(coord) {
  return viewport_top_left_y + coord/zoom/(canvas_width/true_image_width);
}

function screen_to_viewport_x(coord) {
  return coord - $('#imageB_canvas').offset().left;
}

function screen_to_viewport_y(coord) {
  return coord - $('#imageB_canvas').offset().top;
}

function screen_to_image_x(coord) {
  return viewport_to_image_x(screen_to_viewport_x(coord));
}

function screen_to_image_y(coord) {
  return viewport_to_image_y(screen_to_viewport_y(coord));
}

function image_to_viewport_x(coord) {
  return (coord-viewport_top_left_x)*zoom*(canvas_width/true_image_width);
}

function image_to_viewport_y(coord) {
  return (coord-viewport_top_left_y)*zoom*(canvas_width/true_image_width);
}

function image_to_viewportA_x(coord) {
  return (coord-viewportA_top_left_x)*zoom*(canvas_width/true_image_width);
}

function image_to_viewportA_y(coord) {
  return (coord-viewportA_top_left_y)*zoom*(canvas_width/true_image_width);
} // }}}

function mouseup_canvas(event){
  var zoom = $("#zoom").html($("#slider").slider("value"));
  if (zoom <  8.0) {
		$("#imageB_canvas").css("cursor","move");
		if ($("#step2").is(":visible")){ $("#step2").hide(100); }
		if ($("#step3").is(":visible")){ $("#step3").hide(100); }
		if ($("#step4").is(":visible")){ $("#step4").hide(100); }
		if (!$("#step1").is(":visible")){ $("#step1").show(100);}
  }
  if (zoom == 8.0) {
		$("#imageB_canvas").css("cursor","crosshair");
		if ($("#step1").is(":visible")){ $("#step1").hide(100); }
		if ($("#step3").is(":visible")){ $("#step3").hide(100); }
		if ($("#step4").is(":visible")){ $("#step4").hide(100); }
		if (!$("#step2").is(":visible")){ $("#step2").show(100);}
  }
  canvas_imageB.onmousemove=mousemove_canvas;
  draw_canvas();
  event.preventDefault();
  event.stopPropagation();
}

function mousedown_canvas(event){
  start_mouse_x=screen_to_viewport_x(event.pageX);
  start_mouse_y=screen_to_viewport_y(event.pageY);
  start_viewport_x=viewport_top_left_x;
  start_viewport_y=viewport_top_left_y;
  if (selected_idx == -1) {
    canvas_imageB.onmousemove = mousemove_drag;
    $("#imageB_canvas").css('cursor', 'hand');
  }
  else 
    $("#imageB_canvas").css('cursor', 'crosshair');
  draw_canvas();
}

function mousemove_drag(event) {
  viewport_top_left_x=start_viewport_x+(start_mouse_x-screen_to_viewport_x(event.pageX))/zoom/(canvas_width/true_image_width);
  viewport_top_left_y=start_viewport_y+(start_mouse_y-screen_to_viewport_y(event.pageY))/zoom/(canvas_width/true_image_width);
  if (viewport_top_left_x < 0) viewport_top_left_x = 0;
  if (viewport_top_left_y < 0) viewport_top_left_y = 0;
  if (viewport_top_left_x > max_viewport_x) viewport_top_left_x = max_viewport_x;
  if (viewport_top_left_y > max_viewport_y) viewport_top_left_y = max_viewport_y;
  draw_canvas();
  event.stopPropagation();
}

//update the current location of the keypoint
function mousemove_canvas(event){
  ix = screen_to_image_x(event.pageX);
  iy = screen_to_image_y(event.pageY)
  vx = screen_to_viewport_x(event.pageX);
  vy = screen_to_viewport_y(event.pageY);
  draw_canvas();
  if(begin_time == ""){
    var time = new Date();
    var hours = time.getHours();
    var minutes = time.getMinutes();
    var seconds = time.getSeconds();
    begin_time = hours+"/"+minutes+"/"+seconds;
  }
}

// functions related to AMT task
function gup(name){
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var tmpURL = window.location.href;
  var results = regex.exec( tmpURL );
  if( results == null )
    return "";
  else
    return results[1];
}

// what to submit to AMT server
function get_results_string(){
  var result = category_name + "," + imageA_name + "," + imageB_name;
  for(var i=0; i<fpoints.length; i++){
    result +=  "," + fpoints[i].id + "," + fpoints[i].x2 + "," + fpoints[i].y2;
  }
  return result;
}

// grab the results and submit to the server
function submitResults(){
  var results = get_results_string();
  var duration = getDuration();
  document.getElementById('fpoints').value = results;
  document.getElementById('duration').value = duration;
  document.forms["mturk_form"].submit();
  //alert(results);
}

function getDuration(){
  var time = new Date();
  var hours = time.getHours();
  var minutes = time.getMinutes();
  var seconds = time.getSeconds();
  var result = begin_time+"_"+hours+"/"+minutes+"/"+seconds;
  return result;
}

function get_category_image_name(){
  var cat_img_name = gup('category-imageA-imageB');
  return cat_img_name;
}

function initialize_fpoints(){
  var arg_fpointsA = gup('fpointsA');
  var tokens_fpointsA = arg_fpointsA.split(',');
  
  for(var i=0; i<tokens_fpointsA.length; i=i+3){
    fpoints.push({
		id : parseInt(tokens_fpointsA[i]),
		x1 : parseFloat(tokens_fpointsA[i+1]),
		y1 : parseFloat(tokens_fpointsA[i+2]),
		x2 : -1.0,
		y2 : -1.0,
	});
  }
}
