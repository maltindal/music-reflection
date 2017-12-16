import _ from 'lodash';
import Pitchfinder from 'pitchfinder';
import './style.css';
import { kizNey } from './freqs';

const detectPitch = Pitchfinder.YIN();

function canvas() {
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.id = 'canvas';
  return canvas;
}

function component() {
  const component = document.createElement('div');
  component.class = 'fullsize';
  component.appendChild(canvas());
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

const initialize = () => {
  const canvas = document.getElementById('canvas');
  const canvasCtx = canvas.getContext('2d');
  const audioCtx = new AudioContext();
  console.log(audioCtx.sampleRate);
  navigator.getUserMedia (
     { audio: true, video: false },

     stream => {
        // Create a MediaStreamAudioSourceNode
        // Feed the HTMLMediaElement into it
        const source = audioCtx.createMediaStreamSource(stream);

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        const bufferLength = analyser.frequencyBinCount;

        source.connect(analyser);

        updateCanvasSize();

        render(canvas, canvasCtx, createAnalyser(bufferLength, analyser));
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
    getFrequencyData: () => {
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);
      return dataArray;
    }
  };
};

const render = (canvas, canvasCtx, analyser) => {
  window.requestAnimationFrame(() => render(canvas, canvasCtx, analyser));

  clearScreen(canvas, canvasCtx);
  renderWave(canvas, canvasCtx, analyser.getTimeData(), analyser.bufferLength);
  renderFreqs(canvas, canvasCtx, analyser.getFrequencyData(), analyser.bufferLength);
  renderPitch(canvas, canvasCtx, analyser);
};

const renderWave = (canvas, canvasCtx, dataArray, bufferLength) => {
  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = 'rgb(80, 80, 80)';

  canvasCtx.beginPath();

  const sliceWidth = canvas.width * 1.0 / bufferLength;
  var x = 0;

  for(var i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = v * canvas.height/2;

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

const clearScreen = (canvas, canvasCtx) => {
  canvasCtx.fillStyle = 'rgb(0, 0, 0)';
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
}

const renderFreqs = (canvas, canvasCtx, dataArray, bufferLength) => {
  const barWidth = (canvas.width / bufferLength) * 9;
  var x = 0;
  const a = canvas.height / 256.0;

  for(var i = 0; i < bufferLength; i++) {
    const v = dataArray[i];
    const y = v * a;

    canvasCtx.fillStyle = 'rgb(' + (v+100) + ',50,50)';
    canvasCtx.fillRect(x, canvas.height - y, barWidth, y);

    x += barWidth + 1;
  }
}

const renderPitch = (canvas, canvasCtx, analyser) => {
  const pitch = detectPitch(analyser.getTimeData());
  const v = _.minBy(_.map(kizNey, x => ({ f: x.f, d: Math.abs(x.f - pitch), n: x.n })), 'd');
  const diff = v.f - pitch;

  if (Math.abs(diff) < 100) {
    canvasCtx.fillStyle = 'rgb(255, 255, 255)';

    canvasCtx.font = '100px times';
    canvasCtx.textAlign = 'center';
    canvasCtx.fillText(v.n, canvas.width/2, canvas.height/2);

    canvasCtx.font = '20px sans';
    canvasCtx.textAlign = 'center';
    canvasCtx.fillText(diff, canvas.width/2, canvas.height/2+40);
  }
};

const updateCanvasSize = () => {
  const canvas = document.getElementById('canvas');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
