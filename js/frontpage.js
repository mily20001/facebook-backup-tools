/*==================================================================================*
 *                                   Completion box                                 *
 *==================================================================================*/
  
function check_text(focused)
{
	if(!focused)
	{
		document.getElementById("cmpltions").style.height=0;
		document.getElementById("cmpltions").style.opacity=0;
		document.getElementById("hider1").style.height="25px";
		return
	}
	var tmp=completions.filter(function(element, index, array)
	{
		return (element.toString().toLowerCase().search(document.getElementById("texttest").value.toLowerCase())>-1) && index<15 /*max amount of sugesstions*/
	});
	console.log(tmp);
	
	var tmphtml=""

	for(i in tmp)
	{
		tmphtml+='<div class="completion" onclick="complete(\''+tmp[i]+'\'); console.log(\'xD\')">'+tmp[i]+'</div>';
	}
	
	document.getElementById("cmpltions").innerHTML=tmphtml;
	
	document.getElementById("cmpltions").style.height=20*tmp.length;
	
	document.getElementById("hider1").style.height=20*tmp.length+27+"px";
	
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

var completions=[
"Penelope Canale",
"Wendi Gehring",
"Alix Reetz",
"Bette Bromberg",
"Enda Hertel",
"Jamee Engels",
"Raven Alcantara",
"Bertha Burgoon",
"Xiao Bolster",
"Millard Harrelson",
"Evita Mcauley",
"Thelma Leja",
"Annalisa Rollman",
"Cortez Swart",
"Jacalyn Stano",
"Kathey Stinebaugh",
"Jimmy Ripple",
"Dean Colunga",
"Mitchell Eccles",
"Boyd Sheley",
]

function completion_div_focus(isIt, id)
{
	if(isIt)
		id.parentElement.className="focused_completion_div";
	else
		id.parentElement.className="not_focused_completion_div";
}

/*==================================================================================*
 *                                      Main menu                                   *
 *==================================================================================*/
  
function hider1(show)
{
	var el=document.getElementById("hider1");
	
	if(show)
		el.style.height="25px";
	else
		el.style.height="0px";
}

hider1(false)
  
/*==================================================================================*
 *                                  Multiple buttons                                *
 *==================================================================================*/

function setup_buttons()
{
	var button_containers=document.getElementsByClassName("button_container");
	for(var key=0; key<button_containers.length; key++)
	{
		var container=button_containers[key];
		container.style["line-height"]=container.style.height
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
