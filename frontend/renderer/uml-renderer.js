import { createSvgElement, parseColor,
   svgYFromBottom, textWrapper } from "../utils.js";
import { elements } from "../dom.js";
import { calculateCharWidthFactor } from "./calculators.js";
import { setBoundaryWidth, setIsOutOfBoundaryWidth,
  setMaxFontSize, setMaxTotalLinesCount,
  setMaxXMargin, setMinHeight,
  setRelativePositions, setWrapperThreshold,
  setYMargin
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
    fill: parseColor(sectionObj.text_color),
    "font-size": umlGroup.dataset.font_size,
    "font-family": "monospace",
    "dominant-baseline": "middle",
    "text-anchor": rowGroup.dataset.anchor === "center" ? "middle" : "start"
  });

  const lines = createLines(rowObj.content, Number(umlGroup.dataset.wrapper_threshold));

  const baseline_skip = Number(umlGroup.dataset.baseline_skip);
  const firstDy = -((lines.length - 1) * baseline_skip) / 2;
  lines.forEach((line, index) => {
    const tspan = createSvgElement("tspan", {
      x: 0,
      dy: index === 0 ? firstDy : baseline_skip
    });
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
    text_color: section.config.text_color,
    background_color: section.config.background_color
  })
  sectionGroup.dataset.name = section.name;
  sectionGroup.dataset.id = id;

  sectionGroup.appendChild(createSvgElement("rect", {
    fill: parseColor(section.config.background_color),
    stroke: "#000000",
    "stroke-width": "0.04"
  }));

  section.rows.forEach((row) => {
    sectionGroup.appendChild(createRow(umlGroup, sectionGroup, row));
  });

  return sectionGroup;
}

export function createUmlObject(objectConfig) {
  objectConfig = {
    ...objectConfig.config,
    ...objectConfig
  };
  delete objectConfig.config;

  let y = svgYFromBottom(objectConfig.y + objectConfig.height);
  const group = createSvgElement("g", {
    transform: `translate(${objectConfig.x}, ${y})`,
    class: "canvas-shape uml-object",
    tabindex: "0"
  });

  const id = crypto.randomUUID();
  group.dataset.id = id;
  group.dataset.name = objectConfig.name;
  group.dataset.x = objectConfig.x;
  group.dataset.y = y;
  group.dataset.x_margin = objectConfig.x_margin;

  group.dataset.font_size = objectConfig.font_size;
  group.dataset.baseline_skip = objectConfig.baseline_skip;
  factor = calculateCharWidthFactor(objectConfig.font_size);

  group.dataset.width = objectConfig.width;
  group.dataset.height = objectConfig.height;
  setWrapperThreshold(group);

  objectConfig.sections.forEach((section) => {
    group.appendChild(createSection(group, section));
  });

  setMinHeight(group);
  setMaxTotalLinesCount(group);
  setBoundaryWidth(group);
  setIsOutOfBoundaryWidth(group);
  setYMargin(group);
  setMaxFontSize(group);
  setMaxXMargin(group);

  setRelativePositions(group);

  saveCurrentState(group);

  return group;
}

export function getLinesHeight(lines, font_size, baseline_skip) {
  return (lines.length - 1) *
   baseline_skip +
    font_size;
}

export function getTotalLinesHeight(umlGroup) {
  const rows = umlGroup.querySelectorAll(":scope > g > g");
  let totalLinesHeight = 0;
  rows.forEach((row) => {
    const lines = row.querySelectorAll(":scope > text > tspan");
    totalLinesHeight += getLinesHeight(lines, Number(umlGroup.dataset.font_size), Number(umlGroup.dataset.baseline_skip));
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
   Number(umlGroup.dataset.baseline_skip) +
    Number(umlGroup.dataset.font_size) +
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
}

export function saveCurrentState(umlGroup) {
  const id = umlGroup.dataset.id;
  const save = umlSavedStates.get(id);  

  umlSavedStates.set(id, {
    width: Number(umlGroup.dataset.width),
    wrapper_threshold: Number(umlGroup.dataset.wrapper_threshold),
  });
}