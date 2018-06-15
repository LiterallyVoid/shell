var txtentry = document.getElementById('text-entry');
var prompt = document.getElementById('prompt');

var cwd = "/";
prompt.innerText = cwd + "$ ";

function Filesystem(contents) {
    this.contents = contents;
    this.file = function(path) {
	path = this.normalize(path);
	var base = this.contents;
	path = path.split(/\/+/);
	if(path[path.length - 1] == '') {
	    path = path.slice(0, path.length - 1);
	}
	for(var i = 1; i < path.length; i++) {
	    if(base.type == "dir") {
		if(base.contents[path[i]] == undefined) {
		    return;
		}
		base = base.contents[path[i]];
		if(base == undefined) {
		    return;
		}
	    } else {
		return;
	    }
	}
	return base;
    };
    this.splitbasedir = function(path) {
	path = path.split(/\/+/);
	return [path.slice(0, path.length - 1).join('/'), path[path.length - 1]];
    };
    this.list = function(path) {
 	path = this.normalize(path);
	var file = this.file(path);
	if(file && file.type == "dir") {
	    var files = [];
	    var k = Object.keys(file.contents);
	    for(var i = 0; i < k.length; i++) {
		files.push({
		    name: k[i],
		    type: file.contents[k[i]].type,
		    contents: file.contents[k[i]].contents,
		});
	    }
	    return files;
	} else {
	    return [];
	}
    };
    this.normalize = function(path) {
	console.log(path);
	var abs = path[0] == '/';
	path = path.split(/\/+/);
	var o = [];
	for(var i = 0; i < path.length; i++) {
	    if(path[i] == '..') {
		o.pop();
	    } else if(path[i] == '.') {
	    } else {
		o.push(path[i]);
	    }
	}
	if(abs) {
	    if(o[0] != '') {
		o.unshift('');
	    }
	    if(o[1] != '' && o.length == 1) {
		o.unshift('');
	    }
	}
	return o.join('/');
    };
    this.join = function(a, b) {
	if(a == '') {
	    return this.normalize(b);
	}
	return this.normalize(a + "/" + b);
    };
};

var fs = new Filesystem({
    type: "dir",
    contents: {
	"README.txt": {
	    type: "file",
	    contents: "My homepage.\nPlease don't break anything =)"
	},
	"info": {
	    type: "file",
	    contents: "AAAAAAAA\nAAAAAAAA\nAAAAAAAA\nAAAAAAAA"
	},
	"data": {
	    type: "dir",
	    contents: {
		"file.txt": {
		    type: "file",
		    contents: "Hello!"
		},
	    },
	}
    }
});

function print(t) {
    t = t.replace(/ /g, '\u00A0');
    var holder = document.getElementById('text-holder');
    var el = document.createElement('span');
    el.className = 'text';
    el.innerText = t;
    el.innerHTML = el.innerHTML.replace(/\x01/g, "<").replace(/\x02/g, ">").replace(/(<[a-zA-Z0-9 =\"\&\;]*>)/g, function(c) {
	return c.replace(/&nbsp;/, ' ');
    });
    holder.insertBefore(el, holder.children[holder.children.length - 1]);
    el.outerHTML += '<br/>';
    window.scrollTo(0, document.body.scrollHeight);
};

function runCommand(arg) {
    switch(arg[0]) {
    case "echo":
	print(arg.slice(1).join(" "));
	break;
    case "ls":
	if(arg.length == 1) {
	    print(fs.list(cwd).map(f => (f.type == "dir" ? (f.name + "/") : f.name)).join("\n"));
	} else {
	    for(var i = 1; i < arg.length; i++) {
		var a = arg[i];
		var next = fs.join(cwd, a);
		if(fs.file(next) != undefined) {
		    print(fs.list(next).map(f => (f.type == "dir" ? (f.name + "/") : f.name)).join("\n"));
		}
	    }
	}
	break;
    case "pwd":
	print(cwd);
	break;
    case "cat":
	for(var i = 1; i < arg.length; i++) {
	    var f = fs.file(fs.join(cwd, arg[i]));
	    if(f.type == "file") {
		print(f.contents);
	    }
	}
	break;
    case "cd":
	for(var i = 1; i < arg.length; i++) {
	    var a = arg[i];
	    var next = fs.join(cwd, a);
	    if(fs.file(next) != undefined) {
		cwd = next;
	    }
	}
	break;
    default:
	print("\x01span class=\"red\"\x02error:\x01/span\x02 command not found: " + arg[0]);
    }
    prompt.innerText = cwd + "$ ";
};

function exec(t) {
    t = t.replace(/\u00A0/g, ' ');
    var args = t.split(/[ \t]+/g);
    runCommand(args);
};

function tabComplete(txt) {
    txt = txt.replace(/\u00A0/, ' ');
    var s = txt.split(/ +/g);
    var cmd = s[0];
    s = s[s.length - 1];
    var sl = s.length;
    var split = fs.splitbasedir(s);
    var dir = cwd;
    if(split[0] != '') {
	dir = fs.join(cwd, split[0]);
    }
    var files = fs.list(dir);
    var match = files.filter((file) => {
	if((file.type == "dir" && (cmd == "cd" || cmd == "ls")) || cmd == "cat") {
	    return file.name.startsWith(split[1]);
	}
	return false;
    });
    if(match.length == 1) {
	s = fs.join(split[0], match[0].name);
	var f = fs.file(fs.join(cwd, s));
	if(f.type == "dir") {
	    s += '/';
	}
    }
    txt = txt.substr(0, txt.length - sl) + s;
    return txt.replace(/ /g, '\u00A0');
};

document.onkeypress = function(e) {
    var ch = String.fromCharCode(e.charCode);
    if(e.charCode == 13) {
	print(prompt.innerText + txtentry.innerText);
	exec(txtentry.innerText);
	txtentry.innerText = '';
    } else if(e.charCode == 127) {
    } else if(e.charCode == 32) {
	txtentry.innerText += '\u00A0';
    } else {
	txtentry.innerText += ch;
    }
};

document.onkeydown = function(e) {
    if(e.keyCode == 8) {
	var txt = txtentry.innerText;
	txtentry.innerText = txt.substr(0, txt.length - 1);
    } else if(e.keyCode == 9) {
	txtentry.innerText = tabComplete(txtentry.innerText);
	e.preventDefault();
    }
};
