/// <reference types="node" />

export interface CanvasRenderingContext2DStub {
  canvas: CanvasStub;
  save(): void;
  restore(): void;
  scale(x: number, y: number): void;
  rotate(angle: number): void;
  translate(x: number, y: number): void;
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  clearRect(x: number, y: number, width: number, height: number): void;
  beginPath(): void;
  closePath(): void;
  rect(x: number, y: number, width: number, height: number): void;
  clip(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  drawImage(...args: any[]): void;
  fill(): void;
  stroke(): void;
  fillRect(x: number, y: number, width: number, height: number): void;
  strokeRect(x: number, y: number, width: number, height: number): void;
  fillText(text: string, x: number, y: number): void;
  strokeText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number };
  putImageData(data: ImageData, x: number, y: number): void;
}

export interface CanvasStub {
  width: number;
  height: number;
  getContext(type: "2d"): CanvasRenderingContext2DStub;
  toBuffer(): Buffer;
}

export declare function createCanvas(width?: number, height?: number): CanvasStub;

export declare class DOMMatrix {
  constructor(init?: string | number[] | DOMMatrix);
  multiplySelf(other?: DOMMatrix): DOMMatrix;
  translateSelf(tx?: number, ty?: number, tz?: number): DOMMatrix;
  scaleSelf(scaleX?: number, scaleY?: number, scaleZ?: number): DOMMatrix;
  rotateSelf(rotX?: number, rotY?: number, rotZ?: number): DOMMatrix;
  invertSelf(): DOMMatrix;
  toFloat32Array(): Float32Array;
}

export declare class Path2D {
  constructor(path?: string | Path2D);
  addPath(path: Path2D): void;
}

export declare class ImageData {
  constructor(data: Uint8ClampedArray | number, width?: number, height?: number);
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

