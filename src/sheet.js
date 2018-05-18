import Vex from 'vexflow';

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

function init() {
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

    //_.times(stavesPerPage-chunks.length, () => chunks.push([]));

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

  function createStaveNote(VF, n, acc) {
    const staveNote = new VF.StaveNote({ keys: [n], duration: "q" });
    if (acc) {
      staveNote.addAccidental(0, new VF.Accidental(acc));
    }
    return staveNote;
  }

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

const Sheet = {
  init
};

export default Sheet;
