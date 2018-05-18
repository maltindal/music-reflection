import _ from 'lodash';

import Pitchfinder from 'pitchfinder';

import UI from './ui';
import Sheet from './sheet';
import Note from './note';
import Viz from './viz';

import { kizNey, wnotes } from './freqs';
import { segah, hicaz, makamFilter } from './makam';

import './style.css';

window.AudioContext = window.AudioContext || window.webkitAudioContext;
const detectPitch = Pitchfinder.YIN();
let currentMakamNey = makamFilter(kizNey, segah);
// let currentMakamNey = makamFilter(kizNey, hicaz);
// let currentMakamNey = kizNey;
UI.render();
let sheet = Sheet.init();

window.onload = () => {
  if (navigator.getUserMedia) {
     console.log('getUserMedia supported.');
     initialize();
  } else {
     console.log('getUserMedia not supported on your browser!');
  }
};

window.onresize = () => {
  updateCanvasSize();
}

const initialize = () => {
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

        sheet.renderCurrent();
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
  Viz.renderWave(canvas, canvasCtx, analyser.getTimeData(), analyser.bufferLength);
  Viz.renderFreqs(canvas, canvasCtx, analyser.getFrequencyData(), analyser.bufferLength);
  Viz.renderPitch(canvas, canvasCtx, pitchDetector.do(analyser.getTimeData()), currentMakamNey);
  Viz.renderTime(canvas, canvasCtx, timestamp);

  Note.detectNote(timestamp, pitchDetector.do(analyser.getTimeData()), currentMakamNey, note => {
    const v = _.filter(wnotes, x => x.f === note.f)[0];
    sheet.addNote(v.n, v.m);
  });
};

const clearScreen = (canvas, canvasCtx, fillStyle) => {
  canvasCtx.fillStyle = fillStyle === undefined ? 'rgb(255, 255, 255)' : fillStyle;
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
}

const updateCanvasSize = () => {
  const canvas = document.getElementById('canvas');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
