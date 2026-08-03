class DOMMatrixStub {
  constructor(_values?: number[]) {}
}

Object.assign(globalThis, {
  DOMMatrix: globalThis.DOMMatrix ?? DOMMatrixStub,
  ImageData: globalThis.ImageData ?? class ImageDataStub {},
  Path2D: globalThis.Path2D ?? class Path2DStub {},
});
