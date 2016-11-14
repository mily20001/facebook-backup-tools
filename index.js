/*==================================================================================*
 *                          Websocket & communication stuff                         *
 *==================================================================================*/

var ws = new WebSocket('ws://127.0.0.1:8097', 'fb_stats');
ws.addEventListener("message", function(e)
{
	try{
		var msg = JSON.parse(e.data);
		console.log("Got data via websocket")
		console.log("data: ")
		console.log(msg);
		
		
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
		else if(msg.type=="all_conversation_stats")
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
		else if(msg.type=="people")
		{
			document.getElementById("people_list").innerHTML=msg.list
		}
		else if(msg.type=="hour_stats")
		{
			document.getElementById("chart_canvas").style.display="initial";
			bar_chart_config.data.labels=msg.labels;
			bar_chart_config.data.datasets[0].data=msg.data
			
			if(window.myLine.chart.config.type=="bar") /*if other type, then regenerate chart*/
				window.myLine.update(); 
			else
			{
				window.myLine.destroy();
				var ctx=document.getElementById("chart_canvas").getContext("2d");
				window.myLine=new Chart(ctx, bar_chart_config);
			}
		}
		else if(msg.type=="progress")
		{
			set_progress(msg.percent);
		}
		else if(msg.type=="conversation")
		{
			document.getElementById("chart_canvas").style.display="none";
			var c_div=document.getElementById("conversation");
			
// 				c_div.style.display="initial"
			
			var tmp="", you=msg.you;
			
			for(var i in msg.messages)
			{
				var tmp2='<div class="message">'
				if(msg.messages[i].author==you)
					tmp2+='<div class="your_message"><div class="body">';
				else
					tmp2+='<div class="not_your_message"><div class="body">';
				tmp2+=msg.messages[i].body;
				
				tmp2+='</div><div class="message_info">'
				
				tmp2+=msg.messages[i].time;
				
				tmp2+='</div></div>'
				
				tmp+=tmp2;
			}
			
			c_div.innerHTML=tmp;
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


function generate_chart()
{
	var chart_type;
	for(var i in document.getElementsByName('chart_type'))
	{
		if(document.getElementsByName('chart_type')[i].type==='radio' && document.getElementsByName('chart_type')[i].checked)
		{
			chart_type=document.getElementsByName('chart_type')[i].value;
		}
	}
	
	var message={"type": "conversation_stats",
				"participants": document.getElementById('participants').value.split(", "),
				"interval": document.getElementById('interval').value,
				"chart_type": chart_type}
	send(JSON.stringify(message));
}

function all_conversation_stats()
{
	var chart_type;
	for(var i in document.getElementsByName('chart_type'))
	{
		if(document.getElementsByName('chart_type')[i].type==='radio' && document.getElementsByName('chart_type')[i].checked)
		{
			chart_type=document.getElementsByName('chart_type')[i].value;
		}
	}
	
	var message={"type": "all_conversation_stats",
				"interval": document.getElementById('interval').value,
				"chart_type": chart_type}
	send(JSON.stringify(message));
}

function generate_hour_chart()
{
	send(JSON.stringify({type: "hour_stats"}))
}

function get_conversation()
{
	send(JSON.stringify({"type": "conversation",
											"participants": document.getElementById('participants').value.split(", "),
											"first_msg": document.getElementById('first_message').value, 
											"msg_count": document.getElementById('message_count').value
											}))
}

send(JSON.stringify({"type": "people"}))


/*==================================================================================*
 *                                Progressbar stuff                                 *
 *==================================================================================*/
function set_progress(percent)
{
	document.getElementById("bar").style.width=percent+"%";
}


/*==================================================================================*
 *                                    Chart stuff                                   *
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
			label: "Odebrane", //received messages
			borderColor: received_cfg.borderColor,
			backgroundColor: received_cfg.backgroundColor,
			pointBorderColor: received_cfg.pointBorderColor,
			pointBackgroundColor: received_cfg.pointBackgroundColor,
			pointBorderWidth: 1,
			data: received_cfg.data
		},
		{
			label: "Wysłane", //sent messages
			borderColor: sent_cfg.borderColor,
			backgroundColor: sent_cfg.backgroundColor,
			pointBorderColor: sent_cfg.pointBorderColor,
			pointBackgroundColor: sent_cfg.pointBackgroundColor,
			pointBorderWidth: 1,
			data: sent_cfg.data
		},
		{
			label: "Łącznie", //sent+received
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
								text:"Liczba wiadomości w dwutygodniowym okresie"
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
					labelString: 'Data'
				}
			}, ],
			yAxes: [{
				scaleLabel: {
					display: true,
					labelString: 'Liczba wiadomości' //amount of messages
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
 *                                    Global stats                                  *
 *==================================================================================*/

function global_stats() //function gets data from server and generate table.
{
	var wyn='<table id="global_stats" style="border-collapse:collapse;"><tr><th>Participants</th><th>Messages</th><th>Sent msg</th><th>Recv msg</th><th>S/R%</th><th>Words</th><th>Sent words</th><th>Recv words</th><th>S/R%</th><th>Chars</th><th>Sent chars</th><th>Recv chars</th><th>S/R%</th></tr>';
	xhr = new XMLHttpRequest();
	xhr.open('GET', '/messages_per_conversation');
	xhr.onload=function()
	{
		var tmp=JSON.parse(xhr.responseText);
// 			console.log("Got: "+tmp);
		
		var ccount=0;
		
		for(i in tmp)
		{
			ccount++;
			if(ccount>15) break;
			
			var sent_messages_percent=(tmp[i].sent_messages*100/tmp[i].messages).toFixed(1);
			var sent_words_percent=(tmp[i].sent_words*100/(tmp[i].sent_words+tmp[i].received_words)).toFixed(1)
			var sent_chars_percent=(tmp[i].sent_chars*100/(tmp[i].sent_chars+tmp[i].received_chars)).toFixed(1)
		
			wyn+="<tr>"
			
			wyn+='<td style="word-wrap:break-word; max-width: 300px;" onclick="document.getElementById(\'participants\').value=\''+tmp[i].participants.join(", ")+'\'; generate_chart()">'+tmp[i].participants.join(", ")+"</td>"
			
			wyn+="<td>";
			
			wyn+=tmp[i].messages;
			
			wyn+="</td>"
			
			wyn+="<td>";
			
			wyn+=tmp[i].sent_messages;
			
			wyn+="</td>"
			
			wyn+="<td>";
			
			wyn+=tmp[i].received_messages;
			
			wyn+="</td>"
			
			wyn+="<td>";
			
			wyn+=sent_messages_percent+"/"+(100-sent_messages_percent).toFixed(1)+" "+((sent_messages_percent<48)?("↓"):((sent_messages_percent>52)?("↑"):("-")))
			
			wyn+="</td>"
			
			wyn+="<td>";
			
			wyn+=tmp[i].sent_words+tmp[i].received_words;
			
			wyn+="</td>"
			
			wyn+="<td>";
			
			wyn+=tmp[i].sent_words;
			
			wyn+="</td>"
			
			wyn+="<td>";
			
			wyn+=tmp[i].received_words;
			
			wyn+="</td>"
			
			wyn+="<td>";
			
			wyn+=sent_words_percent+"/"+(100-sent_words_percent).toFixed(1)+" "+((sent_words_percent<48)?("↓"):((sent_words_percent>52)?("↑"):("-")))
			
			wyn+="</td>"
			
			wyn+="<td>";
			
			wyn+=tmp[i].sent_chars+tmp[i].received_chars;
			
			wyn+="</td>"
			
			wyn+="<td>";
			
			wyn+=tmp[i].sent_chars;
			
			wyn+="</td>"
			
			wyn+="<td>";
			
			wyn+=tmp[i].received_chars;
			
			wyn+="</td>"
			
			wyn+="<td>";
			
			wyn+=sent_chars_percent+"/"+(100-sent_chars_percent).toFixed(1)+" "+((sent_chars_percent<48)?("↓"):((sent_chars_percent>52)?("↑"):("-")))
			
			wyn+="</td>"
			
			wyn+="</tr>"
		}
		wyn+="</table>"
		document.getElementById('global_stats').innerHTML=wyn;
	}
	xhr.send();
}
global_stats();

/*==================================================================================*
 *                                    Word stats                                    *
 *==================================================================================*/

function word_stats() //function gets data from server and generate table.
{
	var wyn='<table id="word_stats" style="border-collapse:collapse;"><tr><th>Word</th><th>Occurences</th></tr>';
	xhr1 = new XMLHttpRequest();
	xhr1.open('GET', '/word_stats');
	xhr1.onload=function()
	{
		var tmp=JSON.parse(xhr1.responseText);
// 			console.log("Got: "+tmp);
		
		var ccount=0;
		
		for(i in tmp)
		{
			ccount++;
			if(ccount>50) break;
		
			wyn+="<tr>"
			
			wyn+='<td style="word-wrap:break-word; max-width: 300px;">'+tmp[i].word+"</td>"
			
			wyn+="<td>";
			
			wyn+=tmp[i].count;
			
			wyn+="</td>"
			
			wyn+="</tr>"
		}
	wyn+="</table>"
		document.getElementById('word_stats').innerHTML=wyn;
	}
	xhr1.send();
}
word_stats();
