import { createUml, deleteUml, updateUml } from "./api.js";
import { canvasSize } from "./config.js";
import { elements } from "./dom.js";
import { createUmlObject, setRelativePositions, setYMargin, setFontSize, setBaselineSkip, calculateMaxFontSize, calculateMaxXMargin, calculateMinHeight, calculateMinWidth } from "./uml-renderer.js";
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
    elements.widthLabel.textContent = `Width: ${selectedShape.dataset.width}`;
    elements.heightLabel.textContent = `Height: ${selectedShape.dataset.height}`;
    elements.fontSizeLabel.textContent = `Font Size: ${selectedShape.dataset.font_size}`;
    elements.xMarginLabel.textContent = `X Margin: ${selectedShape.dataset.x_margin}`;

  } else {
    elements.cornerReadout.textContent = "Left bottom: -";
    elements.widthLabel.textContent = `Width: -`;
    elements.heightLabel.textContent = `Height: -`;
    elements.fontSizeLabel.textContent = `Font Size: -`;
    elements.xMarginLabel.textContent = `X Margin: -`;
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
  const width = clamp(Number(shape.dataset.width), Number(shape.dataset.minWidth), canvasSize.width - Number(shape.dataset.x));
  const height = clamp(Number(shape.dataset.height), Number(shape.dataset.minHeight), canvasSize.height - Number(shape.dataset.y));
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

    selectedShape.dataset.maxFontSize = calculateMaxFontSize(selectedShape);
    selectedShape.dataset.maxXMargin = calculateMaxXMargin(selectedShape);

    elements.widthLabel.textContent = `Width: ${selectedShape.dataset.width}`;
    elements.xLengthControl.value = selectedShape.dataset.width;
  });

  elements.yLengthControl.addEventListener("input", () => {
    if (!selectedShape) return;

    selectedShape.dataset.height = elements.yLengthControl.value;
    applySize(selectedShape);

    setYMargin(selectedShape);
    setRelativePositions(selectedShape);

    selectedShape.dataset.maxFontSize = calculateMaxFontSize(selectedShape);

    elements.yLengthControl.value = selectedShape.dataset.height;
    elements.heightLabel.textContent = `Height: ${selectedShape.dataset.height}`;

  });

  elements.fontSizeControl.addEventListener("input", () => {
    if (!selectedShape) return;

    const requestedFontSize = Number(elements.fontSizeControl.value);
    const maxFontSize = Number(selectedShape.dataset.maxFontSize);

    const fontSize = Math.min(requestedFontSize, maxFontSize);

    elements.fontSizeControl.value = fontSize;

    setFontSize(selectedShape, fontSize);
    setBaselineSkip(selectedShape);
    setYMargin(selectedShape);
    setRelativePositions(selectedShape);

    selectedShape.dataset.maxXMargin = calculateMaxXMargin(selectedShape);
    selectedShape.dataset.minHeight = calculateMinHeight(selectedShape);
    selectedShape.dataset.minWidth = calculateMinWidth(selectedShape);

    elements.fontSizeLabel.textContent = `Font Size: ${selectedShape.dataset.font_size}`;

  });

  elements.xMarginControl.addEventListener("input", () => {
    if (!selectedShape) return;

    const requestedXMargin = Number(elements.xMarginControl.value);
    const maxXMargin = Number(selectedShape.dataset.maxXMargin);

    const xMargin = Math.min(requestedXMargin, maxXMargin);

    elements.xMarginControl.value = xMargin;
    selectedShape.dataset.x_margin = xMargin;

    setRelativePositions(selectedShape);

    selectedShape.dataset.maxFontSize = calculateMaxFontSize(selectedShape);
    selectedShape.dataset.minWidth = calculateMinWidth(selectedShape);

    elements.xMarginLabel.textContent = `X Margin: ${selectedShape.dataset.x_margin}`;

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