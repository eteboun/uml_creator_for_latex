import { createUml } from "./api.js";
import { canvasSize } from "./config.js";
import { elements } from "./dom.js";
import { createUmlObject,
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
   calculateNextMaxTotalLinesCount, 
   } from "./renderer/calculators.js";
import { clamp, stagePoint, nDigits } from "./utils.js";

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
    const item = document.createElement("button");
    item.type = "button";
    item.className = "object-list-item";
    item.classList.toggle("selected", shape === selectedShape);
    item.textContent = `${index + 1}. ${shape.dataset.name}`;
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
    elements.fontSizeControl.value = selectedShape.dataset.fontSize;
    elements.xMarginControl.value = selectedShape.dataset.xMargin;

    elements.cornerReadout.textContent = `Left top: ${nDigits(selectedShape.dataset.x)}, ${nDigits(selectedShape.dataset.y)}`;
    elements.widthLabel.textContent = `Width: ${nDigits(selectedShape.dataset.width)}`;
    elements.heightLabel.textContent = `Height: ${nDigits(selectedShape.dataset.height)}`;
    elements.fontSizeLabel.textContent = `Font Size: ${nDigits(selectedShape.dataset.fontSize)}`;
    elements.xMarginLabel.textContent = `X Margin: ${nDigits(selectedShape.dataset.xMargin)}`;

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

function applySize(shape) {
  const width = clamp(Number(shape.dataset.width), 1, canvasSize.width - Number(shape.dataset.x));
  const height = clamp(Number(shape.dataset.height), 1, canvasSize.height - Number(shape.dataset.y));
  shape.dataset.width = width;
  shape.dataset.height = height;
}

function moveShape(shape, x, y) {
  applySize(shape);
  const size = shapeSizeInCanvasUnits(shape);
  const maxX = Math.max(0, canvasSize.width - size.width);
  const maxY = Math.max(0, canvasSize.height - size.height);
  shape.dataset.x = clamp(x, 0, maxX);
  shape.dataset.y = clamp(y, 0, maxY);

  applyShapeTransform(shape);

  if (shape === selectedShape) {
    updateSelectionControls();
  }
}

function bindShape(shape) {
  applySize(shape);

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

  elements.deleteObject.addEventListener("click", () => {
    if (!selectedShape) return;

    const shapeToDelete = selectedShape;
    elements.deleteObject.disabled = true;

    shapeToDelete.remove();
    selectedShape = null;
    updateSelectionControls();
    updateObjectList();    
  });

  elements.xLengthControl.addEventListener("input", () => {
    if (!selectedShape) return;
    
    let nextWidth = Number(elements.xLengthControl.value);
    nextWidth = clamp(nextWidth, 1, canvasSize.width - Number(selectedShape.dataset.x));    
    
    let dir = nextWidth > Number(selectedShape.dataset.width);
    const fontSize = Number(selectedShape.dataset.fontSize);
    const xMargin = Number(selectedShape.dataset.xMargin);

    if (nextWidth < Number(selectedShape.dataset.boundaryWidth) && !dir) {      
      const maxTotalLinesCount = Number(selectedShape.dataset.maxTotalLinesCount);
      const rows = selectedShape.querySelectorAll(":scope > g > g");

      let nextWrapperThreshold = calculateWrapperThreshold(nextWidth, fontSize, xMargin);
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
    const baselineSkip = Number(selectedShape.dataset.baselineSkip);
    const y = Number(selectedShape.dataset.y);
    nextHeight = clamp(nextHeight, 1, canvasSize.height - y); 

    const nextMaxTotalLinesCount = calculateNextMaxTotalLinesCount(nextHeight, baselineSkip);
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
    let dir = nextFontSize > Number(selectedShape.dataset.fontSize);

    const width = Number(selectedShape.dataset.width);
    const xMargin = Number(selectedShape.dataset.xMargin);    
    const height = Number(selectedShape.dataset.height);

    if (nextFontSize > Number(selectedShape.dataset.boundaryFontSize) && dir) {
      const nextMaxTotalLinesCount = calculateNextMaxTotalLinesCount(height, nextBaselineSkip);
      const rows = selectedShape.querySelectorAll(":scope > g > g");

      let nextWrapperThreshold = calculateWrapperThreshold(width, nextFontSize, xMargin);
      nextWrapperThreshold = Math.max(nextWrapperThreshold, 1);
      let newTotalLinesCount = calculateTotalLinesCount(rows, nextWrapperThreshold);      

      if (newTotalLinesCount > nextMaxTotalLinesCount) {                        
        loadSavedState(selectedShape);
      } else {
        selectedShape.dataset.fontSize = nextFontSize;
        setWrapperThreshold(selectedShape);
      }
      updateRowLines(selectedShape);
    } else {
      selectedShape.dataset.fontSize = nextFontSize;
      setWrapperThreshold(selectedShape);

      if (selectedShape.dataset.isOutOfBoundaryFontSize === "true") {        
        updateRowLines(selectedShape);
      }
    }

    selectedShape.dataset.baselineSkip = Number(selectedShape.dataset.fontSize) * 1.2;
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

    elements.fontSizeControl.value = selectedShape.dataset.fontSize;
    elements.fontSizeLabel.textContent = `Font Size: ${nDigits(selectedShape.dataset.fontSize)}`;

  });

  elements.xMarginControl.addEventListener("input", () => {
    if (!selectedShape) return;

    const nextXMargin = Number(elements.xMarginControl.value);
    let dir = nextXMargin > Number(selectedShape.dataset.xMargin);

    const fontSize = Number(selectedShape.dataset.fontSize);
    const width = Number(selectedShape.dataset.width);

    if (nextXMargin > Number(selectedShape.dataset.boundaryXMargin) && dir) {      
      const maxTotalLinesCount = Number(selectedShape.dataset.maxTotalLinesCount);
      const rows = selectedShape.querySelectorAll(":scope > g > g");

      let nextWrapperThreshold = calculateWrapperThreshold(width, fontSize, nextXMargin);
      nextWrapperThreshold = Math.max(nextWrapperThreshold, 1);
      
      let newTotalLinesCount = calculateTotalLinesCount(rows, nextWrapperThreshold);

      if (newTotalLinesCount > maxTotalLinesCount) {                        
        loadSavedState(selectedShape);
      } else {
        selectedShape.dataset.xMargin = nextXMargin;
        setWrapperThreshold(selectedShape);
      }
      updateRowLines(selectedShape);
    } else {
      selectedShape.dataset.xMargin = nextXMargin;
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

    elements.xMarginControl.value = selectedShape.dataset.xMargin;
    elements.xMarginLabel.textContent = `X Margin: ${nDigits(selectedShape.dataset.xMargin)}`;

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