import { elements } from "../dom.js";
import { calculateWrapperThreshold } from "./calculators.js";
import { factor, getTotalLinesHeight,
    getRowHeight, getTotalPaddings,
    getRowById
 } from "./uml-renderer.js";
 import { createSvgElement } from "../utils.js";

export function setRelativePositions(umlGroup) {
  const sections = umlGroup.querySelectorAll(":scope > g");
  let sec_y = 0;

  sections.forEach((section) => {
    let starting_y = sec_y;
    section.setAttribute("transform", `translate(${0}, ${sec_y})`);
    
    let row_x = section.dataset.name === "title" ? Number(umlGroup.dataset.width) / 2 : Number(umlGroup.dataset.x_margin); 
    let row_y = Number(umlGroup.dataset.y_margin);
    const rows = section.querySelectorAll(":scope > g");

    rows.forEach((row) => {
      const lines = row.querySelectorAll(":scope > text > tspan");
      const row_height = getRowHeight(umlGroup, lines);
      
      let real_row_y = row_y + (row_height - Number(umlGroup.dataset.y_margin)) / 2;
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

export function setYMargin(umlGroup) {
  let totalLinesHeight = getTotalLinesHeight(umlGroup);
  let totalPaddings = getTotalPaddings(umlGroup);
  umlGroup.dataset.y_margin = (Number(umlGroup.dataset.height) - totalLinesHeight) / totalPaddings;
}

export function setFontSize(umlGroup, font_size) {
  umlGroup.dataset.font_size = font_size;

  const texts = umlGroup.querySelectorAll(":scope > g > g > text");
  texts.forEach((text) => {
    text.setAttribute("font-size", umlGroup.dataset.font_size);
  })
}

export function setBaselineSkip(umlGroup) {
  umlGroup.dataset.baseline_skip = Number(umlGroup.dataset.font_size) * 1.2;

  const rows = umlGroup.querySelectorAll(":scope > g > g");
  rows.forEach((row) => {
    const lines = row.querySelectorAll(":scope > text > tspan");
    const firstDy = -((lines.length - 1) * umlGroup.dataset.baseline_skip) / 2;

    lines.forEach((line, index) => {
      let dy = index === 0 ? firstDy : Number(umlGroup.dataset.baseline_skip);
      line.setAttribute("dy", dy);
  });
  })
}

export function setBoundaryWidth(umlGroup) {
  const x_margin = Number(umlGroup.dataset.x_margin);
  const rows = umlGroup.querySelectorAll(":scope > g > g");
  let longestSeqLen = 0;
  let longestSeq = "";
  rows.forEach((row) => {
    const rowObj = getRowById(row.dataset.id);
    const content = rowObj.content;
    
    content.forEach((line) => {      
      if (line.length > longestSeqLen) {
        longestSeq = line;
        longestSeqLen = line.length;
      }
    })
  })

  const tempText = createSvgElement("text", {
    "font-size": umlGroup.dataset.font_size,
    "font-family": "monospace",
    visibility: "hidden"
  });
  const tempTSpan = createSvgElement("tspan", {});
  tempTSpan.textContent = longestSeq;
  tempText.appendChild(tempTSpan);

  elements.canvasSvg.appendChild(tempText);
  const textWidth = tempTSpan.getComputedTextLength();
  const boundaryWidth = textWidth + x_margin * 2;
  tempText.remove();

  umlGroup.dataset.boundaryWidth = boundaryWidth;
}

export function setMinHeight(umlGroup) {
  let minHeight = getTotalLinesHeight(umlGroup);
  umlGroup.dataset.minHeight = minHeight;
  umlGroup.dataset.height = Math.max(Number(umlGroup.dataset.height), minHeight);
}

export function setMaxFontSize(umlGroup) {
  const height = Number(umlGroup.dataset.height);
  const width = Number(umlGroup.dataset.width);
  const x_margin = Number(umlGroup.dataset.x_margin);

  const lines = umlGroup.querySelectorAll(":scope > g > g > text > tspan");
  const rows = umlGroup.querySelectorAll(":scope > g > g");

  let maxFontX = Infinity;
  lines.forEach((line) => {
    let currentMax = line.getComputedTextLength() /
                  (line.textContent.length * factor);

    if (currentMax < maxFontX) maxFontX = currentMax;
  })

  let maxFontY = (height / (lines.length * 1.2 - rows.length * 0.2));

  umlGroup.dataset.maxFontSize = Math.min(maxFontX, maxFontY);
}

export function setMaxXMargin(umlGroup) {
  let maxMargin = Infinity;
  const width = Number(umlGroup.dataset.width);
  const font_size = Number(umlGroup.dataset.font_size);

  const lines = umlGroup.querySelectorAll(":scope > g > g > text > tspan");
  lines.forEach((line) => {
    let currentMax = (width - line.getComputedTextLength()) / 2;
    
    if (currentMax < maxMargin) maxMargin = currentMax;
  })

  umlGroup.dataset.maxXMargin = maxMargin;
}

export function setWrapperThreshold(umlGroup) {
  umlGroup.dataset.wrapper_threshold = calculateWrapperThreshold(Number(umlGroup.dataset.width), Number(umlGroup.dataset.font_size), Number(umlGroup.dataset.x_margin));
}

export function setMaxTotalLinesCount(umlGroup) {
  umlGroup.dataset.maxTotalLinesCount = Number(umlGroup.dataset.height) / Number(umlGroup.dataset.baseline_skip);
}

export function setIsOutOfBoundaryWidth(umlGroup) {
  umlGroup.dataset.isOutOfBoundaryWidth = Number(umlGroup.dataset.width) > Number(umlGroup.dataset.boundaryWidth);
}
