
export class ImageReflection {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private source: HTMLImageElement | null;
  private noSupported: boolean;

  constructor() {
    this.noSupported = false;
    this.canvas = document.createElement("canvas");
    this.canvas.width = 100;
    this.canvas.height = 100;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.source = null;
    if (!this.ctx) {
      this.noSupported = true;
      console.warn('your browser not supported!');
    }
  }

  updateCanvasSize(container: HTMLDivElement) {
    this.canvas.width = (container.clientWidth - 8 * 2) * 2;
    this.canvas.height = (container.clientHeight - 8 * 2) * 2;
  }

  getCanvas() {
    return this.canvas;
  }

  load(image: HTMLImageElement) {
    if (image && !this.noSupported) {
      if (this.source) this.source.remove();
      this.source = image;
      this.ctx.drawImage(image, 0, 0);
      this.ctx.fillRect(0, 0, 100, 100);
    }
  }

  // render() {
  //   if (this.source) {
  //     this.ctx.drawImage(this.source, 0, 0);
  //     this.ctx.fillRect(0, 0, 100, 100);
  //   }
  // }

  destroy() {
    this.canvas.remove();
  }

}
