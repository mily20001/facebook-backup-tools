var fs=require("fs")
var http=require("http")
var WebSocketServer=require('websocket').server;
var ProgressBar = require('progress');

var you=""

if(you.length<2)
	throw "Enter your name in 4th line!"
	
console.log("Loading parsed JSON...")

var threads=JSON.parse(fs.readFileSync("parsed.json"))

console.log("Loaded "+threads.length+" threads.")


//generating list of conversations

var people="";
for(var i in threads)
{
	var tmp=threads[i].participants;
	
		people+='<option value="'+tmp.join(", ")+'">\n'
}


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

function conversation_stats(thread_id, interval) 
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
	
	for(var i in threads[thread_id].messages) //matching each message to apropirate date
	{
		pbar.tick();
		var msg_date=new Date(threads[thread_id].messages[i].time);
		msg_date=msg_date.valueOf();
		var m_label=labels[match_date(labels, msg_date)] //find matching date
		
		if(threads[thread_id].messages[i].author==you) //checking it message was sent or received
		{
			statsS[m_label]++ //threads[thread_id].messages[i].body.length; //incrementing amount of messages
		}
		stats[m_label]++ //threads[thread_id].messages[i].body.length
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

var word_array=[];

function words_stats()
{
	var words={};
	
	console.log("Generating words stats")
	var pbar = new ProgressBar('[:bar] :percent', { total: threads.length, current: 0, width: 25, clear:true });
	
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
					words[tmpw]=1;
			}
		}
	}
	
	console.log("sorting them...")
	
	for(var k in words)
	{
		word_array.push({"word":k, "count": words[k]});
	}
	word_array.sort(function(a, b){return b.count-a.count})
	
	console.log("done.")
}

var messages_conversation=[]

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

messages_per_conversation();

// hour_stats();

words_stats();

console.log("Server ready.")

var server=http.createServer(function(req, res)
{
	console.log("req:"+decodeURI(req.url))
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
	else if(req.url!="/favicon.ico")
	{
		res.end(0);
		//its really lame, but for early tests works good, has no support of group conversations, and conversations with yourself :(
// 		res.end(weekly_stats(find_thread([you, decodeURI(req.url).substring(1)]).toString())) //dropped (yay)
	}
}).listen(8097);


wsServer = new WebSocketServer({
	httpServer: server
});

var ws_clients=[];
var ws_clients_count=0;

wsServer.on('request', function(r)
{
	var connection = r.accept('fb_stats', r.origin);
	var id = ws_clients_count++;
	
	ws_clients[id] = connection
	
	connection.on('message', function(message)
	{
		console.log("Recived message: "+message.utf8Data);
		var data=JSON.parse(message.utf8Data);
		
		if(!data.hasOwnProperty("type"))
		{
			console.log("invalid message.")
			return;
		}
		
		if(data.type=="conversation_stats")
		{
			var thread_id=find_thread(data.participants)
			if(thread_id==-1)
			{
				console.log("thread "+data.participants+" not found")
				ws_clients[id].sendUTF(JSON.stringify({"error": "requested thread not found"}))
				return;
			}
			
			var wyn=conversation_stats(thread_id, data.interval)
			
			wyn={"type": "conversation_stats",
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
		else if(data.type=="people")
		{
			ws_clients[id].sendUTF(JSON.stringify({"type": "people", "list":people}))
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
});
