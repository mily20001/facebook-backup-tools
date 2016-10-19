var fs=require("fs")
var http=require("http")

var threads=JSON.parse(fs.readFileSync("parsed.json"))

console.log("Loaded "+threads.length+" threads.")

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
	return -1;
}

function month_stats(thread_id)
{
	var stats=[];
	var time=new Date(threads[thread_id].first_message);
	time.setUTCDate(1);
	time.setUTCHours(0);
	time.setUTCMinutes(0);
	time.setUTCSeconds(0);
	time.setUTCMilliseconds(0);
	
	var tmonth=time.getUTCMonth();
	var tyear =time.getUTCFullYear();
	var now=new Date();
	
	while(time<=now)
	{
		time.setUTCMonth(tmonth++);
		time.setUTCFullYear(tyear);
		if(tmonth==12)
		{
			tmonth=0;
			tyear++;
		}
// 		console.log(time)
		
		stats[time]=0;
	}
	
	for(var i in threads[thread_id].messages)
	{
		var plain_date=new Date(0);
		var msg_date=new Date(threads[thread_id].messages[i].time);
		plain_date.setUTCMonth(msg_date.getUTCMonth())
		plain_date.setUTCFullYear(msg_date.getUTCFullYear())
		stats[plain_date]++;
// 		console.log(plain_date)
	}
	console.log(stats);
	
}

month_stats(find_thread(["", ""]))


// http.createServer(function(req, res)
// {
// 	if(req.url=='/')
// 	{
// 		res.end(fs.readFileSync("index.html"))
// 	}
// 	else
// 	{
// 		res.end(0);
// 	}
// }).listen(8097);
