import { createUml } from "./api.js";
import { canvasSize } from "./config.js";
import { elements } from "./dom.js";
import {
  createUmlObject,
  updateRowLines, loadSavedState,
  saveCurrentState, getUmlObjectById, umlObjects, umlSavedStates
} from "./renderer/uml-renderer.js";
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
   calculateNextMaxTotalLinesCount, 
   } from "./renderer/calculators.js";
import { clamp, stagePoint, nDigits } from "./utils.js";

let activeDrag = null;
let selectedShape = null;

function applyShapeTransform(shape) {
  const umlObject = getUmlObjectById(shape.dataset.id);
  shape.setAttribute("transform", `translate(${umlObject.x}, ${umlObject.y})`);
}

function renderUmlConfigs(umlCFGs) {
  let firstNewShape = null;

  umlCFGs.forEach((objectConfig) => {
    const shape = createUmlObject(objectConfig);
    const umlObject = getUmlObjectById(shape.dataset.id);
    elements.canvasSvg.appendChild(shape);
    bindShape(shape);
    moveShape(shape, umlObject.x, umlObject.y);
    firstNewShape ||= shape;
  });

  if (firstNewShape) {
    setSelectedShape(firstNewShape);
  } else {
    updateObjectList();
  }
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
    elements.umlRelations.innerHTML = '<div class="uml-empty">UML relations will appear here.</div>';
    return;
  }

  elements.umlObjects.innerHTML = "";
  elements.umlRelations.innerHTML = "";
  shapes.forEach((shape, index) => {
    const umlObject = getUmlObjectById(shape.dataset.id);
    const item = document.createElement("button");
    item.type = "button";
    item.className = "uml-list-item";
    item.classList.toggle("selected", shape === selectedShape);
    item.textContent = `${index + 1}. ${umlObject.name}`;
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
    const umlObject = getUmlObjectById(selectedShape.dataset.id);
    elements.xLengthControl.value = umlObject.width;
    elements.yLengthControl.value = umlObject.height;
    elements.fontSizeControl.value = umlObject.fontSize;
    elements.xMarginControl.value = umlObject.xMargin;

    elements.cornerReadout.textContent = `Left top: ${nDigits(umlObject.x)}, ${nDigits(umlObject.y)}`;
    elements.widthLabel.textContent = `Width: ${nDigits(umlObject.width)}`;
    elements.heightLabel.textContent = `Height: ${nDigits(umlObject.height)}`;
    elements.fontSizeLabel.textContent = `Font Size: ${nDigits(umlObject.fontSize)}`;
    elements.xMarginLabel.textContent = `X Margin: ${nDigits(umlObject.xMargin)}`;

  } else {
    elements.cornerReadout.textContent = "Left top: -";
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

function moveShape(shape, x, y) {
  const umlObject = getUmlObjectById(shape.dataset.id);
  const maxX = Math.max(0, canvasSize.width - umlObject.width);
  const maxY = Math.max(0, canvasSize.height - umlObject.height);
  umlObject.x = clamp(x, 0, maxX);
  umlObject.y = clamp(y, 0, maxY);

  applyShapeTransform(shape);

  if (shape === selectedShape) {
    updateSelectionControls();
  }
}

function bindShape(shape) {

  const umlObject = getUmlObjectById(shape.dataset.id);
  shape.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    shape.setPointerCapture(event.pointerId);
    shape.classList.add("dragging");
    setSelectedShape(shape);

    const point = stagePoint(event);
    activeDrag = {
      type: "move",
      shape,
      offsetX: point.x - umlObject.x,
      offsetY: point.y - umlObject.y,
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
      const umlObject = getUmlObjectById(shape.dataset.id);
      moveShape(shape, umlObject.x, umlObject.y);
    });
  });

  elements.deleteObject.addEventListener("click", () => {
    if (!selectedShape) return;

    const shapeToDelete = selectedShape;
    elements.deleteObject.disabled = true;

    umlObjects.remove(shapeToDelete.dataset.id);
    umlSavedStates.remove(shapeToDelete.dataset.id);
    shapeToDelete.remove();
    selectedShape = null;
    updateSelectionControls();
    updateObjectList();    
  });

  elements.xLengthControl.addEventListener("input", () => {
    if (!selectedShape) return;

    const umlObject = getUmlObjectById(selectedShape.dataset.id);

    let nextWidth = Number(elements.xLengthControl.value);
    nextWidth = clamp(nextWidth, 1, canvasSize.width - umlObject.x);
    
    let dir = nextWidth > umlObject.width;
    const fontSize = umlObject.fontSize;
    const xMargin = umlObject.xMargin;

    if (nextWidth < umlObject.boundaryWidth && !dir) {
      const maxTotalLinesCount = umlObject.maxTotalLinesCount;
      let nextWrapperThreshold = calculateWrapperThreshold(nextWidth, fontSize, xMargin);
      let newTotalLinesCount = calculateTotalLinesCount(selectedShape, nextWrapperThreshold);

      if (newTotalLinesCount > maxTotalLinesCount) {                        
        loadSavedState(selectedShape);
      } else {
        umlObject.width = nextWidth;
        setWrapperThreshold(selectedShape);
      }
      updateRowLines(selectedShape);
    } else {
      umlObject.width = nextWidth;
      setWrapperThreshold(selectedShape);

      if (!umlObject.isOutOfBoundaryWidth) {
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

    elements.xLengthControl.value = umlObject.width;
    elements.widthLabel.textContent = `Width: ${nDigits(umlObject.width)}`;
  });

  elements.yLengthControl.addEventListener("input", () => {
    if (!selectedShape) return;

    const umlObject = getUmlObjectById(selectedShape.dataset.id);

    let nextHeight = Number(elements.yLengthControl.value);
    nextHeight = clamp(nextHeight, 1, canvasSize.height - umlObject.y);

    const nextMaxTotalLinesCount = calculateNextMaxTotalLinesCount(nextHeight, umlObject.baselineSkip);
    const currentTotalLinesCount = umlObject.totalLinesCount;

    if (currentTotalLinesCount > nextMaxTotalLinesCount) {
      loadSavedState(selectedShape);
    } else {
      umlObject.height = nextHeight
    }

    setYMargin(selectedShape);
    setRelativePositions(selectedShape);
    setMaxTotalLinesCount(selectedShape);

    saveCurrentState(selectedShape);

    elements.yLengthControl.value = umlObject.height;
    elements.heightLabel.textContent = `Height: ${nDigits(umlObject.height)}`;

  });

  elements.fontSizeControl.addEventListener("input", () => {
    if (!selectedShape) return;

    const umlObject = getUmlObjectById(selectedShape.dataset.id);

    const nextFontSize = Number(elements.fontSizeControl.value);
    const nextBaselineSkip = nextFontSize * 1.2;
    let dir = nextFontSize > umlObject.fontSize;

    const width = umlObject.width;
    const xMargin = umlObject.xMargin;
    const height = umlObject.height;

    if (nextFontSize > umlObject.boundaryFontSize && dir) {
      const nextMaxTotalLinesCount = calculateNextMaxTotalLinesCount(height, nextBaselineSkip);

      let nextWrapperThreshold = calculateWrapperThreshold(width, nextFontSize, xMargin);
      let newTotalLinesCount = calculateTotalLinesCount(selectedShape, nextWrapperThreshold);

      if (newTotalLinesCount > nextMaxTotalLinesCount) {                        
        loadSavedState(selectedShape);
      } else {
        umlObject.fontSize = nextFontSize;
        setWrapperThreshold(selectedShape);
      }
      updateRowLines(selectedShape);
    } else {
      umlObject.fontSize = nextFontSize;
      setWrapperThreshold(selectedShape);

      if (umlObject.isOutOfBoundaryFontSize) {
        updateRowLines(selectedShape);
      }
    }

    umlObject.baselineSkip = umlObject.fontSize * 1.2;
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

    elements.fontSizeControl.value = umlObject.fontSize;
    elements.fontSizeLabel.textContent = `Font Size: ${nDigits(umlObject.fontSize)}`;

  });

  elements.xMarginControl.addEventListener("input", () => {
    if (!selectedShape) return;

    const umlObject = getUmlObjectById(selectedShape.dataset.id);

    const nextXMargin = Number(elements.xMarginControl.value);
    let dir = nextXMargin > umlObject.xMargin;

    const fontSize = umlObject.fontSize;
    const width = umlObject.width;

    if (nextXMargin > umlObject.boundaryXMargin && dir) {
      const maxTotalLinesCount = umlObject.maxTotalLinesCount;

      let nextWrapperThreshold = calculateWrapperThreshold(width, fontSize, nextXMargin);
      let newTotalLinesCount = calculateTotalLinesCount(selectedShape, nextWrapperThreshold);

      if (newTotalLinesCount > maxTotalLinesCount) {                        
        loadSavedState(selectedShape);
      } else {
        umlObject.xMargin = nextXMargin;
        setWrapperThreshold(selectedShape);
      }
      updateRowLines(selectedShape);
    } else {
      umlObject.xMargin = nextXMargin;
      setWrapperThreshold(selectedShape);

      if (umlObject.isOutOfBoundaryXMargin) {
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

    elements.xMarginControl.value = umlObject.xMargin;
    elements.xMarginLabel.textContent = `X Margin: ${nDigits(umlObject.xMargin)}`;

  });
  elements.sendCode.addEventListener("click", async () => {
    const umlCFGs = await createUml(elements.javaCode.value);
    renderUmlConfigs(umlCFGs);
  });
}

function initializeExistingShapes() {
  elements.canvasSvg.querySelectorAll(".canvas-shape").forEach((shape) => {
    const umlObject = getUmlObjectById(shape.dataset.id);
    bindShape(shape);
    moveShape(shape, umlObject.x, umlObject.y);
  });
  updateObjectList();
}

bindPageEvents();
initializeExistingShapes();