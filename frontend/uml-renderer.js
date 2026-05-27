import { createSvgElement, latexColorToCss, parsePosition, svgYFromBottom } from "./utils.js";

export function createTextRow(row, objectConfig) {
  const rowPosition = parsePosition(row.position);
  const fontSize = Number(objectConfig.font_size);
  const text = createSvgElement("text", {
    x: rowPosition.x,
    y: svgYFromBottom(rowPosition.y),
    fill: latexColorToCss(row.text_color || "black"),
    "font-size": fontSize,
    "font-family": "Arial, Helvetica, sans-serif",
    "dominant-baseline": "middle",
    "text-anchor": row.anchor === "center" ? "middle" : "start"
  });
  const lines = row.lines;
  const baselineSkip = Number(objectConfig.baseline_skip);
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

export function createSection(section, objectConfig) {
  const sectionPosition = parsePosition(section.position);
  const sectionHeight = Number(section.height || 0);
  const sectionConfig = section.config || {};

  const group = createSvgElement("g", {
    class: `uml-section uml-section-${section.name || "unnamed"}`
  });

  group.appendChild(createSvgElement("rect", {
    x: sectionPosition.x,
    y: svgYFromBottom(sectionPosition.y + sectionHeight),
    width: objectConfig.width,
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

export function createUmlObject(objectConfig) {
  const nestedConfig = typeof objectConfig.config === "object"
    ? objectConfig.config
    : {};
  objectConfig = {
    ...nestedConfig,
    ...objectConfig
  };
  delete objectConfig.config;

  const x = Number(objectConfig.x);
  const y = Number(objectConfig.y);
  const width = Number(objectConfig.width);
  const height = Number(objectConfig.height);
  const scale = Number(objectConfig.scale || 1);
  const group = createSvgElement("g", {
    class: "canvas-shape uml-object",
    tabindex: "0"
  });

  group.dataset.id = objectConfig.id;
  group.dataset.name = objectConfig.name;
  group.dataset.x = x;
  group.dataset.y = y;
  group.dataset.width = width * scale;
  group.dataset.height = height * scale;
  group.dataset.config = JSON.stringify(objectConfig);

  group.appendChild(createSvgElement("rect", {
    class: "selection-rect",
    x: x - 0.2,
    y: svgYFromBottom(y) + 0.2,
    width: Math.max(0, width + 0.4),
    height: Math.max(0, height + 0.4),
    fill: "none"
  }));

  (objectConfig.sections || []).forEach((section) => {
    group.appendChild(createSection(section, objectConfig, width));
  });

  return group;
}

export function checkUmlObjects(payload) {
  if (!Array.isArray(payload)) {
    throw new Error("Expected UML objects array from backend");
  }

  return payload;
}
