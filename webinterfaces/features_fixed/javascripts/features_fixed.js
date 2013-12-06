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

function correspondence_table_print() {
  str = "<table id='ctable' class='table table-condensed table striped'>";
  str += "<tr><th>ID</th><th>x1</th><th>y1</th><th>x2</th><th>y2</th><th>error</th><th>&nbsp</th></tr>"
  for (var i=0; i<fpoints.length; i++) {
    c_index = i*4;
    str += "<tr class='value' id='"+(i+1)+"'><td>"+(i+1)+"</td><td>"+fpoints[i].x1.toFixed(2)+"</td><td>"+fpoints[i].y1.toFixed(2)+"</td><td>"+fpoints[i].x2.toFixed(2)+"</td><td>"+fpoints[i].y2.toFixed(2)+"</td><td>0.00</td><td><span id='icons"+(i+1)+"'></span></td></tr>";
  }
  str += "</table>";
  $(".ctablediv").html(str);
}

function correspondence_table_update_selected(i) {
  $("#ctable #"+fpoint_selected).css("background", "");
  $("#ctable #"+fpoint_selected+" td #icons"+fpoint_selected).html("<i class='icon-ok'></i>");
  fpoint_selected = i;
  $("#ctable #"+fpoint_selected).css("background", "#f5f5f5");
  $("#ctable #"+fpoint_selected+" td #icons"+fpoint_selected).html("<i class='icon-star'></i>");
}

  
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

//{{{ Slider
var zoom = 1;
var options = {
  value:1,
  min: 1,
  max: 4,
  step: 0.1,
  slide: function(event, ui) {
    zoom = ui.value;
    $("#zoom").html(zoom);
    viewport_height = true_image_height/zoom;
    viewport_width = true_image_width/zoom;
    max_viewport_x = true_image_width-viewport_width;
    max_viewport_y = true_image_height-viewport_height;
    draw_canvas();
  },
  change: function(event, ui) {
    zoom = ui.value;
    $("#zoom").html(zoom);
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
  $("#slider, #imageB_canvas").bind("mousewheel", function(event, delta) {
    $("#slider").slider("value", $("#slider").slider("value") + delta * 0.1);
    center_x = viewport_top_left_x + viewport_width/2;
    center_y = viewport_top_left_y + viewport_height/2;
    viewport_height = true_image_height/zoom;
    viewport_width = true_image_width/zoom;
    max_viewport_x = true_image_width-viewport_width;
    max_viewport_y = true_image_height-viewport_height;
    viewport_top_left_x = center_x - viewport_width/2;
    viewport_top_left_y = center_y - viewport_height/2;
    if (viewport_top_left_x < 0)
      viewport_top_left_x = 0;
    if (viewport_top_left_y < 0)
      viewport_top_left_y = 0;
    if (viewport_top_left_x > max_viewport_x)
      viewport_top_left_x = max_viewport_x;
    if (viewport_top_left_y > max_viewport_y)
      viewport_top_left_y = max_viewport_y;
    draw_canvas();
    return false;
  });

  //{{{ Insert Node ond dblclick
  $("#imageB_canvas").dblclick(function(event) {
  	var x = (viewport_top_left_x + screen_to_viewport_x(event.pageX)*(viewport_width/canvas_width));
	var y = (viewport_top_left_y + screen_to_viewport_y(event.pageY)*(viewport_height/canvas_height));
	var min = Infinity;
	var minID = 0;
	for(var i=0; i<fpoints.length; i++){
		if (t_distance(x, y, fpoints[i].x2, fpoints[i].y2) < min){
			min = t_distance(x, y, fpoints[i].x2, fpoints[i].y2);
			minID = i;
		}
	}
	fpoints[minID].x2 = x;
	fpoints[minID].y2 = y;
	draw_canvas();
	correspondence_table_print();
	correspondence_table_update_selected(fpoint_selected);
  });

  // {{{ Init
  initialize_fpoints();
  correspondence_table_print();
  correspondence_table_update_selected(fpoint_selected);
  init_canvas();
  
  // Events
  $('#ctable tr').click(function (event) {
	correspondence_table_update_selected($(this).attr('id'));
  });
	 
  document.getElementById('assignmentId').value = gup('assignmentId');
  // Check if the worker is PREVIEWING the HIT or if they've ACCEPTED the HIT
  if (gup('assignmentId') == "ASSIGNMENT_ID_NOT_AVAILABLE")
  {
    // If we're previewing, disable the button and give it a helpful message
    document.getElementById('submitButton').disabled = true;
    document.getElementById('submitButton').value = "You must ACCEPT the HIT before you can submit the results.";
  } else {
    var form = document.getElementById('mturk_form');
    if (document.referrer && ( document.referrer.indexOf('workersandbox') != -1) ) {
      form.action = "http://workersandbox.mturk.com/mturk/externalSubmit";
    }
  } //}}}
});

//{{{ Original Script
function init_canvas(){//{{{ init function
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
  img = imageB_img;
  true_image_width  = imageA_img.width;
  true_image_height = imageA_img.height;
  viewport_width  = true_image_width;
  viewport_height = true_image_height;
  canvas_width  = 460;
  canvas_height = (canvas_width * viewport_height/viewport_width);
  var corr_factor = canvas_width/true_image_width;
  max_viewport_x = 0;
  max_viewport_y = 0;
  viewport_top_left_x = 0;
  viewport_top_left_y = 0;
  
  canvas_imageA = document.getElementById("imageA_canvas");
  canvas_imageA.width       = canvas_width;
  canvas_imageA.height      = canvas_height;
  //canvas_imageA.onmousedown = mousedown_canvas;
  //canvas_imageA.onmousemove = mousemove_canvas;
  //canvas_imageA.onmouseup   = mouseup_canvas;
  ctxA = canvas_imageA.getContext("2d");
  
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
	var w = imageA_img.width;
	var h = imageA_img.height;
	ctxA.drawImage(imageA_img, viewport_top_left_x, viewport_top_left_y, viewport_width, viewport_height, 0, 0, canvas_width, canvas_height);

	//Draw white viewport rectangle
	/*ctxA.strokeStyle = "white";
	ctxA.lineWidth = 2.0;
	ctxA.beginPath();
	ctxA.moveTo(viewport_top_left_x*(canvas_width/w) , viewport_top_left_y*(canvas_width/w));
	ctxA.lineTo(viewport_top_left_x*(canvas_width/w) + viewport_width*(canvas_width/w), viewport_top_left_y*(canvas_width/w));
	ctxA.lineTo(viewport_top_left_x*(canvas_width/w) + viewport_width*(canvas_width/w), viewport_top_left_y*(canvas_width/w) + viewport_height*(canvas_width/w));
	ctxA.lineTo(viewport_top_left_x*(canvas_width/w), viewport_top_left_y*(canvas_width/w) + viewport_height*(canvas_width/w));
	ctxA.lineTo(viewport_top_left_x*(canvas_width/w), viewport_top_left_y*(canvas_width/w));
	ctxA.stroke();*/
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
  correspondence_table_print();
  correspondence_table_update_selected(fpoint_selected);
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

// returns the index of the point close to the current one (within tr) {{{
function get_closest_point_idx(event){
  vx=screen_to_viewport_x(event.pageX);
  vy=screen_to_viewport_y(event.pageY);
  var idx = -1;
  var min_dist = 100000000;
  for(var i=0;i<fpoints.length;i++){
    var d2 = (vx-get_x_vp(i))*(vx-get_x_vp(i)) + (vy-get_y_vp(i))*(vy-get_y_vp(i));
    if(d2 < min_dist){
      min_dist = d2;
      idx = i;
    }
  }
  if(min_dist < tr*tr){
    return idx;
  }
  else if((vx-get_center_x_vp())*(vx-get_center_x_vp()) + (vy-get_center_y_vp())*(vy-get_center_y_vp()) < tr*tr){
    return -2;
  }
  else if((vx-(get_max_x_vp()+10))*(vx-(get_max_x_vp()+10)) + (vy-get_center_y_vp())*(vy-get_center_y_vp()) < tr*tr){
    return -3;
  }
  else if((vx-(get_min_x_vp()-10))*(vx-(get_min_x_vp()-10)) + (vy-get_center_y_vp())*(vy-get_center_y_vp()) < tr*tr){
    return -4;
  }
  else if((vx-get_center_x_vp())*(vx-get_center_x_vp()) + (vy-(get_max_y_vp()+10))*(vy-(get_max_y_vp()+10)) < tr*tr){
    return -5;
  }
  else if((vx-get_center_x_vp())*(vx-get_center_x_vp()) + (vy-(get_min_y_vp()-10))*(vy-(get_min_y_vp()-10)) < tr*tr){
    return -6;
  }
  else{
    return -1;
  }
}
//}}}

//Draw a feature point
function draw_fpoint(ctx, id, x, y){
	ctx.fillStyle = '#00f';
	ctx.fillRect(x, y, 2, 2);
	ctx.fillStyle = '#00f';
	ctx.fillText(id+1, x, y-3);
}

//Draw the feature points in Image A
function draw_fpointsA(){
	for(var i=0; i<fpoints.length; i++){
		var fpoint_x = image_to_viewport_x(fpoints[i].x1);
		var fpoint_y = image_to_viewport_y(fpoints[i].y1);
		draw_fpoint(ctxA, i, fpoint_x, fpoint_y);
	} 
}

//Draw the feature points in Image A
function draw_fpointsB(){
	for(var i=0; i<fpoints.length; i++){
		var fpoint_x = image_to_viewport_x(fpoints[i].x2);
		var fpoint_y = image_to_viewport_y(fpoints[i].y2);
		draw_fpoint(ctxB, i, fpoint_x, fpoint_y);
	} 
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
} // }}}

function mouseup_canvas(event){
  $("#imageB_canvas").css('cursor', 'default');
  canvas_imageB.onmousemove=mousemove_canvas;
  event.preventDefault();
  event.stopPropagation();
  /*if(polygon_is_closed){
    selected_idx = -1;
  }else{
    if(is_close_to_start(event)){
      polygon_is_closed = true;
      selected_idx = -1;
    }else{
      set_x(fpoints.length,screen_to_image_x(event.pageX));
      set_y(fpoints.length,screen_to_image_y(event.pageY));
      fpoints.length = fpoints.length + 1;
      draw_canvas();
    }
  }*/
}

function mousedown_canvas(event){
  /*selected_idx = get_closest_point_idx(event);*/
  start_mouse_x=screen_to_viewport_x(event.pageX);
  start_mouse_y=screen_to_viewport_y(event.pageY);
  start_viewport_x=viewport_top_left_x;
  start_viewport_y=viewport_top_left_y;
  /*orig_x = x.slice();
  orig_y = y.slice();*/
  if (selected_idx == -1) {
    canvas_imageB.onmousemove = mousemove_drag;
    $("#imageB_canvas").css('cursor', 'hand');
  }
  else 
    $("#imageB_canvas").css('cursor', 'crosshair');
  event.preventDefault();
}

function mousemove_drag(event) {
  viewport_top_left_x=start_viewport_x+(start_mouse_x-screen_to_viewport_x(event.pageX))/zoom/(canvas_width/true_image_width);
  viewport_top_left_y=start_viewport_y+(start_mouse_y-screen_to_viewport_y(event.pageY))/zoom/(canvas_width/true_image_width);
  if (viewport_top_left_x < 0)
    viewport_top_left_x = 0;
  if (viewport_top_left_y < 0)
    viewport_top_left_y = 0;
  if (viewport_top_left_x > max_viewport_x)
    viewport_top_left_x = max_viewport_x;
  if (viewport_top_left_y > max_viewport_y)
    viewport_top_left_y = max_viewport_y;
  event.stopPropagation();
  draw_canvas();
}

//update the current location of the keypoint
function mousemove_canvas(event){
  ix = screen_to_image_x(event.pageX);
  iy = screen_to_image_y(event.pageY)
  vx = screen_to_viewport_x(event.pageX);
  vy = screen_to_viewport_y(event.pageY);

  /*if(polygon_is_closed && selected_idx >= 0){
    x[selected_idx]=ix;
    y[selected_idx]=iy;
  } else if(polygon_is_closed && selected_idx == -2){
    distance_x = (start_mouse_x-vx)/zoom/(canvas_width/true_image_width);
    distance_y = (start_mouse_y-vy)/zoom/(canvas_width/true_image_width);
    move_polygon(distance_x,distance_y);
  } else if(polygon_is_closed && selected_idx == -3){
    distance = ix-get_max_x()-5;
    stretch_polygon(distance,-3);
  } else if(polygon_is_closed && selected_idx == -4){
    distance = ix-get_min_x()+5;
    stretch_polygon(distance,-4);
  } else if(polygon_is_closed && selected_idx == -5){
    distance = iy-get_max_y()-5;
    stretch_polygon(distance,-5);
  } else if(polygon_is_closed && selected_idx == -6){
    distance = iy-get_min_y()+5;
    stretch_polygon(distance,-6);
  }*/
  draw_canvas();
  if(begin_time == ""){
    var time = new Date();
    var hours = time.getHours();
    var minutes = time.getMinutes();
    var seconds = time.getSeconds();
    begin_time = hours+"/"+minutes+"/"+seconds;
  }
  event.preventDefault();
}

function move_polygon(distance_x,distance_y){
  for(var i=0;i<fpoints.length;i++){
    x[i]=orig_x[i]-distance_x;
    y[i]=orig_y[i]-distance_y;
  }
}

function stretch_polygon(distance, direction){
  var center_x = get_center_x();
  var center_y = get_center_y();
  var min_x = get_min_x();
  var max_x = get_max_x();
  var min_y = get_min_y();
  var max_y = get_max_y();
  var x_span = max_x-min_x;
  var y_span = max_y-min_y;
  if(direction == -3){ // right
    for(i=0; i<fpoints.length; i++){
      var current = get_x(i);
      if (x_span==0) {
        x_span=0.1;
        var scale_factor = 1;
      }
      else
        var scale_factor = (current-min_x)/x_span;
      x[i]=current+distance*scale_factor;
    }
  } else if(direction == -4){ // left
    for(i=0; i<fpoints.length; i++){
      var current = get_x(i);
      if (x_span==0){
        x_span=0.1;
        var scale_factor = 1;
      }
      else
        var scale_factor = (max_x-current)/x_span;
      x[i]=current+distance*scale_factor;
    }
  } else if(direction == -5){ // up
    for(i=0; i<fpoints.length; i++){
      var current = get_y(i);
      if (y_span==0) {
        y_span=0.1;
        var scale_factor = 1;
      }
      else
        var scale_factor = (current-min_y)/y_span;
      y[i]=current+distance*scale_factor;
    }
  } else if(direction == -6){ // down
    for(i=0; i<fpoints.length; i++){
      var current = get_y(i);
      if (y_span==0) {
        y_span=0.1;
        var scale_factor = 1;
      }
      else
        var scale_factor = (max_y-current)/y_span;
      y[i]=current+distance*scale_factor;
    }
  }
  console.log(distance*scale_factor);
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
    result +=  "," + fpoints[i].x2 + "," + fpoints[i].y2;
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
  var arg_fpointsB = gup('fpointsB');
  var tokens_fpointsA = arg_fpointsA.split(',');
  var tokens_fpointsB = arg_fpointsB.split(',');
  
  for(var i=0; i<tokens_fpointsA.length; i=i+2){
    fpoints.push({
		x1 : parseFloat(tokens_fpointsA[i]),
		y1 : parseFloat(tokens_fpointsA[i+1]),
		x2 : parseFloat(tokens_fpointsB[i]),
		y2 : parseFloat(tokens_fpointsB[i+1]),
	});
  }
}
