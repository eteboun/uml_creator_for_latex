import { createUml, deleteUml, updateUml } from "./api.js";
import { canvasSize } from "./config.js";
import { elements } from "./dom.js";
import { createUmlObject, setRelativePositions, calculateYMargin, setFontSize, setBaselineSkip } from "./uml-renderer.js";
import { clamp, stagePoint, svgYFromBottom } from "./utils.js";

let activeDrag = null;
let selectedShape = null;

function shapeSizeInCanvasUnits(shape) {
  return {
    width: Number(shape.dataset.width),
    height: Number(shape.dataset.height)
  };
}

function applyShapeTransform(shape) {
  const x = Number(shape.dataset.x);
  const y = Number(shape.dataset.y)

  shape.setAttribute("transform", `translate(${x}, ${y})`);
}

function renderUmlConfigs(umlCFGs) {
  let firstNewShape = null;

  umlCFGs.forEach((objectConfig) => {
    const shape = createUmlObject(objectConfig);
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

  return {
    id: config.id,
    x: Number(shape.dataset.x),
    y: Number(shape.dataset.y),
    width: Number(shape.dataset.width),
    height: Number(shape.dataset.height),
  };
}

function getShapeId(shape) {
  return shape.dataset.id;
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
  elements.xLengthControl.disabled = !hasSelection;
  elements.yLengthControl.disabled = !hasSelection;
  elements.xMarginControl.disabled = !hasSelection;
  elements.fontSizeControl.disabled = !hasSelection;

  elements.saveConfig.disabled = !hasObjects;

  if (hasSelection) {
    const width = selectedShape.dataset.width;
    const height =selectedShape.dataset.height;

    elements.xLengthControl.value = width;
    elements.yLengthControl.value = height;
    elements.fontSizeControl.value = selectedShape.dataset.font_size;
    elements.xMarginControl.value = selectedShape.dataset.x_margin;
    elements.cornerReadout.textContent = `Left bottom: ${selectedShape.dataset.leftBottomX}, ${selectedShape.dataset.leftBottomY}`;
  } else {
    elements.cornerReadout.textContent = "Left bottom: -";
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
  const width = clamp(Number(shape.dataset.width), 1, canvasSize.width - Number(shape.dataset.x));
  const height = clamp(Number(shape.dataset.height), 1, canvasSize.height - Number(shape.dataset.y));
  shape.dataset.width = width;
  shape.dataset.height = height;
}

function updateLeftBottom(shape) {
  shape.dataset.leftBottomX = Number(shape.dataset.x).toFixed(2);
  shape.dataset.leftBottomY = (canvasSize.height - (Number(shape.dataset.y) + Number(shape.dataset.height))).toFixed(2);
}

function moveShape(shape, x, y) {
  applySize(shape);
  const size = shapeSizeInCanvasUnits(shape);
  const maxX = Math.max(0, canvasSize.width - size.width);
  const maxY = Math.max(0, canvasSize.height - size.height);
  shape.dataset.x = clamp(x, 0, maxX);
  shape.dataset.y = clamp(y, 0, maxY);

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
  });

  elements.xLengthControl.addEventListener("input", () => {
    if (!selectedShape) return;

    selectedShape.dataset.width = elements.xLengthControl.value;
    applySize(selectedShape);
    setRelativePositions(selectedShape);

    elements.xLengthControl.value = selectedShape.dataset.width;
  });

  elements.yLengthControl.addEventListener("input", () => {
    if (!selectedShape) return;

    let prev_height = Number(selectedShape.dataset.height);
    selectedShape.dataset.height = elements.yLengthControl.value;
    applySize(selectedShape);

    let y_margin = calculateYMargin(selectedShape);
    if (y_margin < 0) {
      selectedShape.dataset.height = prev_height;
    } else {
      selectedShape.dataset.y_margin = y_margin;
      setRelativePositions(selectedShape);
    }

    elements.yLengthControl.value = selectedShape.dataset.height;
  });

  elements.fontSizeControl.addEventListener("input", () => {
    if (!selectedShape) return;

    setFontSize(selectedShape, elements.fontSizeControl.value);
    setBaselineSkip(selectedShape);
    calculateYMargin(selectedShape);
    setRelativePositions(selectedShape);
  
  });

  elements.xMarginControl.addEventListener("input", () => {
    if (!selectedShape) return;

    selectedShape.dataset.x_margin = elements.xMarginControl.value;
    setRelativePositions(selectedShape);
    
  });
  elements.sendCode.addEventListener("click", async () => {
    const umlCFGs = await createUml(elements.javaCode.value);
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