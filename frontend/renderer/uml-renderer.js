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

const umlRows = new Map();
const umlSections = new Map();

export let factor = null;
export const umlSavedStates = new Map();

export function createRow(umlGroup, sectionGroup, row) {
  const rowGroup = createSvgElement("g", {});

  const id = crypto.randomUUID();
  rowGroup.dataset.id = id;
  rowGroup.dataset.anchor = row.anchor;
  umlRows.set(id, {
    content: row.content,
  });

  const text = createText(umlGroup, sectionGroup, rowGroup);
  rowGroup.appendChild(text);
  return rowGroup;
}

export function createText(umlGroup, sectionGroup, rowGroup) {
  const rowObj = getRowById(rowGroup.dataset.id);
  const sectionObj = getSectionById(sectionGroup.dataset.id);

  const text = createSvgElement("text", {
    fill: parseColor(sectionObj.textColor),
    "font-family": "monospace",
    "dominant-baseline": "middle",
    "text-anchor": rowGroup.dataset.anchor === "center" ? "middle" : "start"
  });

  const lines = createLines(rowObj.content, Number(umlGroup.dataset.wrapper_threshold));

  lines.forEach((line) => {
    const tspan = createSvgElement("tspan", {});
    tspan.textContent = line;
    text.appendChild(tspan);
  });

  return text;
}

export function createSection(umlGroup, section) {
  const sectionGroup = createSvgElement("g", {
    class: `uml-section uml-section-${section.name}`,
  });

  const id = crypto.randomUUID();
  umlSections.set(id, {
    textColor: section.config.textColor,
    backgroundColor: section.config.backgroundColor
  })
  sectionGroup.dataset.name = section.name;
  sectionGroup.dataset.id = id;

  sectionGroup.appendChild(createSvgElement("rect", {
    fill: parseColor(section.config.backgroundColor),
    stroke: "#000000",
    "stroke-width": "0.04"
  }));

  section.rows.forEach((row) => {
    sectionGroup.appendChild(createRow(umlGroup, sectionGroup, row));
  });

  return sectionGroup;
}

export function createUmlObject(objectConfig) {
  const name = objectConfig.name;
  const renderer = objectConfig.renderer;
  const sections = objectConfig.sections;

  let y = svgYFromBottom(renderer.y + renderer.height);
  const group = createSvgElement("g", {
    transform: `translate(${renderer.x}, ${y})`,
    class: "canvas-shape uml-object",
    tabindex: "0"
  });

  group.dataset.id = crypto.randomUUID();
  group.dataset.name = name;
  group.dataset.x = renderer.x;
  group.dataset.y = y;
  group.dataset.xMargin = renderer.xMargin;

  group.dataset.fontSize = renderer.fontSize;
  group.dataset.baselineSkip = renderer.fontSize * 1.2;

  factor = calculateCharWidthFactor(renderer.fontSize);

  group.dataset.width = renderer.width;
  group.dataset.height = renderer.height;
  setWrapperThreshold(group);

  sections.forEach((section) => {
    group.appendChild(createSection(group, section));
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

export function getLinesHeight(lines, fontSize, baselineSkip) {
  return (lines.length - 1) *
   baselineSkip +
    fontSize;
}

export function getTotalLinesHeight(umlGroup) {
  const rows = umlGroup.querySelectorAll(":scope > g > g");
  let totalLinesHeight = 0;
  rows.forEach((row) => {
    const lines = row.querySelectorAll(":scope > text > tspan");
    totalLinesHeight += getLinesHeight(lines, Number(umlGroup.dataset.fontSize), Number(umlGroup.dataset.baselineSkip));
  })
  return totalLinesHeight;
}

export function getTotalPaddings(umlGroup) {
  let totalPaddings = 0;
  const sections = umlGroup.querySelectorAll(":scope > g");
  sections.forEach((section) => {
    totalPaddings += section.querySelectorAll(":scope > g").length + 1;
  })
  return totalPaddings;
}

export function getRowHeight(umlGroup, lines) {
  return (lines.length - 1) *
   Number(umlGroup.dataset.baselineSkip) +
    Number(umlGroup.dataset.fontSize) +
     Number(umlGroup.dataset.y_margin);
}

export function createLines(content, threshold) {
  return content.flatMap(text => textWrapper(text, threshold));
}

export function getRowById(id) {
  return umlRows.get(id);
}

export function getSectionById(id) {
  return umlSections.get(id);
}

export function updateRowLines(umlGroup) {
  const sections = umlGroup.querySelectorAll(":scope > g");
  sections.forEach((section) => {
    const rows = section.querySelectorAll(":scope > g");
    rows.forEach((row) => {
      row.querySelector(":scope > text").remove();
      const text = createText(umlGroup, section, row);

      row.appendChild(text);
    })
  })
}

export function loadSavedState(umlGroup) {
  const id = umlGroup.dataset.id;
  const save = umlSavedStates.get(id);

  umlGroup.dataset.width = save.width;
  umlGroup.dataset.wrapper_threshold = save.wrapper_threshold;  
  umlGroup.dataset.fontSize = save.fontSize;
  umlGroup.dataset.height = save.height;
  umlGroup.dataset.xMargin = save.xMargin;
}

export function saveCurrentState(umlGroup) {
  const id = umlGroup.dataset.id;

  umlSavedStates.set(id, {
    width: Number(umlGroup.dataset.width),
    wrapper_threshold: Number(umlGroup.dataset.wrapper_threshold),
    fontSize: Number(umlGroup.dataset.fontSize),
    height: Number(umlGroup.dataset.height),
    xMargin: Number(umlGroup.dataset.xMargin)
  });
}