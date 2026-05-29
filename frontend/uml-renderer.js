import { createSvgElement, parseColor, svgYFromBottom, textWrapper } from "./utils.js";

const umlRows = new Map();
const umlSections = new Map();

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
    "font-family": "Arial, Helvetica, sans-serif",
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

  let boundaryWidth = calculateBoundaryWidth(group);
  group.dataset.width = Math.max(boundaryWidth, objectConfig.width);
  group.dataset.boundaryWidth = boundaryWidth;

  let threshold = calculateWrapperThreshold(group);
  group.dataset.wrapper_threshold = threshold;

  group.appendChild(createSvgElement("rect", {
    class: "selection-rect",
    x: -0.2,
    y: 0.2,
    fill: "none"
  }));

  objectConfig.sections.forEach((section) => {
    group.appendChild(createSection(group, section));
  });

  let minHeight = calculateMinHeight(group);
  group.dataset.height = Math.max(minHeight, objectConfig.height);
  group.dataset.minHeight = minHeight;

  setYMargin(group);
  group.dataset.maxFontSize = calculateMaxFontSize(group);
  group.dataset.maxXMargin = calculateMaxXMargin(group);

  setRelativePositions(group);
  setSelectionBox(group);

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

export function setSelectionBox(umlGroup) {
  const box = umlGroup.querySelector(":scope > rect");
  box.setAttribute("width", Number(umlGroup.dataset.width));
  box.setAttribute("height", Number(umlGroup.dataset.height));
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

export function calculateBoundaryWidth(umlGroup) {
  let boundaryWidth = 0;
  const font_size = Number(umlGroup.dataset.font_size);
  const x_margin = Number(umlGroup.dataset.x_margin);

  const lines = umlGroup.querySelectorAll(":scope > g > g > text > tspan");
  lines.forEach((line) => {
    let lineWidth = line.textContent.length *
     font_size * 0.5 +
     x_margin * 2;
    if (lineWidth > boundaryWidth) boundaryWidth = lineWidth;
  })

  return boundaryWidth;
}

export function calculateMinHeight(umlGroup) {
  return getTotalLinesHeight(umlGroup);
}

export function calculateMaxFontSize(umlGroup) {
  const height = Number(umlGroup.dataset.height);
  const width = Number(umlGroup.dataset.width);
  const x_margin = Number(umlGroup.dataset.x_margin);

  const lines = umlGroup.querySelectorAll(":scope > g > g > text > tspan");
  const rows = umlGroup.querySelectorAll(":scope > g > g");

  let maxFontX = Infinity;
  lines.forEach((line) => {
    let currentMax = (width - x_margin * 2) /
     (line.textContent.length * 0.5);
    
    if (currentMax < maxFontX) maxFontX = currentMax;
  })

  let maxFontY = (height / (lines.length * 1.2 - rows.length * 0.2));

  return Math.min(maxFontX, maxFontY);
}

export function calculateMaxXMargin(umlGroup) {
  let maxMargin = Infinity;
  const width = Number(umlGroup.dataset.width);
  const font_size = Number(umlGroup.dataset.font_size);

  const lines = umlGroup.querySelectorAll(":scope > g > g > text > tspan");
  lines.forEach((line) => {
    let currentMax = (width - line.textContent.length * font_size * 0.5) / 2;
    
    if (currentMax < maxMargin) maxMargin = currentMax;
  })

  return maxMargin;
}

export function calculateWrapperThreshold(umlGroup) {
  return (Number(umlGroup.dataset.width) - Number(umlGroup.dataset.x_margin) * 2) /
           (Number(umlGroup.dataset.font_size) * 0.5).toFixed(1);
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

export function lookAheadTotalLinesHeight(rows, wrapper_threshold, font_size, baseline_skip) {
  let totalLinesHeight = 0;
  rows.forEach((row) => {
    const rowObj = getRowById(row.dataset.id);
    const lines = createLines(rowObj.content, wrapper_threshold);
    totalLinesHeight += getLinesHeight(lines, font_size, baseline_skip);
  })
  return totalLinesHeight;
}

export function updateRowLines(umlGroup) {
  const sections = umlGroup.querySelectorAll(":scope > g");
  sections.forEach((section) => {
    const rows = section.querySelector(":scope > g");
    rows.forEach((row) => {
      row.querySelector(":scope > text").remove();
      const text = createText(umlGroup, section, row);

      row.appendChild(text);
    })
  })
}

