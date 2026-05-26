import { createUml, deleteUml, updateUml } from "./api.js";
import { canvasSize } from "./config.js";
import { elements } from "./dom.js";
import { createUmlObject, normalizeUmlObjects } from "./uml-renderer.js";
import { clamp, stagePoint, svgYFromBottom } from "./utils.js";

let activeDrag = null;
let nextZ = 1;
let selectedShape = null;

function shapeScale(shape) {
  return Number(shape.dataset.width) / Number(shape.dataset.initialWidth || shape.dataset.width || 1);
}

function shapeSizeInCanvasUnits(shape) {
  const scale = shapeScale(shape);

  return {
    width: Number(shape.dataset.initialWidth) * scale,
    height: Number(shape.dataset.initialHeight) * scale
  };
}

function applyShapeTransform(shape) {
  const baseX = Number(shape.dataset.baseX);
  const baseY = Number(shape.dataset.baseY);
  const x = Number(shape.dataset.x);
  const y = Number(shape.dataset.y);
  const scale = shapeScale(shape);
  const baseSvgY = svgYFromBottom(baseY);
  const currentSvgY = svgYFromBottom(y);

  shape.setAttribute(
    "transform",
    `translate(${x} ${currentSvgY}) scale(${scale}) translate(${-baseX} ${-baseSvgY})`
  );
}

function renderUmlConfigs(umlCFGs) {
  const objects = normalizeUmlObjects(umlCFGs);
  const existingCount = elements.canvasSvg.querySelectorAll(".canvas-shape").length;
  let firstNewShape = null;

  objects.forEach((objectConfig, index) => {
    const shape = createUmlObject(objectConfig, existingCount + index);
    elements.canvasSvg.appendChild(shape);
    bindShape(shape);
    moveShape(shape, Number(shape.dataset.x), Number(shape.dataset.y));
    firstNewShape ||= shape;
  });

  if (firstNewShape) {
    setSelectedShape(firstNewShape);
  } else {
    updateObjectList();
  }
}

function getShapeConfigPayload(shape) {
  const config = JSON.parse(shape.dataset.config || "{}");
  const initialWidth = Number(shape.dataset.initialWidth || 1);

  return {
    id: config.id || shape.dataset.id || shape.dataset.label,
    x: Number(shape.dataset.x),
    y: Number(shape.dataset.y),
    scale: Number(shape.dataset.width) / initialWidth
  };
}

function getShapeId(shape) {
  const config = JSON.parse(shape.dataset.config || "{}");
  return config.id || shape.dataset.id || shape.dataset.label;
}

function getChangedConfigsPayload() {
  return Array.from(elements.canvasSvg.querySelectorAll(".canvas-shape")).map(getShapeConfigPayload);
}

function updateObjectList() {
  const shapes = Array.from(elements.canvasSvg.querySelectorAll(".canvas-shape"));
  elements.stage.classList.toggle("has-items", shapes.length > 0);

  if (selectedShape && !shapes.includes(selectedShape)) {
    selectedShape = null;
    updateSelectionControls();
  }

  if (shapes.length === 0) {
    elements.umlObjects.innerHTML = '<div class="uml-empty">Generated UML diagrams will appear here.</div>';
    return;
  }

  elements.umlObjects.innerHTML = "";
  shapes.forEach((shape, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "object-list-item";
    item.classList.toggle("selected", shape === selectedShape);
    item.textContent = `${index + 1}. ${shape.dataset.label}`;
    item.addEventListener("click", () => setSelectedShape(shape));
    elements.umlObjects.appendChild(item);
  });
}

function updateSelectionControls() {
  const hasSelection = Boolean(selectedShape);
  const hasObjects = Boolean(elements.canvasSvg.querySelector(".canvas-shape"));
  elements.deleteObject.disabled = !hasSelection;
  elements.sizeControl.disabled = !hasSelection;
  elements.saveConfig.disabled = !hasObjects;

  if (hasSelection) {
    const initialWidth = Number(selectedShape.dataset.initialWidth || selectedShape.dataset.width);
    const scale = Number(selectedShape.dataset.width) / initialWidth;

    elements.sizeControl.value = selectedShape.dataset.width;
    elements.cornerReadout.textContent = `Left bottom: ${selectedShape.dataset.leftBottomX}, ${selectedShape.dataset.leftBottomY}`;
    elements.scaleReadout.textContent = `Scale: ${scale.toFixed(2)}x`;
  } else {
    elements.cornerReadout.textContent = "Left bottom: -";
    elements.scaleReadout.textContent = "Scale: -";
  }
}

function setSelectedShape(shape) {
  if (selectedShape) {
    selectedShape.classList.remove("selected");
  }

  selectedShape = shape;

  if (selectedShape) {
    selectedShape.classList.add("selected");
  }

  updateSelectionControls();
  updateObjectList();
}

function applySize(shape) {
  const width = clamp(Number(shape.dataset.width), 1, canvasSize.width);
  shape.dataset.width = width;
}

function updateLeftBottom(shape) {
  shape.dataset.leftBottomX = Number(shape.dataset.x).toFixed(2);
  shape.dataset.leftBottomY = Number(shape.dataset.y).toFixed(2);
}

function moveShape(shape, x, y) {
  applySize(shape);
  const size = shapeSizeInCanvasUnits(shape);
  const maxX = size.width > canvasSize.width ? canvasSize.width : canvasSize.width - size.width;
  const maxY = size.height > canvasSize.height ? canvasSize.height : canvasSize.height - size.height;
  shape.dataset.x = clamp(x, 0, Math.max(0, maxX));
  shape.dataset.y = clamp(y, 0, Math.max(0, maxY));
  applyShapeTransform(shape);
  updateLeftBottom(shape);

  if (shape === selectedShape) {
    updateSelectionControls();
  }
}

function bindShape(shape) {
  applySize(shape);
  updateLeftBottom(shape);

  shape.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    shape.setPointerCapture(event.pointerId);
    shape.style.zIndex = ++nextZ;
    shape.classList.add("dragging");
    setSelectedShape(shape);

    const point = stagePoint(event);
    activeDrag = {
      type: "move",
      shape,
      offsetX: point.x - Number(shape.dataset.x),
      offsetY: point.y - Number(shape.dataset.y)
    };
  });
}

function setLatexOutput(result) {
  elements.latexCode.value = typeof result === "string"
    ? result
    : result.latex || result.latex_code || result.code || JSON.stringify(result, null, 2);
}

function bindPageEvents() {
  elements.stage.addEventListener("pointerdown", (event) => {
    if (event.target === elements.stage || event.target === elements.canvasSvg || event.target.classList.contains("canvas-background")) {
      setSelectedShape(null);
    }
  });

  window.addEventListener("pointermove", (event) => {
    if (!activeDrag) return;

    const point = stagePoint(event);
    moveShape(activeDrag.shape, point.x - activeDrag.offsetX, point.y - activeDrag.offsetY);
  });

  window.addEventListener("pointerup", () => {
    if (!activeDrag) return;

    if (activeDrag.type === "move") {
      activeDrag.shape.classList.remove("dragging");
    }

    activeDrag = null;
  });

  window.addEventListener("resize", () => {
    elements.canvasSvg.querySelectorAll(".canvas-shape").forEach((shape) => {
      moveShape(shape, Number(shape.dataset.x), Number(shape.dataset.y));
    });
  });

  elements.deleteObject.addEventListener("click", async () => {
    if (!selectedShape) return;

    const shapeToDelete = selectedShape;
    elements.deleteObject.disabled = true;

    try {
      await deleteUml(getShapeId(shapeToDelete));
      shapeToDelete.remove();
      selectedShape = null;
      updateSelectionControls();
      updateObjectList();
    } catch (error) {
      console.error(error);
      updateSelectionControls();
    }
  });

  elements.saveConfig.addEventListener("click", async () => {
    const configs = getChangedConfigsPayload();
    if (configs.length === 0) return;

    const result = await updateUml(configs);
    setLatexOutput(result);
    console.log(result);
  });

  elements.sizeControl.addEventListener("input", () => {
    if (!selectedShape) return;

    const bottom = Number(selectedShape.dataset.y);
    selectedShape.dataset.width = elements.sizeControl.value;
    applySize(selectedShape);
    moveShape(selectedShape, Number(selectedShape.dataset.x), bottom);
    elements.sizeControl.value = selectedShape.dataset.width;
  });

  elements.sendCode.addEventListener("click", async () => {
    const umlCFGs = await createUml(elements.javaCode.value);
    console.log(umlCFGs);
    renderUmlConfigs(umlCFGs);
  });
}

function initializeExistingShapes() {
  elements.canvasSvg.querySelectorAll(".canvas-shape").forEach((shape) => {
    bindShape(shape);
    moveShape(shape, Number(shape.dataset.x), Number(shape.dataset.y));
  });
  updateObjectList();
}

bindPageEvents();
initializeExistingShapes();
