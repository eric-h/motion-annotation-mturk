function getStats(){
	var stats = {};
	stats.secondsWorked = 568.20;	//Amount of time the user was working
	stats.featurePoints = 133;		//Feature points used by the user
	stats.hits = 5;					//Tasks done by the user
	stats.ratio = 0.87;				//Positive reviews / Total reviews
	stats.level = 7;				//Level of the user (based on experience)
	stats.xp = 2180;				//Experience points
	return stats;
}

function getAchievements(stats){
	var achievements = [];
	var x     = stats.featurePoints/achievements.hits;
	var stars = x > 30 ? (x > 40 ? (x > 50 ? 3 : 2) : 1) : 0;
	achievements.push(["Eagle's Eye", "Blah blah...", stars]);
	
	var x     = stats.ratio
	var stars = x > 0.7 ? (x > 0.8 ? (x > 0.9 ? 3 : 2) : 1) : 0;
	achievements.push(["Master", "Blah blah...", stars]);
	
	var x     = stats.secondsWorked
	var stars = x > 15*60 ? (x > 60*60 ? (x > 6*60*60 ? 3 : 2) : 1) : 0;
	achievements.push(["Concentration", "Blah blah...", stars]);
	
	var x     = stats.featurePoints
	var stars = x > 250 ? (x > 1000 ? (x > 5000 ? 3 : 2) : 1) : 0;
	achievements.push(["Perfection", "Blah blah...", stars]);
	return stats;
}

function displayUserInfo(user){
	document.getElementById("userName").innerHTML  = user.name;
	document.getElementById("userLevel").innerHTML = "Level: " + user.stats.level;
	document.getElementById("userImage").style.backgroundImage = "url(" + user.image + ")";
	document.getElementById("userXP").innerHTML    = "Experience: " + user.stats.xp;
}

var user = {};
user.id = 565491;
user.name = "AlexAltea";
user.image = "http://i1.ytimg.com/i/Yg48j9WTYQuq-wiEtXAAZg/1.jpg?v=afac9d";
user.agent = navigator.userAgent;
user.stats = getStats();
user.achievements = getAchievements(user.stats);
	
$(document).ready(function() {
	displayUserInfo(user);
});