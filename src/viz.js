import _ from 'lodash';

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

const renderPitch = (canvas, canvasCtx, pitch, makamNey) => {
  if (pitch <= 0) { return; }

  const v = _.minBy(_.map(makamNey, x => ({ f: x.f, d: Math.abs(x.f - pitch), n: x.n })), 'd');
  const diff = v.f - pitch;

  if (Math.abs(diff) < 150) {
    canvasCtx.fillStyle = 'rgba(255, 255, 255)';

    renderText(canvas, canvasCtx, '100px sans', 'center', v.n, canvas.width/2, canvas.height/2);
    renderText(canvas, canvasCtx, '20px sans', 'center', Math.round(diff*100)/100, canvas.width/2, canvas.height/2+60);
    renderText(canvas, canvasCtx, '40px sans', 'center', Math.round(pitch) + ' Hz', canvas.width/2, canvas.height/2+110);
  }
};

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

const Viz = {
  renderWave,
  renderFreqs,
  renderPitch,
  renderTime,
  renderText,
};

export default Viz;
