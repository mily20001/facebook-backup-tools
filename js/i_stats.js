/* websocket */
var completions=[];

var type_choose_nr="messages";

var ws = new WebSocket('ws://127.0.0.1:8097', 'fb_stats');
ws.addEventListener("message", function(e)
{
	try{
		var msg = JSON.parse(e.data);
		console.log("Got data via websocket")
		console.log("data: ")
		console.log(msg);
		
		
		if(msg.type=="people")
		{
			for(var i in msg.people)
			{
				completions.push(msg.people[i].join(", "))
			}
		}
		if(msg.type=="global_stats")
		{
			document.getElementById("global_stats").innerHTML="Total messages: "+msg.stats.total_messages+" total words:"+msg.stats.total_words+" total chars:"+msg.stats.total_chars+" longest message:"+msg.stats.max_words+" words"
		}
		else if(msg.type=="progress")
		{
			set_progress(msg.percent);
		}
		if(msg.type=="conversation_stats")
		{
			document.getElementById("chart_canvas").style.display="initial";
			received_cfg.data=msg.dataR;
			sent_cfg.data=msg.dataS;
			time_line_chart_config.data.datasets[0].data=msg.dataR
			time_line_chart_config.data.datasets[1].data=msg.dataS
			time_line_chart_config.data.datasets[2].data=msg.dataB; /*FIXME hardcoded :( */
			time_line_chart_config.data.labels=msg.labels
			
			if(window.myLine.chart.config.type=="line") /*if other type, then regenerate chart*/
				window.myLine.update();
			else
			{
				window.myLine.destroy();
				var ctx=document.getElementById("chart_canvas").getContext("2d");
				window.myLine=new Chart(ctx, time_line_chart_config);
			}
		}
		else if(msg.type=="get_name")
		{
			document.getElementById("conversation_name").innerHTML=msg.names.join(", ");
		}
	}
	catch(err)
	{
		console.log("error parsing message ("+err+"):")
		console.log(e.data);
	}
});

function send(message)
{
	if(ws.readyState!=ws.OPEN)
	{
		console.log("Queing message.")
		setTimeout(send, 10, message);
	}
	else
	{
		console.log("Sending message: "+message)
		ws.send(message);
	}
}

// send(JSON.stringify({"type": "people"}))

// send(JSON.stringify({"type": "global_stats"}))


function generate_chart()
{
	var message={"type": "conversation_stats",
				"thread_id": decodeURI(window.location.href).substr(decodeURI(window.location.href).search("\\?")+1),
				"interval": 30/*document.getElementById('interval').value*/,
				"chart_type": type_choose_nr}
	send(JSON.stringify(message));
}

/*==================================================================================*
 *                                   Chart                                          *
 *==================================================================================*/

Chart.defaults.global.defaultFontColor="#999"
Chart.defaults.scale.gridLines.color="rgba(250, 250, 250, 0.15)"
var timeFormat = 'MM/DD/YYYY HH:mm';

var received_cfg={
			borderColor: "rgba(255, 0, 0, 0.6)",
			backgroundColor: "rgba(180, 0, 0, 0)",
			pointBorderColor: "rgba(255, 200, 180, 0.6)",
			pointBackgroundColor: "rgba(255, 200, 180, 0.6)",
			data: []
}

var sent_cfg={
			borderColor: "rgba(0, 255, 0, 0.6)",
			backgroundColor: "rgba(190, 255, 70, 0)",
			pointBorderColor: "rgba(150, 255, 200, 0.6)",
			pointBackgroundColor: "rgba(150, 255, 200, 0.6)",
			data: []
}

var time_line_chart_config={
	type: 'line',
	data: {
		labels: [0, Date.now()], // Date Objects
		datasets: [
		{
			label: "Received", //received messages
			borderColor: received_cfg.borderColor,
			backgroundColor: received_cfg.backgroundColor,
			pointBorderColor: received_cfg.pointBorderColor,
			pointBackgroundColor: received_cfg.pointBackgroundColor,
			pointBorderWidth: 1,
			data: received_cfg.data
		},
		{
			label: "Sent", //sent messages
			borderColor: sent_cfg.borderColor,
			backgroundColor: sent_cfg.backgroundColor,
			pointBorderColor: sent_cfg.pointBorderColor,
			pointBackgroundColor: sent_cfg.pointBackgroundColor,
			pointBorderWidth: 1,
			data: sent_cfg.data
		},
		{
			label: "Sum", //sent+received
			borderColor: "rgba(0, 0, 255, 1)",
			backgroundColor: "rgba(0, 0, 175, 0.4)",
			pointBorderColor: "rgba(150, 220, 255, 1)",
			pointBackgroundColor: "rgba(150, 220, 255, 1)",
			pointBorderWidth: 1,
			data: []
		}]
	},
	options: {
		responsive: true,
						title:{
								display:true,
								text:"Conversation stats"
						},
		scales: {
			xAxes: [{
			
				type: "time",
				time: {
					format: timeFormat,
					tooltipFormat: 'll'
				},
				scaleLabel: {
					display: true,
					labelString: 'Date'
				}
			}, ],
			yAxes: [{
// 				stacked: true,
				scaleLabel: {
					display: true,
					labelString: 'Amount of messages' //amount of messages
				}
			}]
		},
	}
}


var bar_chart_config={
	type: 'bar',
	data: {
		labels: [0, Date.now()], // Date Objects
		datasets: [{
			label: "Łącznie", //sent+received
			backgroundColor: "rgba(0, 0, 175, 0.4)",
			borderColor: "rgb(0, 0, 255)",
			data: []
		}]
	},
	options: {
			elements: {
				rectangle: {
					borderWidth: 2,
					borderColor: "rgb(0, 0, 255)",
					borderSkipped: 'bottom'
				}
			},
			responsive: true,
			legend: {
				position: 'top',
			},
			title: {
				display: true,
				text: 'Hour Stats'
			}
		}
}


window.onload = function() {
	var ctx = document.getElementById("chart_canvas").getContext("2d");
	window.myLine = new Chart(ctx, time_line_chart_config);

};

/*==================================================================================*
 *                                   Completion box                                 *
 *==================================================================================*/
  
function check_text(focused)
{
	if(!focused)
	{
// 		document.getElementById("cmpltions").style.height=0;
// 		document.getElementById("cmpltions").style.opacity=0;
// 		document.getElementById("hider1").style.height="25px";
		return
	}
	var tmp=completions.filter(function(element, index, array)
	{
		return (element.toString().toLowerCase().search(document.getElementById("texttest").value.toLowerCase())>-1)
	});
	console.log(tmp);
	
	var tmphtml=""

	var c_count=0; /*limit max amount of completions*/
	
	for(i in tmp)
	{
		tmphtml+='<div class="completion" onclick="complete(\''+tmp[i]+'\');">'+tmp[i]+'</div>';
		if(++c_count>=15) break;
	}
	
	document.getElementById("cmpltions").innerHTML=tmphtml;
	
	document.getElementById("cmpltions").style.height=20*c_count;
	
	document.getElementById("hider1").style.height=20*c_count+27+"px";
	
	if(tmp.length==0)
	{
		document.getElementById("cmpltions").style.opacity=0;
	}
	else
	{
		document.getElementById("cmpltions").style.opacity=1;
	}
}

function complete(s)
{
	console.log("completing: "+s)
	document.getElementById("texttest").value=s;
// 	check_text();
}

function completion_div_focus(isIt, id)
{
	if(isIt)
		id.parentElement.className="focused_completion_div";
	else
		id.parentElement.className="not_focused_completion_div";
}

/*==================================================================================*
 *                                Progressbar stuff                                 *
 *==================================================================================*/
function set_progress(percent)
{
	console.log("XDDD");
	document.getElementById("bar").style.width=percent+"%";
}

/*==================================================================================*
 *                                      Main menu                                   *
 *==================================================================================*/
  
// function hider1(show)
// {
// 	var el=document.getElementById("hider1");
// 	
// 	if(show)
// 		el.style.height="25px";
// 	else
// 		el.style.height="0px";
// }
// 
// hider1(false)
  
/*==================================================================================*
 *                                  Multiple buttons                                *
 *==================================================================================*/

function setup_buttons()
{
	var button_containers=document.getElementsByClassName("button_container");
	for(var key=0; key<button_containers.length; key++)
	{
		var container=button_containers[key];
		container.style["line-height"]=container.clientHeight;
		var h=container.clientHeight, w=container.clientWidth;
		var chooser=container.getElementsByClassName("chooser")[0];
		var buttons=container.getElementsByClassName("button");
		
		chooser.style.width=100.0/buttons.length+"%";
		
		console.log("buttons:"+buttons.length)
		
		for(var i=0; i<buttons.length; i++)
		{
			buttons[i].style.width=100.0/buttons.length+"%";
			if(i==0)
			{
				buttons[i].style["border-radius"]="7px 0px 0px 7px";
				chooser.style.backgroundColor=buttons[i].dataset.chooser_color;
				chooser.style["border-radius"]=buttons[i].style["border-radius"];
				chooser.style.left=0;
			}
			else if(i==buttons.length-1)
				buttons[i].style["border-radius"]="0px 7px 7px 0px";
			else
				buttons[i].style["border-radius"]="0px";
			
			buttons[i].addEventListener('click', function(e)
			{
				get_chooser(e.target).style.backgroundColor=e.target.dataset.chooser_color;
				get_chooser(e.target).style["border-radius"]=e.target.style["border-radius"];
				get_chooser(e.target).style.left=e.target.offsetLeft
			})
		}
	}
}

function get_chooser(button) //returns chooser for specified button
{
	return button.parentElement.getElementsByClassName("chooser")[0];
}

setup_buttons();
