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

export function calculateCharWidthFactor(fontSize) {
  const sample = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("font-size", fontSize);
  text.setAttribute("font-family", "monospace");
  text.setAttribute("visibility", "hidden");
  text.textContent = sample;

  elements.canvasSvg.appendChild(text);
  const width = text.getComputedTextLength();
  const factor = width / (fontSize * sample.length);
  text.remove();

  return factor;
}

export function calculateWrapperThreshold(width, fontSize, xMargin) {
  return Math.floor((width - xMargin * 2) /
           (fontSize * factor));
}

export function calculateNextMaxTotalLinesCount(height, baselineSkip) {
    return height / baselineSkip;
}