let canvasEl: HTMLCanvasElement | null = null;

export function setCanvasElement(el: HTMLCanvasElement) {
  canvasEl = el;
}

export function getCanvasElement(): HTMLCanvasElement | null {
  return canvasEl;
}
