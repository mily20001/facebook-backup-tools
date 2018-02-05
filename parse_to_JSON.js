var fs=require("fs")
var ProgressBar = require('progress');

var generate_stats=1;

console.log("opening file..")

const filesToParse = fs.readdirSync('facebook_data/messages/').filter((file) => /(.*\.html)$/.test(file));

console.log(filesToParse);

// var file=fs.readFileSync("test.html").toString()
// var file=fs.readFileSync("messages.htm").toString()

var idToNames = JSON.parse(fs.readFileSync("id_to_name.json").toString());


var threads=filesToParse.map((filename) => fs.readFileSync(`facebook_data/messages/${filename}`).toString().split('<div class="thread">')[1]);

var main=[];
/*
 * 0: {
 *      participants=["blah", "blah2"],
 *      first_message=1406714685263,
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

function getNameFromId(id) {
    if(idToNames[id] === undefined)
        return id;
    return idToNames[id];
}

function add_thread(participants)
{
	var id;
	for(var i in main)
	{
		var found=true;
		
		if(main[i].participants.length!=participants.length)
			continue;
			
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
	tmpobj.first_message=140671468526300;
	
// 	console.log("adding new thread")
	
	return main.push(tmpobj)-1;
}

var count=0;

var pbar = new ProgressBar('parsing [:bar] :percent :elapseds', { total: threads.length, current: 0, width: 30, incomplete: " " });

threads.forEach((thread) => {
    pbar.tick();

    const title = thread.substring(4, thread.indexOf('</h3>'));
    const tmpThread = thread.substring(thread.indexOf('</h3>')+5)
    const participants = tmpThread.substring(0, tmpThread.indexOf('<')).substring('Participants: '.length).split(', ');
    
    if(participants.length === 0) {
        console.log(title);
    }

    const parsedThread = {
        participants,
        first_message: 140671468526300,
        messages: [],
    };
  
    const messages=thread.split('<div class="message">').slice(1);
    
    messages.forEach((cm) => {
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
        var datestring="";
        tmpm.author=cm.substring(p, k)
        
        p=cm.indexOf('<span class="meta">', k)+19;
        k=cm.indexOf('</span>', p);
        
        datestring=cm.substring(p, k);
        datestring=datestring.replace(" o ", " ");
        datestring=datestring.replace("styczeń", "january");
        datestring=datestring.replace("stycznia", "january");
        datestring=datestring.replace("lutego", "february");
        datestring=datestring.replace("luty", "february");
        datestring=datestring.replace("marzec", "march");
        datestring=datestring.replace("marca", "march");
        datestring=datestring.replace("kwiecień", "april");
        datestring=datestring.replace("kwietnia", "april");
        datestring=datestring.replace("maj", "may");
        datestring=datestring.replace("maja", "may");
        datestring=datestring.replace("czerwiec", "june");
        datestring=datestring.replace("czerwca", "june");
        datestring=datestring.replace("lipiec", "july");
        datestring=datestring.replace("lipca", "july");
        datestring=datestring.replace("sierpień", "august");
        datestring=datestring.replace("sierpnia", "august");
        datestring=datestring.replace("wrzesień", "september");
        datestring=datestring.replace("września", "september");
        datestring=datestring.replace("październik", "october");
        datestring=datestring.replace("listopad", "november");
        datestring=datestring.replace("grudzień", "december");
        datestring=datestring.replace("grudnia", "december");
        tmpm.time=new Date(datestring+"00"); /*FIXME*/
        
        if(tmpm.time=="Invalid Date")
        {
            if(tmpm.time=="Invalid Date")
                console.error("ERROR.")
            console.log("ss:'"+cm.substring(p, k)+"'")
            console.log("datestring:'"+datestring+"'")
            console.log("msg: "+cm)
            console.log("omsg:"+messages[j])
            console.log("j="+j)
    // 			fs.writeFile("bug.lol", messages[j])
//             break;
        }
        
        
        
        p=body_begin;
        k=cm.indexOf('</p>', p);
        
        tmpm.body=cm.substring(p, k)
        
        if(tmpm.body.length > 0)
        {
        
            if(parsedThread.first_message>tmpm.time)
            {
                parsedThread.first_message=tmpm.time;
            }
            
        //     console.log(tmpm.author+" @ "+tmpm.time+": "+tmpm.body)
            
            parsedThread.messages.push(tmpm);
        }
    });
    
    main.push(parsedThread);
});

function max(a, b)
{
	if(parseInt(a)>parseInt(b))
		return a;
	return b;
}

if(generate_stats)
{
	console.log("generating stats..");
	var stats={}; //per conversation
	var global_stats={};
	var people_list=[];
	
	var plain_stats={
		total_chars:0,
		max_chars: 0,
		total_words: 0,
		max_words: 0,
		longest_word: "",
		longest_word_l: 0,
		total_messages: 0,
	}
	
	global_stats=JSON.parse(JSON.stringify(plain_stats)); //xD
	
	for(var thread in main)
	{
		people_list.push(main[thread].participants)
		var c_stats=JSON.parse(JSON.stringify(plain_stats));
		for(var message in main[thread].messages)
		{
			var chars=0, words=0;
			chars=main[thread].messages[message].body.length;
			words=main[thread].messages[message].body.split(" ");
			for(var w in words)
				if(words[w].length>c_stats.longest_word_l)
				{
					c_stats.longest_word_l=words[w].length;
					c_stats.longest_word=words[w];
				}
			
			c_stats.total_chars+=chars;
			c_stats.total_words+=words.length;
			c_stats.max_chars=max(c_stats.max_chars, chars);
			c_stats.max_words=max(c_stats.max_words, words.length)
		}
		
		c_stats.total_messages=main[thread].messages.length;
		
		global_stats.total_chars+=c_stats.total_chars;
		global_stats.total_words+=c_stats.total_words;
		global_stats.total_messages+=c_stats.total_messages;
		global_stats.max_chars=max(c_stats.max_chars, global_stats.max_chars);
		global_stats.max_words=max(c_stats.max_words, global_stats.max_words);
		global_stats.longest_word_l=max(global_stats.longest_word_l, c_stats.longest_word_l);
		
		stats[main[thread].participants]=c_stats;
// 		console.log("stats:")
// 	console.log("Total words:"+c_stats.total_words+" Total chars:"+c_stats.total_chars+" Max chars per msg:"+c_stats.max_chars+" max words per msg:"+c_stats.max_words+" Longest word:"+c_stats.longest_word+"("+c_stats.longest_word_l+")")
	}
	console.log("global stats:")
	console.log("Total words:"+global_stats.total_words+" Total chars:"+global_stats.total_chars+" Max chars per msg:"+global_stats.max_chars+" max words per msg:"+global_stats.max_words+" Longest word:"+global_stats.longest_word_l);
	
	fs.writeFile("people_list.json", JSON.stringify(people_list));
	fs.writeFile("stats.json", JSON.stringify(stats));
	fs.writeFile("global_stats.json", JSON.stringify(global_stats));
}




console.info("converting to JSON..")

main=JSON.stringify(main)

console.info("saving..")

fs.writeFile("parsed.json", main) //so slow

