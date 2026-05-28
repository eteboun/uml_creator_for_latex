import { createSvgElement, parseColor, svgYFromBottom } from "./utils.js";

export function createRow(row, section, objectConfig) {
  const rowGroup = createSvgElement("g", {});

  const text = createSvgElement("text", {
    fill: parseColor(section.config.text_color),
    "font-size": objectConfig.font_size,
    "font-family": "Arial, Helvetica, sans-serif",
    "dominant-baseline": "middle",
    "text-anchor": row.anchor === "center" ? "middle" : "start"
  });

  const firstDy = -((row.lines.length - 1) * objectConfig.baseline_skip) / 2;
  row.lines.forEach((line, index) => {
    const tspan = createSvgElement("tspan", {
      x: 0,
      dy: index === 0 ? firstDy : objectConfig.baseline_skip
    });
    tspan.textContent = line;
    text.appendChild(tspan);
  });

  rowGroup.appendChild(text);
  return rowGroup;
}

export function createSection(section, objectConfig) {
  const group = createSvgElement("g", {
    class: `uml-section uml-section-${section.name}`,
  });

  group.dataset.name = section.name;
  group.appendChild(createSvgElement("rect", {
    fill: parseColor(section.config.background_color),
    stroke: "#000000",
    "stroke-width": "0.04"
  }));

  section.rows.forEach((row) => {
    group.appendChild(createRow(row, section, objectConfig));
  });

  return group;
}

export function createUmlObject(objectConfig) {
  objectConfig = {
    ...objectConfig.config,
    ...objectConfig
  };
  delete objectConfig.config;

  const group = createSvgElement("g", {
    transform: `translate(${objectConfig.x}, ${svgYFromBottom(objectConfig.y)})`,
    class: "canvas-shape uml-object",
    tabindex: "0"
  });

  group.dataset.id = objectConfig.id;
  group.dataset.name = objectConfig.name;
  group.dataset.x = objectConfig.x;
  group.dataset.y = objectConfig.y;
  group.dataset.x_margin = objectConfig.x_margin;
  group.dataset.width = objectConfig.width;
  group.dataset.height = objectConfig.height;
  group.dataset.font_size = objectConfig.font_size;
  group.dataset.baseline_skip = objectConfig.baseline_skip;

  group.appendChild(createSvgElement("rect", {
    class: "selection-rect",
    x: -0.2,
    y: 0.2,
    fill: "none"
  }));

  objectConfig.sections.forEach((section) => {
    group.appendChild(createSection(section, objectConfig));
  });

  group.dataset.y_margin = calculateYMargin(group);
  setRelativePositions(group);
  setSelectionBox(group);

  return group;
}

export function setRelativePositions(umlGroup) {
  const sections = umlGroup.querySelectorAll(":scope > g");
  let sec_y = 0;

  sections.forEach((section) => {
    let starting_y = sec_y;
    section.setAttribute("x", 0);
    section.setAttribute("y", 0);
    section.setAttribute("transform", `translate(${0}, ${sec_y})`)
    
    let row_x = section.dataset.name === "title" ? Number(umlGroup.dataset.width) / 2 : Number(umlGroup.dataset.x_margin); 
    let row_y = Number(umlGroup.dataset.y_margin);
    const rows = section.querySelectorAll(":scope > g");

    rows.forEach((row) => {
      const lines = row.querySelectorAll(":scope > text > tspan");
      const row_height = getRowHeight(umlGroup, lines);
      
      let real_row_y = row_y + (row_height - Number(umlGroup.dataset.y_margin)) / 2
      row.setAttribute("x", 0);
      row.setAttribute("y", 0);
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

export function calculateYMargin(umlGroup) {
  const rows = umlGroup.querySelectorAll(":scope > g > g");
  let totalLinesHeight = 0;
  rows.forEach((row) => {
    const lines = row.querySelectorAll(":scope > text > tspan");
    totalLinesHeight += getLinesHeight(umlGroup, lines)
  })

  if (umlGroup.dataset.height < totalLinesHeight) {
    umlGroup.dataset.height = totalLinesHeight;
    return 0;
  }

  const totalPaddings = rows.length + 1;
  return (Number(umlGroup.dataset.height) - Number(totalLinesHeight)) / totalPaddings; 
}

export function getLinesHeight(umlGroup, lines) {
  return (lines.length - 1) * Number(umlGroup.dataset.baseline_skip) + Number(umlGroup.dataset.font_size);
}

export function getRowHeight(umlGroup, lines) {
  return (lines.length - 1) *
   Number(umlGroup.dataset.baseline_skip) +
    Number(umlGroup.dataset.font_size) +
     Number(umlGroup.dataset.y_margin);
}