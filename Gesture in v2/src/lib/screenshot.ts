import { getCanvasElement } from './canvasRegistry';

export function captureCanvasScreenshot(filenamePrefix = 'gesturein'): boolean {
  const target = getCanvasElement();
  if (!target) return false;
  try {
    const url = target.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenamePrefix}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (e) {
    console.error('Screenshot failed', e);
    return false;
  }
}
