var fs=require("fs")
var http=require("http")

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
	
	if(threads[i].participants.length==2) //removing yourself from participants. It also add only two-person conversations, because other amount of people is not supported for now :(
	{
		tmp=tmp.filter(item => item !== you);
	}
	else
		continue;
// 		tmp=you;
	
		people+='<option value="'+tmp+'">\n'
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

function weekly_stats(thread_id) 
{
	console.log("generating weekly stats")
	var stats=[]; //sum of sent and recived messages/chars/words per two weeks
	var statsS=[]; //sent messages/chars/words per two weeks
	
	var time=new Date(threads[thread_id].first_message); //set time to 0:00:00.000 for easier comparison
	time.setUTCHours(0);
	time.setUTCMinutes(0);
	time.setUTCSeconds(0);
	time.setUTCMilliseconds(0);
	
	time=move_date_back(time, time.getUTCDay()); //move back to first day of the week
	
	var twoweeks=new Date(0);
	twoweeks.setUTCDate(1+14);

	var tdays=time.getUTCDate();
	var now=new Date();
	
	while(time<=now) //generate and 0fill arrays
	{
		stats[time]=0;
		statsS[time]=0;
		time=new Date(time.valueOf()+twoweeks.valueOf()); //generate dates in distance of two weeks
// 		console.log("after->"+time)
	}
	
	
	for(var i in threads[thread_id].messages) //matching each message to apropirate date
	{
		var plain_date=new Date(0); //it has time=0:00:00.000 (UTC)
		var msg_date=new Date(threads[thread_id].messages[i].time);
		plain_date.setUTCDate(msg_date.getUTCDate())  //setting date to the same as in message
		plain_date.setUTCMonth(msg_date.getUTCMonth())
		plain_date.setUTCFullYear(msg_date.getUTCFullYear()) 
		plain_date=move_date_back(plain_date, plain_date.getUTCDay()) //moving it back to first day of the week
		
		if(!(stats.hasOwnProperty(plain_date))) //it may be between two dates in array (because i'm making two-week summary)
		{
			plain_date=move_date_back(plain_date, 7) //so i'm moving it back for one week
		}
		
		if(threads[thread_id].messages[i].author==you) //checking it message was sent or received
		{
			statsS[plain_date]++ //threads[thread_id].messages[i].body.length; //incrementing amount of messages
		}
		stats[plain_date]++ //threads[thread_id].messages[i].body.length
	}

	/*generating html (problably only temporary)*/
	
	var tmphtml=fs.readFileSync("line-time-scale.html").toString(); //reading model html

	var dates="[", data="[", dataS="[", dataR="[";

	for(var i in stats) //generating strings filled with data
	{
		var tmpd=new Date(i);
		dates+=tmpd.valueOf()+", ";
		data+=stats[i]+", ";
		dataS+=statsS[i]+", ";
		dataR+=stats[i]-statsS[i]+", ";
	}

	dates=dates.slice(0, -2)+"]";
	data=data.slice(0, -2)+"]";
	dataS=dataS.slice(0, -2)+"]";
	dataR=dataR.slice(0, -2)+"]";

	tmphtml=tmphtml.replace("##dates##", dates); //replacing tags with corresponding
	tmphtml=tmphtml.replace("##data##", data);
	tmphtml=tmphtml.replace("##dataS##", dataS);
	tmphtml=tmphtml.replace("##dataR##", dataR);
	
	tmphtml=tmphtml.replace("##people_list##", people);

	console.log("done");
	
	return tmphtml;
}

var messages_conversation=[]

function messages_per_conversation()
{
	console.log("generating global stats..")
	for(var i in threads)
	{
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

/*actually dropped*/
// function month_stats(thread_id)
// {
// 	var stats=[];
// 	var statsS=[];
// 	var time=new Date(threads[thread_id].first_message);
// 	time.setUTCDate(1);
// 	time.setUTCHours(0);
// 	time.setUTCMinutes(0);
// 	time.setUTCSeconds(0);
// 	time.setUTCMilliseconds(0);
// 	
// 	var tmonth=time.getUTCMonth();
// 	var tyear =time.getUTCFullYear();
// 	var now=new Date();
// 	
// 	while(time<=now)
// 	{
// 		time.setUTCMonth(tmonth++);
// 		time.setUTCFullYear(tyear);
// 		if(tmonth==12)
// 		{
// 			tmonth=0;
// 			tyear++;
// 		}
// // 		console.log(time)
// 		
// 		stats[time]=0;
// 		statsS[time]=0;
// 	}
// 	
// 	for(var i in threads[thread_id].messages)
// 	{
// 		var plain_date=new Date(0);
// 		var msg_date=new Date(threads[thread_id].messages[i].time);
// 		plain_date.setUTCMonth(msg_date.getUTCMonth())
// 		plain_date.setUTCFullYear(msg_date.getUTCFullYear())
// 		stats[plain_date]++;
// 		if(threads[thread_id].messages[i].author==you)
// 		{
// 			statsS[plain_date]++;
// 		}
// // 		console.log(plain_date)
// 	}
// // 	console.log(stats);
//
//
//
// 	var tmphtml=fs.readFileSync("line-time-scale.html").toString();
// 
// 	var dates="[", data="[", dataS="[", dataR="[";
// 
// 	for(var i in stats)
// 	{
// 	// 	dates+='"'+i+'", ';
// 		var tmpd=new Date(i);
// 		dates+=tmpd.valueOf()+", ";
// 		data+=stats[i]+", ";
// 	}
// 
// 	dates=dates.slice(0, -2)+"]";
// 	data=data.slice(0, -2)+"]";
// 
// // 	console.log(dates);
// // 	console.log(data);
// 
// 	tmphtml=tmphtml.replace("##dates", dates);
// 	tmphtml=tmphtml.replace("##data", data);
// 
// 	console.log("done")
// 	
// 	return tmphtml;
// 	// 	return stats;
// }

// fs.writeFile("chart.html", tmphtml)


messages_per_conversation();

console.log("Server ready.")

http.createServer(function(req, res)
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
	else if(req.url!="/favicon.ico")
	{
		//its really lame, but for early tests works good, has no support of group conversations, and conversations with yourself :(
		res.end(weekly_stats(find_thread([you, decodeURI(req.url).substring(1)]).toString()))
	}
}).listen(8097);
