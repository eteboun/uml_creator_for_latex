import { elements } from "../dom.js";
import {
  factor,
  createLines, getUmlObjectById, getSectionObjectById, getRowObjectById
} from "./uml-renderer.js";

export function calculateTotalLinesCount(umlGroup, wrapperThreshold) {
  let totalLinesCount = 0;
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  const sectionGroups = umlGroup.querySelectorAll(":scope > g");
  sectionGroups.forEach(sectionGroup => {
    const sectionObject = getSectionObjectById(umlObject, sectionGroup.dataset.id);
    const rowGroups = sectionGroup.querySelectorAll(":scope > g");
    rowGroups.forEach(rowGroup => {
      const rowObject = getRowObjectById(sectionObject, rowGroup.dataset.id);
      const lines = createLines(rowObject, wrapperThreshold);
      totalLinesCount += lines.length;
    })
  });
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
  return Math.max(Math.floor((width - xMargin * 2) /
           (fontSize * factor)), 1);
}

export function calculateNextMaxTotalLinesCount(height, baselineSkip) {
    return height / baselineSkip;
}

export function calculateLongestLineLength(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);

  let longestSeqLen = 0;
  const sectionGroups = umlGroup.querySelectorAll(":scope > g");
  sectionGroups.forEach((sectionGroup) => {
    const sectionObject = getSectionObjectById(umlObject, sectionGroup.dataset.id);
    const rowGroups = sectionGroup.querySelectorAll(":scope > g");
    rowGroups.forEach((rowGroup) => {
      const rowObject = getRowObjectById(sectionObject, rowGroup.dataset.id);
      const content = rowObject.content;
      content.forEach((line) => {
        if (line.length > longestSeqLen) {
          longestSeqLen = line.length;
        }
      });
    });
  });
  return longestSeqLen;
}