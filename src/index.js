import _ from 'lodash';
import Pitchfinder from 'pitchfinder';
import Vex from 'vexflow';
import { kizNey, wnotes } from './freqs';
import { segah } from './makam';
import './style.css';

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const detectPitch = Pitchfinder.YIN();

// var currentMakamNey = makamFilter(kizNey, segah);
var currentMakamNey = kizNey;

function makamFilter(notes, makam) {
  return _.filter(notes, x => _.find(makam, mn => x.n === mn) !== undefined);
}

function canvas() {
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.id = 'canvas';
  return canvas;
}

function vexflow() {
  const div = document.createElement('div');
  div.id = 'vex-container';
  return div;
}

function component() {
  const component = document.createElement('div');
  component.class = 'fullsize';
  component.appendChild(canvas());
  component.appendChild(vexflow());
  return component;
}

document.body.appendChild(component());

window.onload = () => {
  if (navigator.getUserMedia) {
     console.log('getUserMedia supported.');

     //const btn = document.getElementById('start-session');
     //btn.addEventListener('click', () => initialize());
     initialize();
  } else {
     console.log('getUserMedia not supported on your browser!');
  }
};

window.onresize = () => {
  updateCanvasSize();
}

function setDarkTheme(context) {
  context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
  context.setFillStyle('white');
  context.setStrokeStyle('white');
}

function setLightTheme(context) {
  context.setFont("Arial", 10, "").setBackgroundFillStyle("#333");
  context.setFillStyle('black');
  context.setStrokeStyle('black');
}

function initVex() {
  const VF = Vex.Flow;

  // Create an SVG renderer and attach it to the DIV element named "boo".
  const div = document.getElementById("vex-container")
  const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

  // Configure the rendering context.
  renderer.resize(window.innerWidth, window.innerHeight);
  const context = renderer.getContext();
  setLightTheme(context);

  const notesWidth = window.innerWidth-50;
  const notesPerStave = Math.round(notesWidth / 50);
  // const notesPerStave = 3;
  const stavesPerPage = Math.round(window.innerHeight/100) - 1;
  const notesPerPage = notesPerStave * stavesPerPage;
  console.log("notesPerStave", notesPerStave);
  console.log("stavesPerPage", stavesPerPage);
  console.log("notesPerPage", notesPerPage);

  const notes = [];

  const renderCurrent = () => {
    context.clear();

    const notesAmount = notes.length % notesPerPage == 0
      ? notesPerPage : notes.length % notesPerPage;

    const chunks = _.chunk(_.takeRight(notes, notesAmount), notesPerStave);

    _.times(stavesPerPage-chunks.length, () => chunks.push([]));

    _.forEach(chunks,
      (notesChunk, i) => {
        const stave = new VF.Stave(10, 40+i*100, notesWidth);
        stave.addClef("treble")
        stave.setContext(context).draw();

        const voice = new VF.Voice().setStrict(false);
        voice.addTickables(notesChunk);
        const formatter = new VF.Formatter().joinVoices([voice]).format([voice], notesWidth-50);
        voice.draw(context, stave);
    });
  };

  return {
    renderCurrent,

    addNote: (n, acc) => {
      const lastNote = _.last(notes);
      if (lastNote !== undefined) {
        const lastN = lastNote.keys[0];
        const lastM = lastNote.modifiers.length > 0
          ? lastNote.modifiers[0].type : undefined;
        if (n !== lastN || acc !== lastM) {
          console.log("pushing...", "new note", n, acc, "last note", lastN, lastM);
          notes.push(createStaveNote(VF, n, acc));
        } else {
          console.log("skipping...", "new note", n, acc, "last note", lastN, lastM);
        }
      } else {
        console.log("pushing...");
        notes.push(createStaveNote(VF, n, acc));
      }
      renderCurrent();
    }
  };
}

function createStaveNote(VF, n, acc) {
  const staveNote = new VF.StaveNote({ keys: [n], duration: "q" });
  if (acc) {
    staveNote.addAccidental(0, new VF.Accidental(acc));
  }
  return staveNote;
}

function generateRandomNotes(VF, n) {
  const randomNotes = [];
  for (var i = 0; i < n; i++) {
    const randomNote = Math.round(Math.random(wnotes.length));
    const n = randomNote['n'];
    const acc = randomNote['m'];
    const staveNote = new VF.StaveNote({ keys: [n], duration: "q" });
    if (acc) {
      staveNote.addAccidental(0, new VF.Accidental(acc));
    }
    randomNotes.push(staveNote);
  }
  return randomNotes;
}

let vexComponent;

const initialize = () => {
  vexComponent = initVex();

  const canvas = document.getElementById('canvas');
  const canvasCtx = canvas.getContext('2d');
  const audioCtx = new AudioContext();
  console.log(audioCtx.sampleRate);
  navigator.getUserMedia (
     { audio: true, video: false },

     stream => {
        const source = audioCtx.createMediaStreamSource(stream);
        const bufferLength = 2048;
        const analyser = audioCtx.createAnalyser();
        const pitchDetector = new (Module().AubioPitch)('default', bufferLength, 1, audioCtx.sampleRate);

        source.connect(analyser);
        updateCanvasSize();

        vexComponent.renderCurrent();
        render(null, canvas, canvasCtx, createAnalyser(bufferLength, analyser), pitchDetector);
     },

     err => console.log('The following gUM error occured: ' + err)
  );
};

const createAnalyser = (bufferLength, analyser) => {
  return {
    _analyser: analyser,
    bufferLength,
    getTimeData: () => {
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);
      return dataArray;
    },
    getFloatTimeData: () => {
      const dataArray = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(dataArray);
      return dataArray;
    },
    getFrequencyData: () => {
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);
      return dataArray;
    }
  };
};

const render = (timestamp, canvas, canvasCtx, analyser, pitchDetector) => {
  window.requestAnimationFrame((timestamp) => render(timestamp, canvas, canvasCtx, analyser, pitchDetector));

  if (timestamp == null) {
    return;
  }

  clearScreen(canvas, canvasCtx);
  renderWave(canvas, canvasCtx, analyser.getTimeData(), analyser.bufferLength);
  renderFreqs(canvas, canvasCtx, analyser.getFrequencyData(), analyser.bufferLength);
  renderPitch(canvas, canvasCtx, pitchDetector.do(analyser.getTimeData()));

  detectNote(timestamp, pitchDetector.do(analyser.getTimeData()), note => {
    const v = _.filter(wnotes, x => x.f === note.f)[0];
    vexComponent.addNote(v.n, v.m);
  });
  renderTime(canvas, canvasCtx, timestamp);

  // renderTimeFreqDiagram(canvas, canvasCtx, timestamp, pitchDetector.do(analyser.getTimeData()));
};


const renderWave = (canvas, canvasCtx, dataArray, bufferLength) => {
  canvasCtx.lineWidth = 2;
  // canvasCtx.strokeStyle = 'rgb(80, 80, 80)'; dark theme
  canvasCtx.strokeStyle = 'rgb(200, 200, 200)';

  canvasCtx.beginPath();

  const sliceWidth = canvas.width * 2 / bufferLength;
  var x = 0;

  for(var i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = v * canvas.height / 2;

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  canvasCtx.lineTo(canvas.width, canvas.height/2);
  canvasCtx.stroke();
}

const clearScreen = (canvas, canvasCtx, fillStyle) => {
  canvasCtx.fillStyle = fillStyle === undefined ? 'rgb(255, 255, 255)' : fillStyle;
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
}

const renderFreqs = (canvas, canvasCtx, dataArray, bufferLength) => {
  const barWidth = (canvas.width / bufferLength) * 9;
  var x = 0;
  const a = canvas.height / 256.0;

  for (var i = 0; i < bufferLength; i++) {
    const v = dataArray[i];
    const y = v * a;

    canvasCtx.fillStyle = 'rgba(50,50,50, 0.05)';
    canvasCtx.fillRect(x, canvas.height - y, barWidth, y);

    x += barWidth + 1;
  }
}

const renderPitch = (canvas, canvasCtx, pitch) => {
  if (pitch <= 0) { return; }

  const v = _.minBy(_.map(currentMakamNey, x => ({ f: x.f, d: Math.abs(x.f - pitch), n: x.n })), 'd');
  const diff = v.f - pitch;

  if (Math.abs(diff) < 150) {
    canvasCtx.fillStyle = 'rgba(255, 255, 255)';

    renderText(canvas, canvasCtx, '100px sans', 'center', v.n, canvas.width/2, canvas.height/2);
    renderText(canvas, canvasCtx, '20px sans', 'center', Math.round(diff*100)/100, canvas.width/2, canvas.height/2+60);
    renderText(canvas, canvasCtx, '40px sans', 'center', Math.round(pitch) + ' Hz', canvas.width/2, canvas.height/2+110);
  }
};

var startTimestamp;

const renderTimeFreqDiagram = (canvas, canvasCtx, timestamp, pitch) => {
  if (pitch <= 0) { return; }

  if (startTimestamp === undefined) {
    startTimestamp = timestamp;
  }

  const v = getNearestNoteByPitch(pitch);
  const diff = v.f - pitch;

  var x = (timestamp - startTimestamp) / 10 + 20;
  if (x > canvas.width - 40) {
    clearScreen(canvas, canvasCtx, 'white');
    x = 20;
    startTimestamp = timestamp;
  }

  const y = Math.abs( (canvas.height / (_.last(currentMakamNey).f + 100)) * v.f - canvas.height )

  canvasCtx.fillStyle = 'rgb(50,50,50)';
  canvasCtx.beginPath();
  canvasCtx.arc(x,y,2,0,2*Math.PI);
  canvasCtx.fill();
};

function getNearestNote(arrayOfNotes) {
  const nearestNotes = _.map(arrayOfNotes, n => getNearestNoteByPitch(n.y));
  const notesByFreq = _.groupBy(nearestNotes, 'f');
  const freqs = Object.keys(notesByFreq);
  const target = _.maxBy(_.map(freqs, f => ({f: Number(f), c: notesByFreq[f].length})), 'c');
  const targetNote = _.find(currentMakamNey, x => x.f === target.f);
  return targetNote;
}

function getNearestNoteByPitch(pitch) {
  return _.minBy(_.map(currentMakamNey, x => ({ f: x.f, n: x.n, d: Math.abs(x.f - pitch) })), 'd');
}

const detectNote = (() => {
  const win_length = 30;
  const current_win = [];
  var last_seconds_timestamp = 0;

  return (timestamp, pitch, callback) => {
    if (current_win.length == win_length) { current_win.shift(); }
    current_win.push({ x: timestamp, y: pitch });

    if (last_seconds_timestamp === 0) {
      last_seconds_timestamp = timestamp;
    }

    const v = getNearestNote(current_win, pitch);
    const diff = v.f - pitch;

    if (timestamp - last_seconds_timestamp >= 2) {
      last_seconds_timestamp = timestamp;
      if (Math.abs(diff) < 150) {
        callback(v);
      }
    }
  };
})();

function renderTime(canvas, canvasCtx, timestamp) {
  const seconds = timestamp / 1000;
  const s = Math.round(seconds % 60);
  const m = Math.round((seconds / 60) % 60);
  const h = Math.round((seconds / 60 / 60) % 24);
  const time = h + 'h ' + m + 'm ' + s + 's';
  renderText(canvas, canvasCtx, '20px sans', 'right', time, canvas.width - 20, 40);
}


function renderText(canvas, canvasCtx, style, align, text, x, y) {
  canvasCtx.fillStyle = 'rgba(100, 100, 100, 0.9)';
  canvasCtx.font = style;
  canvasCtx.textAlign = align;
  canvasCtx.fillText(text, x, y);
}

const updateCanvasSize = () => {
  const canvas = document.getElementById('canvas');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
