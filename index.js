var stt, tracks = null;
var margin = [window.innerWidth * .05, window.innerWidth * .8];
var key_timer = {"37": 0, "38": 0, "39": 0, "40": 0};
var morse_dict = {
	"a": "01",
	"b": "1000",
	"c": "1010",
	"d": "100",
	"e": "0",
	"f": "0010",
	"g": "110",
	"h": "0000",
	"i": "00",
	"j": "0111",
	"k": "101",
	"l": "0100",
	"m": "11",
	"n": "10",
	"o": "111",
	"p": "0110",
	"q": "1101",
	"r": "010",
	"s": "000",
	"t": "1",
	"u": "001",
	"v": "0001",
	"w": "011",
	"x": "1001",
	"y": "1011",
	"z": "1100"
};
var freq_dict = {
	"a": 220,
	"b": 246.94,
	"c": 261.63,
	"d": 293.67,
	"e": 329.63,
	"f": 349.23,
	"g": 392,
	"h": 440,
	"i": 493.88,
	"j": 523.25,
	"k": 587.33,
	"l": 196,
	"m": 174.61,
	"n": 164.81,
	"o": 146.83,
	"p": 277.18,
	"q": 311.13,
	"r": 233.08,
	"s": 207.65,
	"t": 880,
	"u": 932.33,
	"v": 987.77,
	"w": 110,
	"x": 116.54,
	"y": 123.47,
	"z": 130.81
};

var STT_TEXT = document.getElementById("stt-text");
var REG_TEXT = document.getElementById("reg-text");

function STT() {
	this.obj = new p5.SpeechRec();
	this.started = false;
	this.speech = "";
	this.reg_it = 0;
	this.screen_it = 0;
	this.screen_it_pos = margin[0];
	this.reg_speech = "";

	this.dash_width = 45;
	this.dot_width = 30;
	this.space_width = 25;
	this.gap_width = 10;

	this.notes = [];
	this.hold = false;
	this.correct = true;

	this.draw = function() {
		stroke("#fff");
		strokeWeight(1);
		line(this.screen_it_pos, 0, this.screen_it_pos, height);
	}
	this.draw_notes = function(tracks) {
		let i = 0;
		let idx = 0;
		while(i < this.notes.length && this.screen_it_pos < width) {
			let note = this.notes[i];
			if(note.length === 0) {
				this.screen_it_pos += this.space_width;
				i++;
				continue;
			}

			idx = note[0];
			for(let j = 2; j < note.length; j++) {
				if (note[j] === 0) {
					tracks[idx].draw_dot(this.screen_it_pos, this.dot_width);
					this.screen_it_pos += this.dot_width;
				}
				else {
					tracks[idx].draw_dash(this.screen_it_pos + this.dot_width / 2, this.dash_width, this.dot_width);
					this.screen_it_pos += (this.dash_width + this.dot_width);
				}
			}
			this.screen_it_pos += this.gap_width;

			i++;
		}

		this.screen_it_pos = margin[0];
	}

	this.start_callback = function() {
		this.started = true;
		logger("speech to text started");
	};
	this.speech_callback = function() {
		let res_str = this.obj.resultString;
		logger(res_str);

		if (this.speech != "") this.speech += " " + res_str;
		else this.speech += res_str;
		STT_TEXT.innerHTML = this.speech;

		let idx = 0;
		let freq = 0.0;
		let c = "";
		for(let i in res_str) {
			c = res_str[i].toLowerCase();
			if (!c.match(/[a-z]/i)) {
				// this.notes.push([]);
				continue;
			}

			idx = c.charCodeAt(0) % 4;
			morse = morse_dict[c];
			// logger(c + morse);
			freq = freq_dict[c];
			let note = [idx, freq];
			for(let d in morse) {
				d = morse[d];
				if (d === "0") {
					note.push(0);
				}
				else {
					note.push(1);
				}
			}

			this.notes.push(note);
		}
	};
	this.assign_callbacks = function() {
		this.obj.onStart = this.start_callback.bind(this);
		this.obj.onResult = this.speech_callback.bind(this);
	}
}

function Track(osc_type="triangle", color="#2d2d2d", pos=0) {
	this.osc = new p5.Oscillator(osc_type);
	this.color = color;
	this.pos = pos;

	this.draw = function() {
		stroke(this.color);
		strokeWeight(1);
		line(0, this.pos, margin[1], this.pos);
	}
	this.draw_dot = function(x, dot_width) {
		fill(this.color);
		noStroke();
		circle(x + dot_width / 2, this.pos, dot_width);
	}
	this.draw_dash = function(x, dash_width, dash_height) {
		stroke(this.color);
		strokeCap(ROUND);
		strokeWeight(dash_height);
		line(x, this.pos, x + dash_width, this.pos);
	}

	this.play = function(freq, amp=.2) {
		logger("playing sounds");
		this.osc.start();
		this.osc.freq(freq, .1);
		this.osc.amp(amp, .1);
	}
	this.stop = function(hold=false) {
		if (hold) this.osc.stop(0);
		else this.osc.stop(.6);
	}
}

function logger(content, do_print=true) {
	if (do_print)
		console.log(content)
}

function preload() {
	
}

function setup() {	
	stt = new STT();
	stt.obj.continuous = true;
	stt.assign_callbacks();

	let cnv = createCanvas(windowWidth, windowHeight);
	cnv.parent("p5-container");

	background("#000");	

	tracks = [];
	let track_colors = ["#ff00ff", "#00ffff", "#ffff00", "#fff"];
	for(let i = 0; i < 4; i++) {
		tracks.push(new Track(undefined, track_colors[i], height / 5 * (i + 1)));
	}
}

function draw() {
	background("#000");

	for(let i = 0; i < tracks.length; i++) {
		tracks[i].draw();
	}

	stt.draw_notes(tracks);
	stt.draw();

	for(let key in key_timer) {
		if (keyIsDown(parseInt(key))) {
			logger(key + " is down for " + key_timer[key]);
			key_timer[key] += deltaTime;
		}
	}
}

function audio_context_callback() {
	logger("audio context started by user");
}

function keyPressed() {
	logger("key pressed: " + key);

	if (keyCode === 32) {
		if (!stt.started) {
			stt.obj.start();
		}
	}

	if (stt.notes.length > 0) {
		let note = stt.notes[0];
		let track_idx = note[0];
		let freq = note[1];

		if (track_idx === 0 && keyCode === LEFT_ARROW || track_idx === 1 && keyCode === UP_ARROW ||
			track_idx === 2 && keyCode === RIGHT_ARROW || track_idx === 3 && keyCode === DOWN_ARROW) {
			userStartAudio(undefined, audio_context_callback);
			tracks[track_idx].play(freq);
		}
		else {
			stt.correct = false;
		}
		if (note[2] === 0 && (keyCode === LEFT_ARROW || keyCode === UP_ARROW || keyCode === RIGHT_ARROW ||
			keyCode === DOWN_ARROW)) {
			note.splice(2, 1);
		}
		if (note[2] === 1 && (keyCode === LEFT_ARROW || keyCode === UP_ARROW || keyCode === RIGHT_ARROW ||
			keyCode === DOWN_ARROW)) {
			stt.hold = true;
		}

		if (note.length < 3) {
			stt.notes.shift();
			if (stt.correct) {
				REG_TEXT.innerHTML += stt.speech[0];
			}
			if (stt.speech[1] == " ") stt.speech = stt.speech.substring(2);
			else stt.speech = stt.speech.substring(1);
			STT_TEXT.innerHTML = stt.speech;
			stt.correct = true;
		}
	}

	// if (keyCode === UP_ARROW) {
	// 	tracks[0].play(261.626);
	// }

	// if (keyCode === DOWN_ARROW) {
		
	// }
}

function keyReleased() {
	if (stt.notes.length > 0) {
		let note = stt.notes[0];
		if (note[2] === 1 && stt.hold && (keyCode === LEFT_ARROW || keyCode === UP_ARROW || keyCode === RIGHT_ARROW ||
			keyCode === DOWN_ARROW)) {
			note.splice(2, 1);
			stt.hold = false;

			if (key_timer[keyCode] < 750) {
				stt.correct = false;
			}
		}
		if (note.length < 3) {
			stt.notes.shift();
			if (stt.correct) {
				REG_TEXT.innerHTML += stt.speech[0];
			}
			if (stt.speech[1] == " ") stt.speech = stt.speech.substring(2);
			else stt.speech = stt.speech.substring(1);
			STT_TEXT.innerHTML = stt.speech;
			stt.correct = true;
		}
	}

	if (keyCode === LEFT_ARROW) {
		key_timer["37"] = 0;
		tracks[0].stop(true);
	}

	if (keyCode === UP_ARROW) {
		key_timer["38"] = 0;
		tracks[1].stop(true);
	}

	if (keyCode === RIGHT_ARROW) {
		key_timer["39"] = 0;
		tracks[2].stop(true);
	}

	if (keyCode === DOWN_ARROW) {
		key_timer["40"] = 0;
		tracks[3].stop(true);
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

