import { MutableRefObject, useEffect, useRef, useImperativeHandle, forwardRef, useState, useMemo } from "react";
import { addElementAtPoint } from "@canva/design";
import { FormField, SegmentedControl, Slider } from "@canva/app-ui-kit";
import * as styles from "./index.css";

export interface RenderExportFunction {
  setOpacity: (opacity: number) => void;
  setOffset: (opacity: number) => void;
  setPosition: (position: FlipPosition) => void;
  addToDesign: () => void;
}

interface RenderProps {
  source?: HTMLImageElement;
  ref?: MutableRefObject<RenderExportFunction>;
}

export enum FlipPosition {
  Left = 'left',
  Right = 'right',
  Below = 'below',
  Above = 'above',
}

const TransformSetting = {
  [FlipPosition.Below]: [1, -1],
  [FlipPosition.Above]: [1, -1],
  [FlipPosition.Left]: [-1, 1],
  [FlipPosition.Right]: [-1, 1],
}

export const Render = forwardRef(({ source }: RenderProps, ref) => {
  const renderTarget = useRef(null);
  let ctx: CanvasRenderingContext2D | null = null;

  const [options, setOptions] = useState({
    opacity: 50,
    offset: 50,
    flip: TransformSetting[FlipPosition.Below],
    position: FlipPosition.Below
  });

  const positionList = Object.keys(FlipPosition).map((label) => ({
    label,
    value: FlipPosition[label],
  }));

  const [gradientOptions, setGradientOptions]: [Record<FlipPosition, [number,number,number,number]>, (data:Record<FlipPosition, [number,number,number,number]>) => void] = useState({
    above: [0, 0, 0, 0],
    below: [0, 0, 0, 0],
    left: [0, 0, 0, 0],
    right: [0, 0, 0, 0]
  });

  const updateCanvasSize = (canvas: HTMLCanvasElement) => {
    const parentNode = canvas.parentElement as HTMLDivElement;
    const width = parentNode.clientWidth * 2,
      height = parentNode.clientHeight * 2;
    canvas.width = width;
    canvas.height = height;
    Object.assign(canvas.style, {
      width: width + "px",
      height: height + "px",
      transformOrigin: "top left",
      transform: "scale(0.5)",
    });
    setGradientOptions({
      [FlipPosition.Below]: [0, canvas.height, 0, 0],
      [FlipPosition.Above]: [0, 0, 0, canvas.height],
      [FlipPosition.Left]: [0, 0, canvas.width, 0],
      [FlipPosition.Right]: [canvas.width, 0, 0, 0],
    });
  };

  const drawImageWithTransform = (
    canvas: HTMLCanvasElement | OffscreenCanvas,
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    image: HTMLImageElement,
    horizontal = 1,
    vertically = 1,
  ) => {
    const imageRatio = image.width / image.height;
    const canvasRatio = canvas.width / canvas.height;
    let scale: number;
    if (imageRatio > canvasRatio) {
      scale = canvas.width / image.width;
    } else {
      scale = canvas.height / image.height;
    }
    ctx.globalAlpha = options.opacity / 100;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(horizontal, vertically);
    let drawOffsetX = -image.width / 2;
    let drawOffsetY = -image.height / 2;
    ctx.scale(scale, scale);
    ctx.drawImage(image, drawOffsetX, drawOffsetY, image.width, image.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  const addGradientToCanvas = (
    canvas: HTMLCanvasElement | OffscreenCanvas,
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    output = false,
    gradientGenerate?: () => CanvasGradient
  ) => {
    ctx.globalCompositeOperation = "destination-out";
    const gradient = (output && gradientGenerate) ? gradientGenerate() : ctx.createLinearGradient(...((gradientOptions[options.position] || [0, 0, canvas.width, 0]) as [number, number, number, number]));
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(options.offset / 100, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const outputHighResult = (canvas: HTMLCanvasElement, image: HTMLImageElement) => {
    const imageRatio = image.width / image.height;
    const canvasRatio = canvas.width / canvas.height;
    let scale: number;
    if (imageRatio > canvasRatio) {
      scale = canvas.width / image.width;
    } else {
      scale = canvas.height / image.height;
    }
    const tempCanvas = new OffscreenCanvas(canvas.width / scale, canvas.height / scale);
    const ctx = tempCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    drawImageWithTransform(tempCanvas, ctx, image, ...(options.flip || []));
    addGradientToCanvas(tempCanvas, ctx, true, () => {
      const args = JSON.parse(JSON.stringify(gradientOptions[options.position])) as [number, number, number, number];
      args.forEach((n, i) => {
        if (n) {
          args[i] = (i % 2) ? tempCanvas.width : tempCanvas.height;
        }
      })
      return ctx.createLinearGradient(...args);
    });
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = image.width;
    outputCanvas.height = image.height;
    const outputCtx = outputCanvas.getContext('2d') as CanvasRenderingContext2D;
    const drawOffsetX = (outputCanvas.width - tempCanvas.width) / 2;
    const drawOffsetY = (outputCanvas.height - tempCanvas.height) / 2
    outputCtx.drawImage(tempCanvas, drawOffsetX, drawOffsetY);
    return outputCanvas.toDataURL();
  }

  const clearDrawer = () => {
    if (ctx && renderTarget.current) {
      ctx.clearRect(
        0,
        0,
        (renderTarget.current as HTMLCanvasElement).width,
        (renderTarget.current as HTMLCanvasElement).height,
      );
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  const render = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
  ) => {
    clearDrawer();
    drawImageWithTransform(canvas, ctx, image, ...(options.flip || []));
    addGradientToCanvas(canvas, ctx);
  }

  useEffect(() => {
    if (renderTarget.current && !ctx) ctx = (renderTarget.current as HTMLCanvasElement).getContext('2d');
    if (renderTarget.current && ctx && source) render(renderTarget.current as HTMLCanvasElement, ctx, source);
  }, [options]);

  const setOpacity = (opacity: number) => {
    setOptions({ ...options, opacity });
  }

  const setOffset = (offset: number)  =>  {
    setOptions({ ...options, offset });
  }

  const setPosition = (position: FlipPosition)  =>  {
    setOptions({
      opacity: 50,
      offset: 50,
      flip: TransformSetting[position],
      position: position
    });
  }

  const addToDesign = () => {
    if (renderTarget.current && source) {
      const resource = outputHighResult(renderTarget.current, source);
      addElementAtPoint({
        type: 'image',
        altText: undefined,
        // top: 0,
        // left: 0,
        // width: source?.width,
        // height: source?.height,
        dataUrl: resource,
      }).then(r => {
        console.log(r);
      }).catch(e => {
        console.log(e);
      });
    }
    console.log("ready add to design");
  }

  useImperativeHandle(ref, () => ({
    addToDesign,
    setOffset,
    setPosition,
    setOpacity
  }));

  useEffect(() => {
    const canvas = renderTarget.current as never as HTMLCanvasElement;
    if (canvas) {
      updateCanvasSize(canvas);
      ctx = canvas.getContext("2d",) as CanvasRenderingContext2D;
      if (!ctx) console.log("browser not supported canvas!");
      if (source) render(canvas, ctx, source);
    }
  }, [renderTarget]);

  return (
    <div>
      <div className={styles.renderContainer}>
        <div>
          <canvas ref={renderTarget}></canvas>
        </div>
      </div>
      <FormField label="Position" description="" control={() => (
        <SegmentedControl
          options={positionList}
          defaultValue={FlipPosition.Below}
          value={options.position}
          onChange={setPosition}
        ></SegmentedControl>
      )}/>
      <FormField label="Offset" description="" control={() => (
        <Slider
          max={100}
          min={0}
          step={1}
          value={options.offset}
          onChange={setOffset}
        />
      )}/>
      <FormField label="Opacity" description="" control={() => (
        <Slider
          max={100}
          min={0}
          step={1}
          value={options.opacity}
          onChange={setOpacity}
        />
      )}/>
    </div>
  );
});
