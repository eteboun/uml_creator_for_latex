import { canvasSize, svgNS } from "./config.js";
import { elements } from "./dom.js";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function stagePoint(event) {
  const rect = elements.stage.getBoundingClientRect();
  const svgX = ((event.clientX - rect.left) / rect.width) * canvasSize.width;
  const svgY = ((event.clientY - rect.top) / rect.height) * canvasSize.height;

  return {
    x: svgX,
    y: canvasSize.height - svgY
  };
}

export function svgYFromBottom(y) {
  return canvasSize.height - y;
}

export function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS(svgNS, tagName);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

export function parsePosition(position, fallbackX = 0, fallbackY = 0) {
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

export function latexColorToCss(color) {
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
