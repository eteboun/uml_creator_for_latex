import {calculateLongestLineLength, calculateWrapperThreshold} from "./calculators.js";
import {
  factor,
  getRowHeight, getSectionObjectById,
  getTotalLinesHeight,
  getTotalPaddings,
  getUmlObjectById
} from "./uml-renderer.js";

export function setRelativePositions(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  const sectionGroups = umlGroup.querySelectorAll(":scope > g");
  let secY = 0;

  sectionGroups.forEach((sectionGroup) => {
    const sectionObject = getSectionObjectById(umlObject, sectionGroup.dataset.id);

    let startingY = secY;
    sectionGroup.setAttribute("transform", `translate(${0}, ${secY})`);
    
    let rowX = sectionObject.name === "title" ? umlObject.width / 2 : umlObject.xMargin;
    let rowY = umlObject.yMargin;
    const rowGroups = sectionGroup.querySelectorAll(":scope > g");

    rowGroups.forEach((rowGroup) => {
  
      const lines = rowGroup.querySelectorAll(":scope > text > tspan");
      const rowHeight = getRowHeight(umlGroup, lines);

      const firstDy = -((lines.length - 1) * umlObject.baselineSkip) / 2;
      lines.forEach((line, index) => {
        let dy = index === 0 ? firstDy : umlObject.baselineSkip;
        line.setAttribute("dy", dy);
        line.setAttribute("x", 0);
      });
      
      let realRowY = rowY + (rowHeight - umlObject.yMargin) / 2;
      rowGroup.setAttribute("transform", `translate(${rowX}, ${realRowY})`);

      secY += rowHeight;
      rowY += rowHeight;
    })

    rowY += umlObject.yMargin;
    secY += umlObject.yMargin;
    const sectionHeight = secY - startingY;

    let sectionRect = sectionGroup.querySelector("rect");
    sectionRect.setAttribute("height", sectionHeight);
    sectionRect.setAttribute("width", umlObject.width);
  })
}

export function setYMargin(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  let totalLinesHeight = getTotalLinesHeight(umlGroup);
  let totalPaddings = getTotalPaddings(umlGroup);
  umlObject.yMargin = (umlObject.height - totalLinesHeight) / totalPaddings;
}

export function setTextFontSize(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  const texts = umlGroup.querySelectorAll(":scope > g > g > text");
  texts.forEach((text) => {
    text.setAttribute("font-size", umlObject.fontSize);
  })
}

export function setBoundaryWidth(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  const longestSeqLen = calculateLongestLineLength(umlGroup);

  const textWidth = longestSeqLen * umlObject.fontSize * factor;
  umlObject.boundaryWidth = textWidth + umlObject.xMargin * 2;
}

export function setBoundaryFontSize(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  const longestSeqLen = calculateLongestLineLength(umlGroup);

  umlObject.boundaryFontSize = (umlObject.width - umlObject.xMargin * 2) / (longestSeqLen * factor);
}

export function setIsOutOfBoundaryFontSize(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  umlObject.isOutOfBoundaryFontSize = umlObject.fontSize > umlObject.boundaryFontSize;
}

export function setWrapperThreshold(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  umlObject.wrapperThreshold = calculateWrapperThreshold(umlObject.width, umlObject.fontSize, umlObject.xMargin);
}

export function setMaxTotalLinesCount(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  umlObject.maxTotalLinesCount = umlObject.height / umlObject.baselineSkip;
}

export function setIsOutOfBoundaryWidth(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  umlObject.isOutOfBoundaryWidth = umlObject.width > umlObject.boundaryWidth;
}

export function setTotalLinesCount(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  const lines = umlGroup.querySelectorAll(":scope > g > g > text > tspan");
  umlObject.totalLinesCount = lines.length;
}

export function setIsOutOfBoundaryXMargin(umlGroup) {
  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  umlObject.isOutOfBoundaryXMargin = umlObject.xMargin > umlObject.boundaryXMargin;
}

export function setBoundaryXMargin(umlGroup) {

  const umlObject = getUmlObjectById(umlGroup.dataset.id);
  const longestSeqLen = calculateLongestLineLength(umlGroup);

  umlObject.boundaryXMargin = (umlObject.width - longestSeqLen * umlObject.fontSize * factor) / 2;
}