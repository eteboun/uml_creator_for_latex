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
    y: svgY
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

export function parseColor(color) {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}
