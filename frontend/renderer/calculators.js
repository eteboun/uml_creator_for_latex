import { elements } from "../dom.js";
import { factor, getRowById,
    createLines
 } from "./uml-renderer.js";

export function calculateTotalLinesCount(rows, wrapper_threshold) {
  let totalLinesCount = 0;
  rows.forEach((row) => {
    const rowObj = getRowById(row.dataset.id);
    const lines = createLines(rowObj.content, wrapper_threshold);
    totalLinesCount += lines.length;
  })
  return totalLinesCount;
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

export function calculateWrapperThreshold(width, font_size, x_margin) {
  return Math.floor((width - x_margin * 2) /
           (font_size * factor));
}

export function calculateNextMaxTotalLinesCount(height, baseline_skip) {
    return height / baseline_skip;
}