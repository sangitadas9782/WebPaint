"use strict";

// Variables
// References
const canvas = document.getElementById("canvas");
const canvasMask = document.getElementById("canvas-mask");
const ctx = canvas.getContext("2d");
const ctxMask = canvasMask.getContext("2d");
const colorInput = document.getElementById("color-input");
const sizeInput = document.getElementById("size-input");
const strokeInput = document.getElementById("stroke-input");
// Settings
let color = "black";
let size = 20;
let stroke = false;
// Other
let drawing = false;
let changesArray = [];
let changesPosition = -1;
const changesArrayLimit = 15;
const mousePos = {
  x: null,
  y: null,
  xDown: null,
  yDown: null,
}
const TOOLS = {
  BRUSH: "brush",
  HIGHLIGHTER: "highlighter",
  ERASER: "eraser",
  LINE: "line",
  SQUARE: "square",
  CIRCLE: "circle",
  FILL: "fill"
}
let tool = TOOLS.BRUSH;

// Event Listeners

// Normal canvas
// Mobile
canvas.addEventListener("touchstart", drawStart);
canvas.addEventListener("touchmove", draw);
canvas.addEventListener("touchend", drawEnd);
// Desktop
canvas.addEventListener("mousedown", drawStart);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", drawEnd);
canvas.addEventListener("mouseout", drawEnd);
// Canvas mask
// Mobile
canvasMask.addEventListener("touchstart", drawStart);
canvasMask.addEventListener("touchmove", draw);
canvasMask.addEventListener("touchend", drawEnd);
// Desktop
canvasMask.addEventListener("mousedown", drawStart);
canvasMask.addEventListener("mousemove", draw);
canvasMask.addEventListener("mouseup", drawEnd);
canvasMask.addEventListener("mouseout", drawEnd);

// Functions
function drawStart(e) {
  drawing = true;
  mousePos.xDown = e.x - canvas.offsetLeft;
  mousePos.yDown = e.y - canvas.offsetTop;
  color = colorInput.value;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctxMask.strokeStyle = color;
  size = sizeInput.value;
  stroke = strokeInput.checked;
  switch (tool) {
    case TOOLS.BRUSH:
    case TOOLS.HIGHLIGHTER:
    case TOOLS.ERASER:
      ctx.beginPath();
      ctx.moveTo(mousePos.xDown, mousePos.yDown);
    case TOOLS.CIRCLE:
    case TOOLS.SQUARE:
    case TOOLS.LINE:
      ctx.lineWidth = size;
      break;
    case TOOLS.FILL:
      fillArea(e.x, e.y, hexToRgba(color));
      break;
  }
  draw(e);
}

function draw(e) {
  ctxMask.clearRect(0, 0, canvasMask.width, canvasMask.height); // Clears the mask
  mousePos.x = e.x - canvas.offsetLeft;
  mousePos.y = e.y - canvas.offsetTop;
  if (drawing) {
    const w = mousePos.x - mousePos.xDown;
    const h = mousePos.y - mousePos.yDown;
    switch (tool) {
      case TOOLS.ERASER:
        ctx.strokeStyle = "white";
      case TOOLS.BRUSH:
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.strokeStyle = color;
        break;
      case TOOLS.HIGHLIGHTER:
        ctx.strokeStyle = color + "01";
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.strokeStyle = color;
        break;
      case TOOLS.LINE:
        ctxMask.beginPath();
        ctxMask.moveTo(mousePos.xDown, mousePos.yDown);
        ctxMask.lineTo(mousePos.x, mousePos.y);
        ctxMask.stroke();
        ctxMask.closePath();
        break;
      case TOOLS.SQUARE:
        ctxMask.strokeRect(mousePos.xDown, mousePos.yDown, w, h);
        break;
      case TOOLS.CIRCLE:
        ctxMask.beginPath();
        ctxMask.ellipse(
          mousePos.xDown + w / 2,
          mousePos.yDown + h / 2,
          Math.abs(w / 2),
          Math.abs(h / 2),
          0,
          0,
          Math.PI * 2);
        ctxMask.stroke();
        ctxMask.closePath();
        break;
    }
  }
}

function drawEnd(e) {
  drawing = false;
  ctx.closePath();
  if (e.type != "mouseout") {
    switch (tool) {
      case TOOLS.LINE: ctx.beginPath();
        ctx.moveTo(mousePos.xDown, mousePos.yDown);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.closePath();
        break;
      case TOOLS.SQUARE:
        (stroke) ? ctx.strokeRect(mousePos.xDown, mousePos.yDown, mousePos.x - mousePos.xDown, mousePos.y - mousePos.yDown) : ctx.fillRect(mousePos.xDown, mousePos.yDown, mousePos.x - mousePos.xDown, mousePos.y - mousePos.yDown);
        break;
      case TOOLS.CIRCLE: ctx.beginPath();
        ctx.ellipse(
          mousePos.xDown + (mousePos.x - mousePos.xDown) / 2,
          mousePos.yDown + (mousePos.y - mousePos.yDown) / 2,
          Math.abs((mousePos.x - mousePos.xDown) / 2),
          Math.abs((mousePos.y - mousePos.yDown) / 2),
          0,
          0,
          Math.PI * 2);
        (stroke) ? ctx.stroke() : ctx.fill();
        ctx.closePath();
        break;
    }
    if (changesPosition != changesArray.length - 1) {
      changesArray.splice(changesPosition + 1);
    }
    changesArray.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (changesArray.length >= changesArrayLimit) {
      changesArray.splice(0, 1);
    } else changesPosition++;
  }
}

function getColor(x, y) {
  const pixel = ctx.getImageData(x, y, 1, 1);
  const data = pixel.data;
  return [data[0], data[1], data[2]];
}

function hexToRgba(hex) {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  }
}

function fillArea(x, y, fillColor) {
  const currentColor = getColor(x - canvas.offsetLeft, y - canvas.offsetTop);
  if (currentColor[0] === fillColor[0] &&
    currentColor[1] === fillColor[1] &&
    currentColor[2] === fillColor[2] &&
    currentColor[3] === fillColor[3]
  ) return;
  let stack = [[x, y]];
  while (stack.length) {
    const position = stack.pop();
    const px = position[0];
    const py = position[1];
    const pixelColor = getColor(px - canvas.offsetLeft, py - canvas.offsetTop);
    if (currentColor[0] === pixelColor[0] &&
      currentColor[1] === pixelColor[1] &&
      currentColor[2] === pixelColor[2] &&
      currentColor[3] === pixelColor[3]
    ) {
      ctx.fillStyle = 'rgb(' + fillColor.join(',') + ')';
      ctx.fillRect(px - canvas.offsetLeft, py - canvas.offsetTop, 4, 4);
      if (px - canvas.offsetLeft > 0) stack.push([px - 4, py]);
      if (px - canvas.offsetLeft < canvas.width - 5) stack.push([px + 4, py]);
      if (py - canvas.offsetTop > 0) stack.push([px, py - 4]);
      if (py - canvas.offsetTop < canvas.height - 5) stack.push([px, py + 4]);
    }
  }
}

function undo() {
  changesPosition--;
  if (changesPosition < 0) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    changesPosition = -1;
  } else ctx.putImageData(changesArray[changesPosition], 0, 0);
}

function redo() {
  changesPosition++;
  if (changesPosition < changesArray.length) ctx.putImageData(changesArray[changesPosition], 0, 0);
  else changesPosition = changesArray.length - 1;
}

function saveImage() {
  const url = canvas.toDataURL("image/png");
  const reference = document.createElement("a");
  reference.href = url;
  reference.download = "imageWebPaint.png";
  document.body.appendChild(reference);
  reference.click();
  document.body.removeChild(reference);
}

function loadImage() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (ev) => {
      const image = new Image();
      image.src = ev.target.result;
      image.onload = () => {
        clearCanvas();
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      }
    }
  }
  input.click();
}

function clearCanvas() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  changesArray = [];
  changesPosition = -1;
}

// Tools
function changeTool(newTool) {
  tool = newTool;
  if (newTool == TOOLS.LINE || newTool == TOOLS.SQUARE || newTool == TOOLS.CIRCLE) {
    canvasMask.style.display = "block";
  } else canvasMask.style.display = "none";
}

// Resize Fix
function resizeFix() {
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const canvasRect = canvas.getBoundingClientRect();
  canvas.width = canvasRect.width;
  canvas.height = canvasRect.height;
  canvasMask.width = canvasRect.width;
  canvasMask.height = canvasRect.height;
  canvasMask.style.width = canvasRect.width + "px";
  canvasMask.style.height = canvasRect.height + "px";
  // Resize image
  clearCanvas();
  ctx.putImageData(image, 0, 0);
}
window.addEventListener("resize", resizeFix);
resizeFix();
clearCanvas();
// Other functionalities
// Options bar highlight
const options = document.querySelectorAll(".option");
options.forEach(op => {
  if (op.classList.contains("option-nohighlight")) return;
  op.addEventListener("click", function () {
    options.forEach(option => option.classList.toggle("selected", false));
    this.classList.add("selected");
  })
})