const noop = () => {};

class StubDOMMatrix {
  constructor(init = [1, 0, 0, 1, 0, 0]) {
    this.value = Array.isArray(init) ? init.slice(0, 6) : [1, 0, 0, 1, 0, 0];
  }
  multiplySelf() {
    return this;
  }
  translateSelf() {
    return this;
  }
  scaleSelf() {
    return this;
  }
  rotateSelf() {
    return this;
  }
  invertSelf() {
    return this;
  }
  toFloat32Array() {
    return new Float32Array(this.value);
  }
}

class StubImageData {
  constructor(data, width, height) {
    if (typeof data === "number") {
      this.width = data;
      this.height = width ?? 0;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      this.data = data instanceof Uint8ClampedArray ? data : new Uint8ClampedArray(data);
      this.width = width ?? 0;
      this.height = height ?? 0;
    }
  }
}

class StubPath2D {
  constructor() {}
  addPath() {}
}

function createCanvas(width = 0, height = 0) {
  const canvas = {
    width,
    height,
    getContext(type) {
      if (type !== "2d") {
        throw new Error("Stub canvas only supports 2d contexts");
      }
      const ctx = {
        canvas,
        save: noop,
        restore: noop,
        scale: noop,
        rotate: noop,
        translate: noop,
        transform: noop,
        setTransform: noop,
        clearRect: noop,
        beginPath: noop,
        closePath: noop,
        rect: noop,
        clip: noop,
        moveTo: noop,
        lineTo: noop,
        bezierCurveTo: noop,
        quadraticCurveTo: noop,
        drawImage: noop,
        fill: noop,
        stroke: noop,
        fillRect: noop,
        strokeRect: noop,
        fillText: noop,
        strokeText: noop,
        measureText: (text = "") => ({ width: text.length }),
        putImageData: noop,
        getImageData() {
          throw new Error("getImageData is not implemented in stub canvas");
        },
      };
      return ctx;
    },
    toBuffer() {
      return Buffer.alloc(this.width * this.height * 4);
    },
  };
  return canvas;
}

module.exports = {
  createCanvas,
  DOMMatrix: StubDOMMatrix,
  ImageData: globalThis.ImageData ?? StubImageData,
  Path2D: globalThis.Path2D ?? StubPath2D,
};

