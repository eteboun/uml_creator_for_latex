import { createSvgElement, parseColor, svgYFromBottom, textWrapper } from "./utils.js";
import { elements } from "./dom.js";

const umlRows = new Map();
const umlSections = new Map();
export const umlSavedStates = new Map();

let factor = null;

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

export function setRelativePositions(umlGroup) {
  const sections = umlGroup.querySelectorAll(":scope > g");
  let sec_y = 0;

  sections.forEach((section) => {
    let starting_y = sec_y;
    section.setAttribute("transform", `translate(${0}, ${sec_y})`);
    
    let row_x = section.dataset.name === "title" ? Number(umlGroup.dataset.width) / 2 : Number(umlGroup.dataset.x_margin); 
    let row_y = Number(umlGroup.dataset.y_margin);
    const rows = section.querySelectorAll(":scope > g");

    rows.forEach((row) => {
      const lines = row.querySelectorAll(":scope > text > tspan");
      const row_height = getRowHeight(umlGroup, lines);
      
      let real_row_y = row_y + (row_height - Number(umlGroup.dataset.y_margin)) / 2;
      row.setAttribute("transform", `translate(${row_x}, ${real_row_y})`);

      sec_y += row_height;
      row_y += row_height;
    })

    row_y += Number(umlGroup.dataset.y_margin);
    sec_y += Number(umlGroup.dataset.y_margin);
    const section_height = sec_y - starting_y;

    let section_rect = section.querySelector("rect");
    section_rect.setAttribute("height", section_height);
    section_rect.setAttribute("width", Number(umlGroup.dataset.width));
  })
}

export function setYMargin(umlGroup) {
  let totalLinesHeight = getTotalLinesHeight(umlGroup);
  let totalPaddings = getTotalPaddings(umlGroup);
  umlGroup.dataset.y_margin = (Number(umlGroup.dataset.height) - totalLinesHeight) / totalPaddings;
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

export function setFontSize(umlGroup, font_size) {
  umlGroup.dataset.font_size = font_size;

  const texts = umlGroup.querySelectorAll(":scope > g > g > text");
  texts.forEach((text) => {
    text.setAttribute("font-size", umlGroup.dataset.font_size);
  })
}

export function setBaselineSkip(umlGroup) {
  umlGroup.dataset.baseline_skip = Number(umlGroup.dataset.font_size) * 1.2;

  const rows = umlGroup.querySelectorAll(":scope > g > g");
  rows.forEach((row) => {
    const lines = row.querySelectorAll(":scope > text > tspan");
    const firstDy = -((lines.length - 1) * umlGroup.dataset.baseline_skip) / 2;

    lines.forEach((line, index) => {
      let dy = index === 0 ? firstDy : Number(umlGroup.dataset.baseline_skip);
      line.setAttribute("dy", dy);
  });
  })
}

export function setBoundaryWidth(umlGroup) {
  const x_margin = Number(umlGroup.dataset.x_margin);
  const rows = umlGroup.querySelectorAll(":scope > g > g");
  let longestSeqLen = 0;
  let longestSeq = "";
  rows.forEach((row) => {
    const rowObj = getRowById(row.dataset.id);
    const content = rowObj.content;
    
    content.forEach((line) => {      
      if (line.length > longestSeqLen) {
        longestSeq = line;
        longestSeqLen = line.length;
      }
    })
  })

  const tempText = createSvgElement("text", {
    "font-size": umlGroup.dataset.font_size,
    "font-family": "monospace",
    visibility: "hidden"
  });
  const tempTSpan = createSvgElement("tspan", {});
  tempTSpan.textContent = longestSeq;
  tempText.appendChild(tempTSpan);

  elements.canvasSvg.appendChild(tempText);
  const textWidth = tempTSpan.getComputedTextLength();
  const boundaryWidth = textWidth + x_margin * 2;
  tempText.remove();

  umlGroup.dataset.boundaryWidth = boundaryWidth;
}

export function setMinHeight(umlGroup) {
  let minHeight = getTotalLinesHeight(umlGroup);
  umlGroup.dataset.minHeight = minHeight;
  umlGroup.dataset.height = Math.max(Number(umlGroup.dataset.height), minHeight);
}

export function setMaxFontSize(umlGroup) {
  const height = Number(umlGroup.dataset.height);
  const width = Number(umlGroup.dataset.width);
  const x_margin = Number(umlGroup.dataset.x_margin);

  const lines = umlGroup.querySelectorAll(":scope > g > g > text > tspan");
  const rows = umlGroup.querySelectorAll(":scope > g > g");

  let maxFontX = Infinity;
  lines.forEach((line) => {
    let currentMax = line.getComputedTextLength() /
                  (line.textContent.length * factor);

    if (currentMax < maxFontX) maxFontX = currentMax;
  })

  let maxFontY = (height / (lines.length * 1.2 - rows.length * 0.2));

  umlGroup.dataset.maxFontSize = Math.min(maxFontX, maxFontY);
}

export function setMaxXMargin(umlGroup) {
  let maxMargin = Infinity;
  const width = Number(umlGroup.dataset.width);
  const font_size = Number(umlGroup.dataset.font_size);

  const lines = umlGroup.querySelectorAll(":scope > g > g > text > tspan");
  lines.forEach((line) => {
    let currentMax = (width - line.getComputedTextLength()) / 2;
    
    if (currentMax < maxMargin) maxMargin = currentMax;
  })

  umlGroup.dataset.maxXMargin = maxMargin;
}

export function setWrapperThreshold(umlGroup) {
  umlGroup.dataset.wrapper_threshold = calculateWrapperThreshold(Number(umlGroup.dataset.width), Number(umlGroup.dataset.font_size), Number(umlGroup.dataset.x_margin));
}

export function calculateWrapperThreshold(width, font_size, x_margin) {
  return Math.floor((width - x_margin * 2) /
           (font_size * factor));
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

export function calculateTotalLinesCount(rows, wrapper_threshold) {
  let totalLinesCount = 0;
  rows.forEach((row) => {
    const rowObj = getRowById(row.dataset.id);
    const lines = createLines(rowObj.content, wrapper_threshold);
    totalLinesCount += lines.length;
  })
  return totalLinesCount;
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

export function calculateMinLineWidth(umlGroup) {
  let minWidth = 0;
  const lines = umlGroup.querySelectorAll(":scope > g > g > text > tspan");
  lines.forEach((line) => {
    let lineWidth = line.getComputedTextLength() +
            Number(umlGroup.dataset.x_margin) * 2;
    
    if (lineWidth > minWidth) minWidth = lineWidth;
  })
  return minWidth;
}

export function setMaxTotalLinesCount(umlGroup) {
  umlGroup.dataset.maxTotalLinesCount = Number(umlGroup.dataset.height) / Number(umlGroup.dataset.baseline_skip);
}

export function setIsOutOfBoundaryWidth(umlGroup) {
  umlGroup.dataset.isOutOfBoundaryWidth = Number(umlGroup.dataset.width) > Number(umlGroup.dataset.boundaryWidth);
}

export function calculateCharWidthFactor(font_size) {
  const sample = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("font-size", font_size);
  text.setAttribute("font-family", "monospace");
  text.setAttribute("visibility", "hidden");
  text.textContent = sample;

  elements.canvasSvg.appendChild(text);
  const width = text.getComputedTextLength();
  const factor = width / (font_size * sample.length);
  text.remove();

  return factor;
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