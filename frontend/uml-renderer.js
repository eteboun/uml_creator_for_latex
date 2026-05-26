import { createSvgElement, latexColorToCss, parsePosition, svgYFromBottom } from "./utils.js";

export function getSectionBounds(sections = []) {
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

export function createTextRow(row, objectConfig) {
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

export function createSection(section, objectConfig, objectWidth) {
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

export function createUmlObject(objectConfig, index) {
  const bounds = getSectionBounds(objectConfig.sections || []);
  const x = Number(objectConfig.x ?? bounds.x);
  const y = Number(objectConfig.y ?? bounds.y);
  const width = Number(objectConfig.width ?? bounds.width);
  const height = Number(objectConfig.height ?? bounds.height);
  const baseX = bounds.x;
  const baseY = bounds.y;
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

  return group;
}

export function normalizeUmlObjects(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.objects)) return payload.objects;
  if (Array.isArray(payload?.umlCFGs)) return payload.umlCFGs;
  if (payload && typeof payload === "object") return [payload];
  return [];
}
