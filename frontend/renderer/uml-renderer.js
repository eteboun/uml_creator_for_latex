import {createSvgElement, parseColor, svgYFromBottom, textWrapper} from "../utils.js";
import {calculateCharWidthFactor} from "./calculators.js";
import {
  setBoundaryFontSize,
  setBoundaryWidth,
  setBoundaryXMargin,
  setIsOutOfBoundaryFontSize,
  setIsOutOfBoundaryWidth,
  setIsOutOfBoundaryXMargin,
  setMaxTotalLinesCount,
  setRelativePositions,
  setTextFontSize,
  setTotalLinesCount,
  setWrapperThreshold,
  setYMargin,
} from "./setters.js";

export const umlObjects = new Map();
export const umlSavedStates = new Map();

export let factor = null;

export function createRow(umlObject, sectionObject, row) {
  const rowGroup = createSvgElement("g", {});

  const id = crypto.randomUUID();
  const newRowObject = {
    anchor: row.anchor,
    content: row.content,
  };

  rowGroup.dataset.id = id;
  sectionObject.rows.set(id, newRowObject);

  const text = createText(umlObject, sectionObject, newRowObject);

  rowGroup.appendChild(text);
  return rowGroup;
}

export function createText(umlObject, sectionObject, rowObject) {

  const text = createSvgElement("text", {
    fill: parseColor(sectionObject.textColor),
    "font-family": "monospace",
    "dominant-baseline": "middle",
    "text-anchor": rowObject.anchor === "center" ? "middle" : "start"
  });

  const lines = createLines(rowObject, umlObject.wrapperThreshold);
  lines.forEach((line) => {
    const tspan = createSvgElement("tspan", {});
    tspan.textContent = line;
    text.appendChild(tspan);
  });

  return text;
}

export function createSection(umlObject, section) {
  const name = section.name;
  const config = section.config;

  const sectionGroup = createSvgElement("g", {
    class: `uml-section uml-section-${name}`,
  });

  const id = crypto.randomUUID();
  const newSectionObject = {
    name: name,
    textColor: config.textColor,
    backgroundColor: config.backgroundColor,
    rows: new Map(),
  };

  sectionGroup.appendChild(createSvgElement("rect", {
    fill: parseColor(config.backgroundColor),
    stroke: "#000000",
    "stroke-width": "0.04"
  }));

  section.rows.forEach((row) => {
    sectionGroup.appendChild(createRow(umlObject, newSectionObject, row));
  });

  sectionGroup.dataset.id = id;
  umlObject.sections.set(id, newSectionObject);

  return sectionGroup;
}

export function createUmlObject(objectConfig) {
  const name = objectConfig.name;
  const renderer = objectConfig.renderer;
  const sections = objectConfig.sections;

  factor = calculateCharWidthFactor(renderer.fontSize);

  let y = svgYFromBottom(renderer.y + renderer.height);
  const group = createSvgElement("g", {
    transform: `translate(${renderer.x}, ${y})`,
    class: "canvas-shape uml-object",
    tabindex: "0"
  });

  const id = crypto.randomUUID();
  group.dataset.id = id;

  const newUmlObject = {
    name: name,
    x: renderer.x,
    y: y,
    width: renderer.width,
    height: renderer.height,
    xMargin: renderer.xMargin,
    fontSize: renderer.fontSize,
    baselineSkip: renderer.fontSize * 1.2,

    sections : new Map(),
  }

  umlObjects.set(id, newUmlObject);
  setWrapperThreshold(group);

  sections.forEach((section) => {
    group.appendChild(createSection(newUmlObject, section));
  });
  
  setTextFontSize(group);
  setMaxTotalLinesCount(group);

  setBoundaryWidth(group);
  setIsOutOfBoundaryWidth(group);
  setBoundaryFontSize(group);
  setIsOutOfBoundaryFontSize(group);
  setBoundaryXMargin(group);
  setIsOutOfBoundaryXMargin(group);

  setYMargin(group);
  setTotalLinesCount(group);

  setRelativePositions(group);

  saveCurrentState(group);
  return group;
}

export function createLines(rowObject, threshold) {
  return rowObject.content.flatMap(text => textWrapper(text, threshold));
}

export function getUmlObjectById(id) {
  return umlObjects.get(id);
}

export function getSectionObjectById(umlObject, id) {
  return umlObject.sections.get(id);
}

export function getRowObjectById(sectionObject, id) {
  return sectionObject.rows.get(id);
}

export function getLinesHeight(lines, fontSize, baselineSkip) {
  return (lines.length - 1) *
   baselineSkip +
    fontSize;
}

export function getTotalLinesHeight(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  const rowGroups = umlGroup.querySelectorAll(":scope > g > g");

  let totalLinesHeight = 0;
  rowGroups.forEach((rowGroup) => {
    const lines = rowGroup.querySelectorAll(":scope > text > tspan");
    totalLinesHeight += getLinesHeight(lines, umlObject.fontSize, umlObject.baselineSkip);
  })
  return totalLinesHeight;
}

export function getTotalPaddings(umlGroup) {
  let totalPaddings = 0;
  const sectionGroups = umlGroup.querySelectorAll(":scope > g");
  sectionGroups.forEach((sectionGroup) => {
    totalPaddings += sectionGroup.querySelectorAll(":scope > g").length + 1;
  })
  return totalPaddings;
}

export function getRowHeight(umlGroup, lines) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);

  return (lines.length - 1) *
      umlObject.baselineSkip +
      umlObject.fontSize +
      umlObject.yMargin;
}

export function updateRowLines(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  const sectionGroups = umlGroup.querySelectorAll(":scope > g");
  sectionGroups.forEach((sectionGroup) => {
    const sectionObject = getSectionObjectById(umlObject, sectionGroup.dataset.id);
    const rowGroups = sectionGroup.querySelectorAll(":scope > g");
    rowGroups.forEach((rowGroup) => {
      const rowObject = getRowObjectById(sectionObject, rowGroup.dataset.id);

      rowGroup.querySelector(":scope > text").remove();
      const text = createText(umlObject, sectionObject, rowObject);

      rowGroup.appendChild(text);
    })
  })
}

export function loadSavedState(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  const umlSave = umlSavedStates.get(umlGroup.dataset.id);

  umlObject.width = umlSave.width;
  umlObject.height = umlSave.height;
  umlObject.wrapperThreshold = umlSave.wrapperThreshold;
  umlObject.fontSize = umlSave.fontSize;
  umlObject.xMargin = umlSave.xMargin;
}

export function saveCurrentState(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);

  umlSavedStates.set(umlGroup.dataset.id, {
    width: umlObject.width,
    wrapperThreshold: umlObject.wrapperThreshold,
    fontSize: umlObject.fontSize,
    height: umlObject.height,
    xMargin: umlObject.xMargin,
  });
}