var fs=require("fs")

// var file=fs.readFileSync("test.html").toString()
var file=fs.readFileSync("messages.htm").toString()

var threads=file.split('<div class="thread">')

var main=[];
/*
 * 0: {
 *      participants=["blah", "blah2"],
 *      messages=[
 *        0: {
 *            author:"blah2"
 *            time:1476794835433
 *            body:"ziemniak"
 *           }
 *        ]
 *    }
 */

String.prototype.removeAt=function(index) { //removes single char at position
    return this.substr(0, index)+this.substr(index+1);
}

function add_thread(participants)
{
	var id;
	for(var i in main)
	{
		var found=true;
		for(var j in participants)
		{
			if(main[i].participants.indexOf(participants[j])==-1) //if any of participants weren't found
			{
				found=false;
				break;
			}
		}
		
		if(found==true)
		{
// 			console.log("thread already exist")
			return i;
		}
	}
	
	var tmpobj={}
	tmpobj.participants=participants;
	tmpobj.messages=[];
	
// 	console.log("adding new thread")
	
	return main.push(tmpobj)-1;
}

var count=0;
 
for(var i in threads)
{
	var cthread=threads[i].toString();
	
  if(cthread.indexOf("<html>")>-1) //skipping header and stuff
  {
    continue;
  }
  
  var participants=cthread.substring(0, cthread.indexOf('<div class="message">')).split(", ")
	
	var thread_id=add_thread(participants);
  
  var messages=cthread.split('<div class="message">')
	
  for(var j in messages)
  {
		if(j==0) continue; /*FIXME*/
		var cm=messages[j].toString();
    var tmpm={};
    tmpm.author="";
    tmpm.time=0;
    tmpm.body="";
		
		var body_begin=cm.indexOf('<p>')+3;
		
		while(cm.indexOf('\n')!=-1 && cm.indexOf('\n')<body_begin) //need to remove newlines from html code
		{
			cm=cm.removeAt(cm.indexOf('\n'), "");
		}
		
		var p=cm.indexOf('<span class="user">')+19;
		var k=cm.indexOf('</span>', p);
		tmpm.author=cm.substring(p, k)
		
		p=cm.indexOf('<span class="meta">', k)+19;
		k=cm.indexOf('</span>', p);
		
		tmpm.time=cm.substring(p, k);
		tmpm.time=tmpm.time.replace("o ", "");
		tmpm.time=tmpm.time.replace("styczeń", "january");
		tmpm.time=tmpm.time.replace("luty", "february");
		tmpm.time=tmpm.time.replace("marzec", "march");
		tmpm.time=tmpm.time.replace("kwiecień", "april");
		tmpm.time=tmpm.time.replace("kwietnia", "april");
		tmpm.time=tmpm.time.replace("maj", "may");
		tmpm.time=tmpm.time.replace("czerwiec", "june");
		tmpm.time=tmpm.time.replace("czerwca", "june");
		tmpm.time=tmpm.time.replace("lipiec", "july");
		tmpm.time=tmpm.time.replace("sierpień", "august");
		tmpm.time=tmpm.time.replace("wrzesień", "september");
		tmpm.time=tmpm.time.replace("październik", "october");
		tmpm.time=tmpm.time.replace("listopad", "november");
		tmpm.time=tmpm.time.replace("grudzień", "december");
		tmpm.time=new Date(tmpm.time+"00"); /*FIXME*/
		
		if(tmpm.time=="Invalid Date")
		{
			if(tmpm.time=="Invalid Date")
				console.error("ERROR.")
			console.log("ss:'"+cm.substring(p, k)+"'")
			console.log("msg: "+cm)
			console.log("omsg:"+messages[j])
			console.log("j="+j)
// 			fs.writeFile("bug.lol", messages[j])
			break;
		}
		
		p=body_begin;
		k=cm.indexOf('</p>', p);
		
		tmpm.body=cm.substring(p, k)
		
//     console.log(tmpm.author+" @ "+tmpm.time+": "+tmpm.body)
		
		main[thread_id].messages.push(tmpm);
  }
}
fs.writeFile("parsed.json", JSON.stringify(main))
console.log("typed "+count+" chars")
