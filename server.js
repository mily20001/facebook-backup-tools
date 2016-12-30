var fs=require("fs")
var http=require("http")
var WebSocketServer=require('websocket').server;
var ProgressBar = require('progress');

var you=fs.readFileSync("your.name").toString().replace(' \n', "").replace('\n', "");

if(you.length<2)
	throw "Enter your name in 4th line!"

console.log("Hello '"+you+"'!")

/********* Loading ****************/
	
var SERVER_LOADING=1;

console.log("Starting http server..")

var ws_clients=[];
var ws_clients_count=0;

var server=http.createServer(http_server).listen(8097);

function send_progress(percent, ws_id)
{
	ws_clients[ws_id].sendUTF(JSON.stringify({"type":"progress", "percent":percent}));
}

wsServer = new WebSocketServer({
	httpServer: server
});

wsServer.on('request', ws_request_function);

console.log("done.");

var threads;
var people="";
var messages_conversation=[]
var word_array=[];
var mail="";

	
console.log("Loading parsed JSON...")
threads=JSON.parse(fs.readFileSync("parsed.json"));

people=JSON.parse(fs.readFileSync("people_list.json"));

// console.log("Loaded "+threads.length+" threads.")
// for(var i in threads)
// {
// 	var tmp=threads[i].participants;
// 	
// 		people+='<option value="'+tmp.join(", ")+'">\n'
// }
	
// all_words_stats();

// messages_per_conversation();

mail=find_mail();
replace_mail_to_name(mail);

SERVER_LOADING=false;

console.log("Server ready.")

/************** Functions **********************/
	
function find_thread(participants)
{
	for(var i in threads)
	{
		var found=true;
		if(threads[i].participants.length!=participants.length)
			continue;
		
		for(var j in participants)
		{
			if(threads[i].participants.indexOf(participants[j])==-1) //if any of participants weren't found
			{
				found=false;
				break;
			}
		}
		
		if(found==true)
		{
			return i;
		}
	}
	console.error("THREAD NOT FOUND ("+participants+")")
	return -1;
}

function find_mail()
{
	console.log("Looking for your mail..")
	mails={};
	for(var thread_id in threads)
	{
		var participants=threads[thread_id].participants;
		for(var i in threads[thread_id].messages)
		{
			var tmp=threads[thread_id].messages[i].author;
			if(tmp.toString().indexOf("facebook.com")>0 && participants.indexOf(tmp)==-1)
			{
				if(mails.hasOwnProperty(tmp))
					mails[tmp]++;
				else
					mails[tmp]=1;
// 				console.log("found email:"+tmp)
// 				console.log("participants:"+participants+"\n")
// 				break;
			}
		}
	}
	var max=0, count=0
	var mail=""
	for(var i in mails)
	{
		if(mails[i]>max)
		{
			max=mails[i];
			mail=i;
		}
		count+=mails[i];
	}
	console.log("problably your mail: "+mail+" ("+parseInt(mails[mail]*100/count)+"%) (should be >50%)")
	return mail;
}

function replace_mail_to_name(mail)
{
	for(var thread_id in threads)
	{
		var participants=threads[thread_id].participants;
		for(var i in threads[thread_id].messages)
		{
			var tmp=threads[thread_id].messages[i].author;
			if(tmp==mail)
			{
				threads[thread_id].messages[i].author=you;
			}
		}
	}
}

function move_date_back(date, days) //moving date back for <days> days
{
	var tmp=new Date(0);
	tmp.setUTCDate(days+1);
	return new Date(date-tmp);
}

function binSearch(arr, val) //it returns index of matching element, or first (closest) lower element
{
	var pos=Math.floor((arr.length+1)/2), dif=Math.floor((pos+1)/2);

	while(true)
	{
		if(arr[pos]<val) pos+=dif;
		else if(arr[pos]>val) pos-=dif
		else return pos;
		
		if(dif<2) break;
		
		dif=Math.floor((dif+1)/2);
	}

	while(pos>0 && pos<arr.length-1)
	{
		if(arr[pos]<=val && arr[pos+1]>val)
			break;
		else if(arr[pos]<=val && arr[pos+1]<=val)
			pos++;
		else
			pos--;
	}

	return pos;
};

function match_date(labels, date) /*welp*/
{
	return binSearch(labels, date)
}

function all_conversation_stats(interval, chart_type, ws_id)
{
	console.log("Generating ALL conversation stats (interval="+interval+")")
	var firstest_message=new Date();
	var all_messages_count=0;
	for(var i in threads)
	{
		var time=new Date(threads[i].first_message);
		if(time<firstest_message)
		{
			firstest_message=time;
		}
		all_messages_count+=threads[i].messages.length;
	}
	
	console.log("first message ever @ "+firstest_message)
	console.log("you have "+all_messages_count+" messages")
	
	interval=parseInt(interval)
	
	var pbar = new ProgressBar('[:bar] :percent :etas', { total: all_messages_count, current: 0, width: 30, clear:true });
	var stats={}; //sum of sent and recived messages/chars/words per interval
	var statsS={}; //sent messages/chars/words per interval
	var labels=[];
	
	firstest_message.setUTCHours(0);
	firstest_message.setUTCMinutes(0);
	firstest_message.setUTCSeconds(0);
	firstest_message.setUTCMilliseconds(0);
	var time=firstest_message;
	
	var now=new Date();
	
	var itime=new Date(0) /*interval time*/
	itime.setUTCDate(1+interval);
	
	while(time<=now) //generate and 0fill arrays
	{
		labels.push(time.valueOf());
		stats[time.valueOf()]=0;
		statsS[time.valueOf()]=0;
		time=new Date(time.valueOf()+itime.valueOf()); //generate dates in distance of interval
	}
	
	var last_percent=0;
	var processed_messages=0;
	send_progress(0, ws_id)
	
	for(var thread_id in threads)
	{
		for(var i in threads[thread_id].messages) //matching each message to apropirate date
		{
			pbar.tick();
			if(parseInt(100*processed_messages/all_messages_count)!=last_percent)
			{
				send_progress(100*processed_messages/all_messages_count, ws_id)
				last_percent=parseInt(100*processed_messages/all_messages_count);
			}
			processed_messages++;
			var msg_date=new Date(threads[thread_id].messages[i].time);
			msg_date=msg_date.valueOf();
			var m_label=labels[match_date(labels, msg_date)] //find matching date
			
			var increment;
			if(chart_type=="messages")
				increment=1;
			else if(chart_type=="words")
				increment=threads[thread_id].messages[i].body.split(" ").length;
			else if(chart_type=="chars")
				increment=threads[thread_id].messages[i].body.length;
			else
				increment=0; //should not happen
			
			if(threads[thread_id].messages[i].author==you) //checking it message was sent or received
			{
				statsS[m_label]+=increment
			}
			stats[m_label]+=increment
		}
	}

	var dataB=[], dataS=[], dataR=[];

	for(var i in stats) //generating strings filled with data
	{
		var tmpd=new Date(i);
		dataB.push(stats[i]);
		dataS.push(statsS[i]);
		dataR.push(stats[i]-statsS[i]);
	}
	console.log("done");
	
	send_progress(0, ws_id);
	
	return {"labels": labels,
					"dataB": dataB,
					"dataS": dataS,
					"dataR": dataR
	};
}

function conversation_stats(thread_id, interval, chart_type, ws_id) 
{
	interval=parseInt(interval)
	console.log("Generating conversation stats (interval="+interval+")")
	var pbar = new ProgressBar('[:bar] :percent :etas', { total: threads[thread_id].messages.length, current: 0, width: 30, clear:true });
	var stats={}; //sum of sent and recived messages/chars/words per interval
	var statsS={}; //sent messages/chars/words per interval
	var labels=[];
	
	var time=new Date(threads[thread_id].first_message); //set initial hour to 0:00:00.000
	time.setUTCHours(0);
	time.setUTCMinutes(0);
	time.setUTCSeconds(0);
	time.setUTCMilliseconds(0);
	
	var now=new Date();
	
	var itime=new Date(0) /*interval time*/
	itime.setUTCDate(1+interval);
	
	while(time<=now) //generate and 0fill arrays
	{
		labels.push(time.valueOf());
		stats[time.valueOf()]=0;
		statsS[time.valueOf()]=0;
		time=new Date(time.valueOf()+itime.valueOf()); //generate dates in distance of interval
	}
	
	var last_percent=0;
	send_progress(0, ws_id)
	
	for(var i in threads[thread_id].messages) //matching each message to apropirate date
	{
		pbar.tick();
		if(parseInt(i*100/threads[thread_id].messages.length)!=last_percent)
		{
			send_progress(i*100/threads[thread_id].messages.length, ws_id)
			last_percent=parseInt(i*100/threads[thread_id].messages.length);
		}
		var msg_date=new Date(threads[thread_id].messages[i].time);
		msg_date=msg_date.valueOf();
		var m_label=labels[match_date(labels, msg_date)] //find matching date
		
		var increment;
		if(chart_type=="messages")
			increment=1;
		else if(chart_type=="words")
			increment=threads[thread_id].messages[i].body.split(" ").length;
		else if(chart_type=="chars")
			increment=threads[thread_id].messages[i].body.length;
		else
			increment=0; //should not happen
		
		if(threads[thread_id].messages[i].author==you) //checking it message was sent or received
		{
			statsS[m_label]+=increment
		}
		stats[m_label]+=increment
	}

	var dataB=[], dataS=[], dataR=[];

	for(var i in stats) //generating strings filled with data
	{
		var tmpd=new Date(i);
		dataB.push(stats[i]);
		dataS.push(statsS[i]);
		dataR.push(stats[i]-statsS[i]);
	}
	console.log("done");
	
	send_progress(0, ws_id);
	
	return {"labels": labels,
					"dataB": dataB,
					"dataS": dataS,
					"dataR": dataR
	};
}


function hour_stats()
{
	var messages_hour={}
	
	console.log("Generating hour stats")
	var pbar = new ProgressBar('[:bar] :percent', { total: threads.length, current: 0, width: 25, clear:true });
	
	for(var i=0; i<24; i++)
	{
		messages_hour[i]=0;
	}
	
	for(var thread_id in threads)
	{
		pbar.tick();
		for(var msg in threads[thread_id].messages)
		{
			var msg_date=new Date(threads[thread_id].messages[msg].time);
			messages_hour[msg_date.getHours()]++;
		}
	}
	
	var data=[], labels=[]
	for(var i in messages_hour)
	{
		data.push(messages_hour[i])
		labels.push(i+":00")
	}
	
	console.log("done.")
	
	return {"data": data, "labels": labels}
}

function words_stats(thread_id, ws_id)
{
	var arr=[];
	var words={};
	var words_count=0;
	
	console.log("Generating words stats for conversation "+thread_id)
	var pbar = new ProgressBar('[:bar] :percent', { total: threads[thread_id].messages.length*2, width: 25, clear:true });
	
	var last_percent=0;
	send_progress(0, ws_id)
	
	for(var msg in threads[thread_id].messages)
	{
		pbar.tick()
		if(parseInt(msg*50/threads[thread_id].messages.length)!=last_percent)
		{
			send_progress(msg*50/threads[thread_id].messages.length, ws_id)
			last_percent=parseInt(msg*50/threads[thread_id].messages.length);
		}
		var tw=threads[thread_id].messages[msg].body.split(" ");
		for(var w in tw)
		{
			if(tw[w].length<1) continue;
			
			tmpw=tw[w].toLowerCase();
			
// 				if(tmpw.search(/m+e+h+/im)==-1) continue;
			
			if(words.hasOwnProperty(tmpw))
				words[tmpw]++;
			else
			{
				words_count++;
				words[tmpw]=1;
			}
		}
	}
	
	pbar = new ProgressBar('[:bar] :percent', { total: words_count*2, width: 25, clear:true });
	pbar.tick(words_count)
	
	var i=0;
	
	for(var k in words)
	{
		pbar.tick()
		if(parseInt(i*50/words_count)!=last_percent)
		{
			send_progress(i*50/words_count+50, ws_id)
			last_percent=parseInt(i*50/words_count);
		}
		i++;
		arr.push({"word":k, "count": words[k]});
	}
	console.log("Found "+words_count+" unique words")
	console.log("sorting them...")
	arr.sort(function(a, b){return b.count-a.count})
	
	console.log("done.")
	
	send_progress(0, ws_id);
	
	return arr;
}

function all_words_stats()
{
	var words={};
	var words_count=0;
	
	console.log("Generating words stats")
	var pbar = new ProgressBar('[:bar] :percent', { total: threads.length*2, width: 25, clear:true });
	
	for(var thread_id in threads)
	{
		pbar.tick()
		for(var msg in threads[thread_id].messages)
		{
			var tw=threads[thread_id].messages[msg].body.split(" ");
			for(var w in tw)
			{
				if(tw[w].length<1) continue;
				
				tmpw=tw[w].toLowerCase();
				
// 				if(tmpw.search(/m+e+h+/im)==-1) continue;
				
// 				tmpw=tw[w]
				
				if(words.hasOwnProperty(tmpw))
					words[tmpw]++;
				else
				{
					words_count++;
					words[tmpw]=1;
				}
			}
		}
	}
	
	pbar = new ProgressBar('[:bar] :percent', { total: words_count*2, width: 25, clear:true });
	pbar.tick(words_count)
	
	for(var k in words)
	{
		pbar.tick()
		word_array.push({"word":k, "count": words[k]});
	}
	console.log("Found "+words_count+" unique words")
	console.log("sorting them...")
	word_array.sort(function(a, b){return b.count-a.count})
	
	console.log("done.")
}


function messages_per_conversation()
{
	console.log("Generating global stats")
	var pbar = new ProgressBar('[:bar] :percent', { total: threads.length, current: 0, width: 25, clear:true });
	
	for(var i in threads)
	{
		pbar.tick()
		var sent_chars=0, sent_words=0, sent_messages=0;
		var received_chars=0, received_words=0, received_messages=0;
		for (var msg in threads[i].messages)
		{
			if(threads[i].messages[msg].author==you)
			{
				sent_chars+=threads[i].messages[msg].body.length;
				sent_words+=threads[i].messages[msg].body.split(" ").length
				sent_messages++;
			}
			else
			{
				received_chars+=threads[i].messages[msg].body.length;
				received_words+=threads[i].messages[msg].body.split(" ").length
				received_messages++;
			}
		}
		messages_conversation.push({
														participants: threads[i].participants,
														messages: parseInt(threads[i].messages.length),
														sent_chars: sent_chars,
														sent_words: sent_words,
														sent_messages: sent_messages,
														received_chars: received_chars,
														received_words: received_words,
														received_messages: received_messages
		})
	}
	
	messages_conversation.sort(function (x, y){
		return parseInt(y.messages, 10)-parseInt(x.messages, 10)})
	
// 	for(var i in messages_conversation)
// 	{
// 		console.log(messages_conversation[i].messages)
// 	}
	
	console.log("done.")
}


function get_conversation(thread_id, first_msg, msg_count)
{
	first_msg=parseInt(first_msg);
	msg_count=parseInt(msg_count);
	
	if(threads[thread_id].messages.length<(first_msg+msg_count))
		return {"error": "out of range message requested"};
	
	var wyn=[];
	
	for(var i=0; i<msg_count; i++)
	{
		wyn.push(threads[thread_id].messages[threads[thread_id].messages.length-(first_msg+i+1)]);
	}
	return {"messages": wyn}
}

function get_conversation_between_dates(thread_id, beg, end)
{
	var wyn=[];
	
	for(var i in threads[thread_id].messages)
	{
		var msg=threads[thread_id].messages[i]
		if(msg.time>=beg && msg.time<=end)
			wyn.push(msg);
	}
	wyn.reverse();
	console.log("sending "+wyn.length+" messages")
	return {"messages": wyn}
}

/**************** http functions ******************/

function contains(a, obj) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}

function http_server(req, res)
{
	console.log("req:"+decodeURI(req.url))
	if(SERVER_LOADING)
	{
		res.end(fs.readFileSync("loading.html"))
	}
	else
	{
		if(req.url=='/')
		{
			res.end(fs.readFileSync("index.html"))
		}
		else if(req.url=="/messages_per_conversation")
		{
			res.end(JSON.stringify(messages_conversation));
		}
		else if(req.url=="/word_stats")
		{
			res.end(JSON.stringify(word_array));
		}
		else if(contains(["/js/frontpage.js", "/js/index.js", "/js/i_stats.js"], req.url))
		{
			res.end(fs.readFileSync('.'+req.url))
		}
		else if(contains(["/css/buttons.css", "/css/completion.css", "/css/i_stats.css", "/css/nav_buttons.css", "/css/nav_completion.css", "/css/style.css"], req.url))
		{
			res.end(fs.readFileSync('.'+req.url))
		}
		else if(req.url.search("/i_stats.html")>-1)
		{
			res.end(fs.readFileSync("i_stats.html"))
		}
		else if(req.url=="/frontpage.html")
		{
			res.end(fs.readFileSync("frontpage.html"))
		}
		else if(req.url!="/favicon.ico")
		{
			res.end(" ");
		}
	}
}


function ws_request_function(r)
{
	var connection = r.accept('fb_stats', r.origin);
	var id = ws_clients_count++;
	
	var current_conversation_id=-1;
	
	ws_clients[id] = connection
	
	connection.on('message', function(message)
	{
		console.log("Recived message: "+message.utf8Data);
		var data=JSON.parse(message.utf8Data);
		
		if(SERVER_LOADING) return;
		
		if(!data.hasOwnProperty("type"))
		{
			console.log("invalid message.")
			return;
		}
		
		if(data.type=="conversation_stats")
		{
			var thread_id;
			
			if(data.hasOwnProperty("participants"))
				thread_id=find_thread(data.participants);
			else
				thread_id=data.thread_id;
			
			if(thread_id==-1)
			{
				console.log("thread "+data.participants+" not found")
				ws_clients[id].sendUTF(JSON.stringify({"error": "requested thread not found"}))
				return;
			}
			
			var wyn=conversation_stats(thread_id, data.interval, data.chart_type, id)
			
			wyn={"type": "conversation_stats",
					"dataR": wyn.dataR,
					"dataS": wyn.dataS,
					"dataB": wyn.dataB,
					"labels": wyn.labels
					}
			
			ws_clients[id].sendUTF(JSON.stringify(wyn))
		}
		else if(data.type=="all_conversation_stats")
		{
			var wyn=all_conversation_stats(data.interval, data.chart_type, id)
			
			wyn={"type": "all_conversation_stats",
					"dataR": wyn.dataR,
					"dataS": wyn.dataS,
					"dataB": wyn.dataB,
					"labels": wyn.labels
					}
			
			ws_clients[id].sendUTF(JSON.stringify(wyn))
		}
		else if(data.type=="hour_stats")
		{
			var wyn=hour_stats()
			wyn={"type": "hour_stats",
					"data": wyn.data,
					"labels": wyn.labels
					}
				ws_clients[id].sendUTF(JSON.stringify(wyn))
		}
		else if(data.type=="conversation")
		{
			var thread_id;
			
			if(data.hasOwnProperty("participants"))
				thread_id=find_thread(data.participants);
			else
				thread_id=data.thread_id;
			
			if(thread_id==-1)
			{
				console.log("thread "+data.participants+" not found")
				ws_clients[id].sendUTF(JSON.stringify({"error": "requested thread not found"}))
				return;
			}
			
			var wyn;
			
			if(data.hasOwnProperty("beg_date"))
				wyn=get_conversation_between_dates(thread_id, data.beg_date, data.end_date)
			else
				wyn=get_conversation(thread_id, data.first_msg, data.msg_count);
			
			if(wyn.hasOwnProperty("error"))
			{
				ws_clients[id].sendUTF(JSON.stringify({"error": "error while handling request ("+wyn.error+")"}))
				return;
			}
			
			wyn={"type": "conversation",
					"participants": data.participants,
					"messages":wyn.messages,
					"you":you
					}
			
			ws_clients[id].sendUTF(JSON.stringify(wyn));
		}
		else if(data.type=="words_stats")
		{
			var thread_id;
			
			if(data.hasOwnProperty("participants"))
				thread_id=find_thread(data.participants);
			else
				thread_id=data.thread_id;
			
			if(thread_id==-1)
			{
				console.log("thread "+data.participants+" not found")
				ws_clients[id].sendUTF(JSON.stringify({"error": "requested thread not found"}))
				return;
			}
			
			ws_clients[id].sendUTF(JSON.stringify({"type": "words_stats", "arr":words_stats(thread_id, id)}));
		}
		else if(data.type=="global_stats")
		{
			ws_clients[id].sendUTF(JSON.stringify({"type": "global_stats", "stats":JSON.parse(fs.readFileSync("global_stats.json"))}))
		}
		else if(data.type=="people")
		{
			ws_clients[id].sendUTF(JSON.stringify({"type": "people", "people":people}))
		}
		else if(data.type=="get_name")
		{
			var names=threads[data.id].participants.slice(0);
			names.splice(names.indexOf(you), 1);
			
			var msg={"type": "get_name",
							 "names": names,
			}
			ws_clients[id].sendUTF(JSON.stringify(msg));
		}
		else if(data.type=="get_url")
		{
			var thread_id=find_thread(data.participants);
			if(thread_id==-1)
				console.log("Conversation doesn't exist :(");
			else
			{
				ws_clients[id].sendUTF(JSON.stringify({"type":"redirect", "url":"http://127.0.0.1:8097/i_stats.html?"+thread_id}));
			}
		}
		else
		{
			console.log(data.type+" unsupported :(")
		}
	});

	connection.on('close', function(reasonCode, description)
	{
		delete ws_clients[id];
		console.log((new Date())+' Peer '+connection.remoteAddress+' disconnected.');
	});
	
	console.log((new Date())+' Connection accepted ['+id+']');
}

