const javaCode = document.querySelector("#javaCode");
const sendCode = document.querySelector("#sendCode");
const saveConfig = document.querySelector("#saveConfig");
const latexCode = document.querySelector("#latexCode");
const stage = document.querySelector("#stage");
const canvasSvg = document.querySelector("#canvasSvg");
const umlObjects = document.querySelector("#umlObjects");
const deleteObject = document.querySelector("#deleteObject");
const sizeControl = document.querySelector("#sizeControl");
const cornerReadout = document.querySelector("#cornerReadout");
const scaleReadout = document.querySelector("#scaleReadout");

const canvasSize = {
  width: 21,
  height: 29.7
};
const svgNS = "http://www.w3.org/2000/svg";
const saveConfigUrl = "http://localhost:8000/uml/update";
const deleteUmlUrl = "http://localhost:8000/uml/delete";

let activeDrag = null;
let nextZ = 1;
let selectedShape = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function stagePoint(event) {
  const rect = stage.getBoundingClientRect();
  const svgX = ((event.clientX - rect.left) / rect.width) * canvasSize.width;
  const svgY = ((event.clientY - rect.top) / rect.height) * canvasSize.height;

  return {
    x: svgX,
    y: canvasSize.height - svgY
  };
}

function svgYFromBottom(y) {
  return canvasSize.height - y;
}

function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS(svgNS, tagName);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

function parsePosition(position, fallbackX = 0, fallbackY = 0) {
  if (Array.isArray(position)) {
    return {
      x: Number(position[0] ?? fallbackX),
      y: Number(position[1] ?? fallbackY)
    };
  }

  if (position && typeof position === "object") {
    return {
      x: Number(position.x ?? fallbackX),
      y: Number(position.y ?? fallbackY)
    };
  }

  return {
    x: fallbackX,
    y: fallbackY
  };
}

function getSectionBounds(sections = []) {
  const bounds = sections.reduce((acc, section) => {
    const sectionPosition = parsePosition(section.position);
    const sectionHeight = Number(section.height || 0);
    const centeredWidths = (section.rows || [])
      .filter((row) => row.anchor === "center" || row.align === "center")
      .map((row) => Math.max(0, (parsePosition(row.position).x - sectionPosition.x) * 2));
    const rowXs = (section.rows || []).map((row) => parsePosition(row.position).x);
    const fallbackWidth = rowXs.length ? Math.max(...rowXs) - sectionPosition.x : 1;
    const sectionWidth = Number(section.width || Math.max(...centeredWidths, fallbackWidth, 1));

    return {
      minX: Math.min(acc.minX, sectionPosition.x),
      minY: Math.min(acc.minY, sectionPosition.y),
      maxX: Math.max(acc.maxX, sectionPosition.x + sectionWidth),
      maxY: Math.max(acc.maxY, sectionPosition.y + sectionHeight)
    };
  }, {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  });

  if (!Number.isFinite(bounds.minX)) {
    return {
      x: 0,
      y: 0,
      width: 1,
      height: 1
    };
  }

  return {
    x: bounds.minX,
    y: bounds.minY,
    width: Math.max(1, bounds.maxX - bounds.minX),
    height: Math.max(1, bounds.maxY - bounds.minY)
  };
}
function latexColorToCss(color) {
  const namedColors = {
    black: "#000000",
    blue: "#0000ff",
    white: "#ffffff",
    yellow: "#ffff00"
  };

  if (!color) return "#ffffff";
  const rawColor = String(color).toLowerCase();
  if (rawColor.startsWith("#") || rawColor.startsWith("rgb")) return color;

  const [name, percent] = rawColor.split("!");
  const baseColor = namedColors[name] || color;
  if (!percent || !namedColors[name]) return baseColor;

  const amount = clamp(Number(percent), 0, 100) / 100;
  const base = baseColor.match(/\w\w/g).map((value) => parseInt(value, 16));
  const mixed = base.map((channel) => {
    return Math.round((channel * amount) + (255 * (1 - amount)));
  });

  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

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

function createTextRow(row, objectConfig) {
  const rowPosition = parsePosition(row.position);
  const fontSize = Number(objectConfig.font_size || 0.6);
  const text = createSvgElement("text", {
    x: rowPosition.x,
    y: svgYFromBottom(rowPosition.y),
    fill: latexColorToCss(row.text_color || objectConfig.text_color || "black"),
    "font-size": fontSize,
    "font-family": "Arial, Helvetica, sans-serif",
    "dominant-baseline": "middle",
    "text-anchor": row.anchor === "center" ? "middle" : "start"
  });
  const lines = Array.isArray(row.content)
    ? row.content.map((line) => String(line))
    : String(row.content || "").split(/\r?\n/);
  const baselineSkip = Number(objectConfig.baseline_skip || fontSize);
  const firstDy = -((lines.length - 1) * baselineSkip) / 2;

  lines.forEach((line, index) => {
    const tspan = createSvgElement("tspan", {
      x: rowPosition.x,
      dy: index === 0 ? firstDy : baselineSkip
    });
    tspan.textContent = line;
    text.appendChild(tspan);
  });

  return text;
}

function createSection(section, objectConfig, objectWidth) {
  const sectionPosition = parsePosition(section.position);
  const sectionHeight = Number(section.height || 0);
  const sectionConfig = {
    ...objectConfig,
    ...(section.config || {})
  };
  const group = createSvgElement("g", {
    class: `uml-section uml-section-${section.name || "unnamed"}`
  });

  group.appendChild(createSvgElement("rect", {
    x: sectionPosition.x,
    y: svgYFromBottom(sectionPosition.y + sectionHeight),
    width: objectWidth,
    height: sectionHeight,
    fill: latexColorToCss(sectionConfig.background_color || "white"),
    stroke: "#000000",
    "stroke-width": "0.04"
  }));

  (section.rows || []).forEach((row) => {
    group.appendChild(createTextRow(row, sectionConfig));
  });

  return group;
}

function createUmlObject(objectConfig, index) {
  const bounds = getSectionBounds(objectConfig.sections || []);
  const x = Number(objectConfig.x ?? bounds.x);
  const y = Number(objectConfig.y ?? bounds.y);
  const width = Number(objectConfig.width ?? bounds.width);
  const height = Number(objectConfig.height ?? bounds.height);
  const baseX = Number(objectConfig.width == null ? bounds.x : x);
  const baseY = Number(objectConfig.height == null ? bounds.y : y);
  const scale = Number(objectConfig.scale || 1);
  const group = createSvgElement("g", {
    class: "canvas-shape uml-object",
    tabindex: "0"
  });

  group.dataset.id = objectConfig.id || objectConfig.name || `uml-${index + 1}`;
  group.dataset.label = objectConfig.name || objectConfig.id || `UML Object ${index + 1}`;
  group.dataset.baseX = baseX;
  group.dataset.baseY = baseY;
  group.dataset.x = x;
  group.dataset.y = y;
  group.dataset.initialWidth = width;
  group.dataset.initialHeight = height;
  group.dataset.width = width * scale;
  group.dataset.config = JSON.stringify(objectConfig);

  group.appendChild(createSvgElement("rect", {
    class: "selection-rect",
    x: baseX + 0.04,
    y: svgYFromBottom(baseY + height) + 0.04,
    width: Math.max(0, width - 0.08),
    height: Math.max(0, height - 0.08),
    fill: "none"
  }));

  (objectConfig.sections || []).forEach((section) => {
    group.appendChild(createSection(section, objectConfig, width));
  });

  applyShapeTransform(group);
  return group;
}

function normalizeUmlObjects(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.objects)) return payload.objects;
  if (Array.isArray(payload?.umlCFGs)) return payload.umlCFGs;
  if (payload && typeof payload === "object") return [payload];
  return [];
}

function renderUmlConfigs(umlCFGs) {
  const objects = normalizeUmlObjects(umlCFGs);
  const existingCount = canvasSvg.querySelectorAll(".canvas-shape").length;
  let firstNewShape = null;

  objects.forEach((objectConfig, index) => {
    const shape = createUmlObject(objectConfig, existingCount + index);
    canvasSvg.appendChild(shape);
    bindShape(shape);
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
  return Array.from(canvasSvg.querySelectorAll(".canvas-shape")).map(getShapeConfigPayload);
}

function updateObjectList() {
  const shapes = Array.from(canvasSvg.querySelectorAll(".canvas-shape"));
  stage.classList.toggle("has-items", shapes.length > 0);

  if (selectedShape && !shapes.includes(selectedShape)) {
    selectedShape = null;
    updateSelectionControls();
  }

  if (shapes.length === 0) {
    umlObjects.innerHTML = '<div class="uml-empty">Generated UML diagrams will appear here.</div>';
    return;
  }

  umlObjects.innerHTML = "";
  shapes.forEach((shape, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "object-list-item";
    item.classList.toggle("selected", shape === selectedShape);
    item.textContent = `${index + 1}. ${shape.dataset.label}`;
    item.addEventListener("click", () => setSelectedShape(shape));
    umlObjects.appendChild(item);
  });
}

function updateSelectionControls() {
  const hasSelection = Boolean(selectedShape);
  const hasObjects = Boolean(canvasSvg.querySelector(".canvas-shape"));
  deleteObject.disabled = !hasSelection;
  sizeControl.disabled = !hasSelection;
  saveConfig.disabled = !hasObjects;

  if (hasSelection) {
    const initialWidth = Number(selectedShape.dataset.initialWidth || selectedShape.dataset.width);
    const scale = Number(selectedShape.dataset.width) / initialWidth;

    sizeControl.value = selectedShape.dataset.width;
    cornerReadout.textContent = `Left bottom: ${selectedShape.dataset.leftBottomX}, ${selectedShape.dataset.leftBottomY}`;
    scaleReadout.textContent = `Scale: ${scale.toFixed(2)}x`;
  } else {
    cornerReadout.textContent = "Left bottom: -";
    scaleReadout.textContent = "Scale: -";
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

function applyPosition(shape) {
  applyShapeTransform(shape);
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
  applyPosition(shape);
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

stage.addEventListener("pointerdown", (event) => {
  if (event.target === stage || event.target === canvasSvg || event.target.classList.contains("canvas-background")) {
    setSelectedShape(null);
  }
});

window.addEventListener("pointermove", (event) => {
  if (!activeDrag) return;

  const point = stagePoint(event);
  moveShape(activeDrag.shape, point.x - activeDrag.offsetX, point.y - activeDrag.offsetY);
});

window.addEventListener("pointerup", (event) => {
  if (!activeDrag) return;

  if (activeDrag.type === "move") {
    activeDrag.shape.classList.remove("dragging");
  }

  activeDrag = null;
});

window.addEventListener("resize", () => {
  canvasSvg.querySelectorAll(".canvas-shape").forEach((shape) => {
    moveShape(shape, Number(shape.dataset.x), Number(shape.dataset.y));
  });
});

deleteObject.addEventListener("click", async () => {
  if (!selectedShape) return;

  const shapeToDelete = selectedShape;
  const id = getShapeId(shapeToDelete);
  deleteObject.disabled = true;

  try {
    const response = await fetch(deleteUmlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id })
    });

    if (!response.ok) {
      throw new Error(`Delete failed with status ${response.status}`);
    }

    shapeToDelete.remove();
    selectedShape = null;
    updateSelectionControls();
    updateObjectList();
  } catch (error) {
    console.error(error);
    updateSelectionControls();
  }
});

saveConfig.addEventListener("click", async () => {
  const configs = getChangedConfigsPayload();
  if (configs.length === 0) return;

  const response = await fetch(saveConfigUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(configs)
  });

  const result = await response.json();
  const latex = typeof result === "string"
    ? result
    : result.latex || result.latex_code || result.code || JSON.stringify(result, null, 2);

  latexCode.value = latex;
  console.log(result);
});

sizeControl.addEventListener("input", () => {
  if (!selectedShape) return;

  const bottom = Number(selectedShape.dataset.y);
  selectedShape.dataset.width = sizeControl.value;
  applySize(selectedShape);
  moveShape(selectedShape, Number(selectedShape.dataset.x), bottom);
  sizeControl.value = selectedShape.dataset.width;
});

sendCode.addEventListener("click", async () => {
  const code = javaCode.value;

  const response = await fetch("http://localhost:8000/uml/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      code
    })
  });

  const umlCFGs = await response.json();
  console.log(umlCFGs);
  renderUmlConfigs(umlCFGs);
});

canvasSvg.querySelectorAll(".canvas-shape").forEach((shape) => {
  bindShape(shape);
  moveShape(shape, Number(shape.dataset.x), Number(shape.dataset.y));
});
updateObjectList();
