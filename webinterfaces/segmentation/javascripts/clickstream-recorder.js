//Event Definitions
var clickstreamEventID = {
	START   : 0,
	DEFOCUS : 1,
	FOCUS   : 2,
	FINISH  : 3,
	CLICK   : 4,
	TEXT    : 5,
};

var clickstreamEventType = {
	0 : 'Start',                      // No parameters
	1 : 'Task lost focus',
	2 : 'Task regained focus',
	3 : 'Task result submit',
	4 : 'Mouse click or doubleclick', // Parameters contain position and click type
	5 : 'Entered text',               // Parameters contain text and GUI element ID
};

// ClickStream Recorder object
var clickstream = {};
clickstream.id = 0;
clickstream.t0 = (new Date).getTime();
clickstream.events = [];

// Initial event
clickstream.events.push({
	id        : clickstream.id,
	timestamp : 0.0,
	type      : clickstreamEventID.START,
	x         : 0,
    y         : 0,
});
clickstream.id++;

// Event Handlers
function clickstreamOnClick(event){
	clickstream.events.push({
		id        : clickstream.id,
		timestamp : (new Date).getTime(),
		type      : clickstreamEventID.CLICK,
		x         : event.pageX,
		y         : event.pageY,
	});
	clickstream.id++;
}

function clickstreamOnDoubleClick(event){
	clickstream.pop();
	clickstream.pop();
	clickstream.events.push({
		id        : clickstream.id,
		timestamp : (new Date).getTime(),
		type      : clickstreamEventID.CLICK,
		x         : event.pageX,
		y         : event.pageY,
	});
	clickstream.id++;
}

function clickstreanOnFocus(event){
	clickstream.events.push({
		id        : clickstream.id,
		timestamp : (new Date).getTime(),
		type      : clickstreamEventID.FOCUS,
		x         : event.pageX,
		y         : event.pageY,
	});
	clickstream.id++;
}

function clickstreanOnDefocus(event){
	clickstream.events.push({
		id        : clickstream.id,
		timestamp : (new Date).getTime(),
		type      : clickstreamEventID.DEFOCUS,
		x         : event.pageX,
		y         : event.pageY,
	});
	clickstream.id++;
}

// Bind Events
$(document).click(clickstreamOnClick);
$(document).dblclick(clickstreamOnDoubleClick);

// Show ClickStream log (Only for debugging purposes!)
$(document).keypress(function(event) {
	if (event.which == 76 || event.which == 108){
		alert(JSON.stringify(clickstream));
	}
});
