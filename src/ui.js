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

function render() {
  document.body.appendChild(component());
}

const UI = { render };

export default UI;
