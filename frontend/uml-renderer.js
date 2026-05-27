import { createSvgElement, parseColor, svgYFromBottom } from "./utils.js";

export function createTextRow(row, section, objectConfig) {
  const text = createSvgElement("text", {
    x: row.position[0],
    y: section.height - row.position[1],
    fill: parseColor(section.config.text_color),
    "font-size": objectConfig.font_size,
    "font-family": "Arial, Helvetica, sans-serif",
    "dominant-baseline": "middle",
    "text-anchor": row.anchor === "center" ? "middle" : "start"
  });

  const firstDy = -((row.lines.length - 1) * objectConfig.baseline_skip) / 2;

  row.lines.forEach((line, index) => {
    const tspan = createSvgElement("tspan", {
      x: row.position[0],
      dy: index === 0 ? firstDy : objectConfig.baseline_skip
    });
    tspan.textContent = line;
    text.appendChild(tspan);
  });

  return text;
}

export function createSection(section, objectConfig) {

  const group = createSvgElement("g", {
    class: `uml-section uml-section-${section.name}`
  });

  group.appendChild(createSvgElement("rect", {
    x: section.position[0],
    y: objectConfig.height - (section.position[1] + section.height),
    width: objectConfig.width,
    height: section.height,
    fill: parseColor(section.config.background_color),
    stroke: "#000000",
    "stroke-width": "0.04"
  }));

  section.rows.forEach((row) => {
    group.appendChild(createTextRow(row, section, objectConfig));
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
    class: "canvas-shape uml-object",
    tabindex: "0"
  });

  group.dataset.id = objectConfig.id;
  group.dataset.name = objectConfig.name;
  group.dataset.x = objectConfig.x;
  group.dataset.y = objectConfig.y;
  group.dataset.width = objectConfig.width;
  group.dataset.height = objectConfig.height;

  group.appendChild(createSvgElement("rect", {
    class: "selection-rect",
    x: -0.2,
    y: 0.2,
    width: Math.max(0, objectConfig.width + 0.4),
    height: Math.max(0, objectConfig.height + 0.4),
    fill: "none"
  }));

  objectConfig.sections.forEach((section) => {
    group.appendChild(createSection(section, objectConfig));
  });

  return group;
}