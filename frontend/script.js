import { createUml, deleteUml,
   updateUml } from "./api.js";
import { canvasSize } from "./config.js";
import { elements } from "./dom.js";
import { umlSavedStates, createUmlObject,
   updateRowLines, loadSavedState,
    saveCurrentState } from "./renderer/uml-renderer.js";
import { 
   setRelativePositions, setYMargin,
     setBoundaryWidth,
      setMaxTotalLinesCount, setWrapperThreshold,
       setIsOutOfBoundaryWidth,
       setTextFontSize,
       setIsOutOfBoundaryFontSize,
       setBoundaryFontSize,
       setTotalLinesCount,
       setIsOutOfBoundaryXMargin,
       setBoundaryXMargin,
       } from "./renderer/setters.js";
import { calculateWrapperThreshold, calculateTotalLinesCount,
   calculateMinLineWidth,
   calculateNextMaxTotalLinesCount, 
   } from "./renderer/calculators.js";
import { clamp, stagePoint, svgYFromBottom, nDigits } from "./utils.js";

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
    const height = selectedShape.dataset.height;

    elements.xLengthControl.value = width;
    elements.yLengthControl.value = height;
    elements.fontSizeControl.value = selectedShape.dataset.font_size;
    elements.xMarginControl.value = selectedShape.dataset.x_margin;

    elements.cornerReadout.textContent = `Left bottom: ${nDigits(selectedShape.dataset.leftBottomX)}, ${nDigits(selectedShape.dataset.leftBottomY)}`;
    elements.widthLabel.textContent = `Width: ${nDigits(selectedShape.dataset.width)}`;
    elements.heightLabel.textContent = `Height: ${nDigits(selectedShape.dataset.height)}`;
    elements.fontSizeLabel.textContent = `Font Size: ${nDigits(selectedShape.dataset.font_size)}`;
    elements.xMarginLabel.textContent = `X Margin: ${nDigits(selectedShape.dataset.x_margin)}`;

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
    
    let nextWidth = Number(elements.xLengthControl.value);
    nextWidth = clamp(nextWidth, 1, canvasSize.width - Number(selectedShape.dataset.x));    
    
    let dir = nextWidth > Number(selectedShape.dataset.width) ? "+" : "-";
    const font_size = Number(selectedShape.dataset.font_size);
    const x_margin = Number(selectedShape.dataset.x_margin);

    if (nextWidth < Number(selectedShape.dataset.boundaryWidth) && dir == "-") {      
      const maxTotalLinesCount = Number(selectedShape.dataset.maxTotalLinesCount);
      const rows = selectedShape.querySelectorAll(":scope > g > g");

      let nextWrapperThreshold = calculateWrapperThreshold(nextWidth, font_size, x_margin);
      nextWrapperThreshold = Math.max(nextWrapperThreshold, 1);
      
      let newTotalLinesCount = calculateTotalLinesCount(rows, nextWrapperThreshold);

      if (newTotalLinesCount > maxTotalLinesCount) {                        
        loadSavedState(selectedShape);
      } else {
        selectedShape.dataset.width = nextWidth;
        setWrapperThreshold(selectedShape);
      }
      updateRowLines(selectedShape);
    } else {
      selectedShape.dataset.width = nextWidth;
      setWrapperThreshold(selectedShape);

      if (selectedShape.dataset.isOutOfBoundaryWidth === "false") {
        updateRowLines(selectedShape);
      }
    }

    setTextFontSize(selectedShape);
    setYMargin(selectedShape);
    setRelativePositions(selectedShape);
    
    setBoundaryFontSize(selectedShape);
    setIsOutOfBoundaryFontSize(selectedShape);
    setBoundaryXMargin(selectedShape);
    setIsOutOfBoundaryXMargin(selectedShape);

    setIsOutOfBoundaryWidth(selectedShape);

    setTotalLinesCount(selectedShape);
    saveCurrentState(selectedShape);    

    elements.xLengthControl.value = selectedShape.dataset.width;
    elements.widthLabel.textContent = `Width: ${nDigits(selectedShape.dataset.width)}`;
  });

  elements.yLengthControl.addEventListener("input", () => {
    if (!selectedShape) return;

    let nextHeight = Number(elements.yLengthControl.value);
    const baseline_skip = Number(selectedShape.dataset.baseline_skip);
    const y = Number(selectedShape.dataset.y);
    nextHeight = clamp(nextHeight, 1, canvasSize.height - y); 

    const nextMaxTotalLinesCount = calculateNextMaxTotalLinesCount(nextHeight, baseline_skip);
    const currentTotalLinesCount = Number(selectedShape.dataset.totalLinesCount);

    if (currentTotalLinesCount > nextMaxTotalLinesCount) {
      loadSavedState(selectedShape);
    } else {
      selectedShape.dataset.height = nextHeight
    }

    setYMargin(selectedShape);
    setRelativePositions(selectedShape);
    setMaxTotalLinesCount(selectedShape);

    saveCurrentState(selectedShape);

    elements.yLengthControl.value = selectedShape.dataset.height;
    elements.heightLabel.textContent = `Height: ${nDigits(selectedShape.dataset.height)}`;

  });

  elements.fontSizeControl.addEventListener("input", () => {
    if (!selectedShape) return;

    const nextFontSize = Number(elements.fontSizeControl.value);
    const nextBaselineSkip = nextFontSize * 1.2;

    const width = Number(selectedShape.dataset.width);
    const x_margin = Number(selectedShape.dataset.x_margin);    
    const height = Number(selectedShape.dataset.height);

    if (nextFontSize > Number(selectedShape.dataset.boundaryFontSize)) {
      const nextMaxTotalLinesCount = calculateNextMaxTotalLinesCount(height, nextBaselineSkip);
      const rows = selectedShape.querySelectorAll(":scope > g > g");

      let nextWrapperThreshold = calculateWrapperThreshold(width, nextFontSize, x_margin);
      nextWrapperThreshold = Math.max(nextWrapperThreshold, 1);
      let newTotalLinesCount = calculateTotalLinesCount(rows, nextWrapperThreshold);      

      if (newTotalLinesCount > nextMaxTotalLinesCount) {                        
        loadSavedState(selectedShape);
      } else {
        selectedShape.dataset.font_size = nextFontSize;
        setWrapperThreshold(selectedShape);
      }
      updateRowLines(selectedShape);
    } else {
      selectedShape.dataset.font_size = nextFontSize;
      setWrapperThreshold(selectedShape);

      if (selectedShape.dataset.isOutOfBoundaryFontSize === "true") {        
        updateRowLines(selectedShape);
      }
    }

    selectedShape.dataset.baseline_skip = Number(selectedShape.dataset.font_size) * 1.2;
    setTextFontSize(selectedShape);
    setYMargin(selectedShape);
    setRelativePositions(selectedShape);

    setBoundaryWidth(selectedShape);
    setIsOutOfBoundaryWidth(selectedShape);
    setBoundaryXMargin(selectedShape);
    setIsOutOfBoundaryXMargin(selectedShape);

    setIsOutOfBoundaryFontSize(selectedShape);
    
    setMaxTotalLinesCount(selectedShape);
    setTotalLinesCount(selectedShape);
    saveCurrentState(selectedShape);    

    elements.fontSizeControl.value = selectedShape.dataset.font_size;
    elements.fontSizeLabel.textContent = `Font Size: ${nDigits(selectedShape.dataset.font_size)}`;

  });

  elements.xMarginControl.addEventListener("input", () => {
    if (!selectedShape) return;

    const nextXMargin = Number(elements.xMarginControl.value);
    const font_size = Number(selectedShape.dataset.font_size);
    const width = Number(selectedShape.dataset.width);

    if (nextXMargin > Number(selectedShape.dataset.boundaryXMargin)) {      
      const maxTotalLinesCount = Number(selectedShape.dataset.maxTotalLinesCount);
      const rows = selectedShape.querySelectorAll(":scope > g > g");

      let nextWrapperThreshold = calculateWrapperThreshold(width, font_size, nextXMargin);
      nextWrapperThreshold = Math.max(nextWrapperThreshold, 1);
      
      let newTotalLinesCount = calculateTotalLinesCount(rows, nextWrapperThreshold);

      if (newTotalLinesCount > maxTotalLinesCount) {                        
        loadSavedState(selectedShape);
      } else {
        selectedShape.dataset.x_margin = nextXMargin;
        setWrapperThreshold(selectedShape);
      }
      updateRowLines(selectedShape);
    } else {
      selectedShape.dataset.x_margin = nextXMargin;
      setWrapperThreshold(selectedShape);

      if (selectedShape.dataset.isOutOfBoundaryXMargin === "true") {
        updateRowLines(selectedShape);
      }
    }

    setTextFontSize(selectedShape);
    setYMargin(selectedShape);
    setRelativePositions(selectedShape);

    setBoundaryWidth(selectedShape);
    setIsOutOfBoundaryWidth(selectedShape);
    setBoundaryFontSize(selectedShape);
    setIsOutOfBoundaryFontSize(selectedShape);

    setIsOutOfBoundaryXMargin(selectedShape);

    setTotalLinesCount(selectedShape);
    saveCurrentState(selectedShape); 

    elements.xMarginControl.value = selectedShape.dataset.x_margin;
    elements.xMarginLabel.textContent = `X Margin: ${nDigits(selectedShape.dataset.x_margin)}`;

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