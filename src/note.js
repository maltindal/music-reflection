import _ from 'lodash';

function getNearestNote(arrayOfNotes, makamNey) {
  const nearestNotes = _.map(arrayOfNotes, n => getNearestNoteByPitch(n.y, makamNey));
  const notesByFreq = _.groupBy(nearestNotes, 'f');
  const freqs = Object.keys(notesByFreq);
  const target = _.maxBy(_.map(freqs, f => ({f: Number(f), c: notesByFreq[f].length})), 'c');
  const targetNote = _.find(makamNey, x => x.f === target.f);
  return targetNote;
}

function getNearestNoteByPitch(pitch, makamNey) {
  return _.minBy(_.map(makamNey, x => ({ f: x.f, n: x.n, d: Math.abs(x.f - pitch) })), 'd');
}

const detectNote = (() => {
  const win_length = 20;
  var current_win = [];
  var last_seconds_timestamp = 0;
  var lastNote = undefined;

  return (timestamp, pitch, makamNey, callback) => {
    if (current_win.length == win_length) { current_win.shift(); }
    current_win.push({ x: timestamp, y: pitch });

    if (last_seconds_timestamp === 0) {
      last_seconds_timestamp = timestamp;
    }

    const v = getNearestNote(current_win, makamNey);
    const diff = v.f - pitch;

    if (timestamp - last_seconds_timestamp >= 50) {
      if (lastNote !== v) {
        current_win = [];
        lastNote = v;
      }

      last_seconds_timestamp = timestamp;
      if (Math.abs(diff) < 150) {
        callback(v);
      }
    }
  };
})();

const Note = {
  detectNote,
  getNearestNote,
  getNearestNoteByPitch,
};

export default Note;
