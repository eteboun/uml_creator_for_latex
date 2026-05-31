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

      const firstDy = -((lines.length - 1) * Number(umlGroup.dataset.baseline_skip)) / 2;
      lines.forEach((line, index) => {
        let dy = index === 0 ? firstDy : Number(umlGroup.dataset.baseline_skip);
        line.setAttribute("dy", dy);
        line.setAttribute("x", 0);
      });
      
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

export function setTextFontSize(umlGroup) {
  const texts = umlGroup.querySelectorAll(":scope > g > g > text");
  texts.forEach((text) => {
    text.setAttribute("font-size", umlGroup.dataset.font_size);
  })
}

export function setBoundaryWidth(umlGroup) {
  const x_margin = Number(umlGroup.dataset.x_margin);
  const rows = umlGroup.querySelectorAll(":scope > g > g");
  let longestSeqLen = 0;
  rows.forEach((row) => {
    const rowObj = getRowById(row.dataset.id);
    const content = rowObj.content;
    
    content.forEach((line) => {      
      if (line.length > longestSeqLen) {
        longestSeqLen = line.length;
      }
    })
  })

  const font_size = Number(umlGroup.dataset.font_size);
  const textWidth = longestSeqLen * font_size * factor;
  const boundaryWidth = textWidth + x_margin * 2;
  umlGroup.dataset.boundaryWidth = boundaryWidth;
}

export function setBoundaryFontSize(umlGroup) {
  const x_margin = Number(umlGroup.dataset.x_margin);
  const rows = umlGroup.querySelectorAll(":scope > g > g");
  let longestSeqLen = 0;
  rows.forEach((row) => {
    const rowObj = getRowById(row.dataset.id);
    const content = rowObj.content;
    
    content.forEach((line) => {      
      if (line.length > longestSeqLen) {
        longestSeqLen = line.length;
      }
    })
  })

  const width = Number(umlGroup.dataset.width);
  const boundaryFontSize = (width - x_margin * 2) / (longestSeqLen * factor);
  umlGroup.dataset.boundaryFontSize = boundaryFontSize;
}

export function setIsOutOfBoundaryFontSize(umlGroup) {
  umlGroup.dataset.isOutOfBoundaryFontSize = Number(umlGroup.dataset.font_size) > Number(umlGroup.dataset.boundaryFontSize);
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

export function setTotalLinesCount(umlGroup) {
  const lines = umlGroup.querySelectorAll(":scope > g > g > text > tspan");
  umlGroup.dataset.totalLinesCount = lines.length;
}

export function setIsOutOfBoundaryXMargin(umlGroup) {
  umlGroup.dataset.isOutOfBoundaryXMargin = Number(umlGroup.dataset.x_margin) > Number(umlGroup.dataset.boundaryXMargin);
}

export function setBoundaryXMargin(umlGroup) {

  const rows = umlGroup.querySelectorAll(":scope > g > g");
  let longestSeqLen = 0;
  rows.forEach((row) => {
    const rowObj = getRowById(row.dataset.id);
    const content = rowObj.content;
    
    content.forEach((line) => {      
      if (line.length > longestSeqLen) {
        longestSeqLen = line.length;
      }
    })
  })

  const width = Number(umlGroup.dataset.width);
  const font_size = Number(umlGroup.dataset.font_size);
  const xMargin = (width - longestSeqLen * font_size * factor) / 2;
  umlGroup.dataset.boundaryXMargin = xMargin;
}