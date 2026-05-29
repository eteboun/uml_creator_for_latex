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

export function nDigits(value, n = 3) {
  return Number(value).toFixed(n);
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

export function depthUntil(text, pos) {
  let depth = 0;

  for (const char of text.slice(0, pos)) {
    if (char === "<") {
      depth += 1;
    } else if (char === ">") {
      depth = Math.max(0, depth - 1);
    }
  }

  return depth;
}

export function textWrapper(text, threshold = 50) {
  const charScores = {
    " ": 30,
    ":": 25,
    ",": 22,
    "(": 18,
    "<": 12,
    "{": 8
  };

  const newText = [];

  let start = 0;

  while (start < text.length) {
    let genericDepth = depthUntil(text, start);

    let bestScore = -Infinity;
    let bestIdx = -1;

    const end = Math.min(start + threshold, text.length);

    if (end === text.length) {
      newText.push(text.slice(start).trim());
      break;
    }

    for (let i = start; i < end; i++) {
      const char = text[i];

      if (char in charScores) {
        const score =
          charScores[char] -
          (end - (i + 1)) * 2 -
          genericDepth * 3;

        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      if (char === "<") {
        genericDepth += 1;
      } else if (char === ">") {
        genericDepth = Math.max(0, genericDepth - 1);
      }
    }

    if (bestIdx === -1) {
      bestIdx = end - 1;
    }

    const piece = text.slice(start, bestIdx + 1);
    newText.push(piece.trim());

    start = bestIdx + 1;

    while (start < text.length && text[start] === " ") {
      start += 1;
    }
  }

  return newText;
}
