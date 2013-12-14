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
clickstream.count = 0;
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
clickstream.count++;

// Event Handlers
function clickstreamOnClick(event){
	clickstream.events.push({
		id        : clickstream.count,
		timestamp : (new Date).getTime(),
		type      : clickstreamEventID.CLICK,
		obj       : event.target.id,
		x         : event.pageX,
		y         : event.pageY,
	});
	clickstream.count++;
}

function clickstreamOnDoubleClick(event){
	clickstream.pop();
	clickstream.pop();
	clickstream.events.push({
		id        : clickstream.count,
		timestamp : (new Date).getTime(),
		type      : clickstreamEventID.CLICK,
		obj       : event.target.id,
		x         : event.pageX,
		y         : event.pageY,
	});
	clickstream.count++;
}

function clickstreanOnFocus(event){
	clickstream.events.push({
		id        : clickstream.count,
		timestamp : (new Date).getTime(),
		type      : clickstreamEventID.FOCUS,
		obj       : event.target.id,
		x         : event.pageX,
		y         : event.pageY,
	});
	clickstream.count++;
}

function clickstreanOnDefocus(event){
	clickstream.events.push({
		id        : clickstream.count,
		timestamp : (new Date).getTime(),
		type      : clickstreamEventID.DEFOCUS,
		obj       : event.target.id,
		x         : event.pageX,
		y         : event.pageY,
	});
	clickstream.count++;
}

// Bind Events
$(document).click(clickstreamOnClick);
$(document).dblclick(clickstreamOnDoubleClick);
$(document).focus(clickstreanOnFocus);

// Show ClickStream log (Only for debugging purposes!)
$(document).keypress(function(event) {
	if (event.which == 76 || event.which == 108){
		alert(JSON.stringify(clickstream));
		//document.write(JSON.stringify(clickstream))
	}
});
