import {
  Alert,
  Box,
  Button,
} from "@canva/app-ui-kit";
import "@canva/app-ui-kit/styles.css";
import * as styles from "./index.css";
import { useEffect, useRef, useState } from "react";
import { selection } from "@canva/design";
import { getTemporaryUrl, TemporaryUrlForImage } from "@canva/asset";
import type { RenderExportFunction } from "./render";
import { Render } from "./render";

export function App() {
  const [selectMoreElement, setSelectMoreElement] = useState(false);
  const [imageRef, setImageRef] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageSource, setImageSource] = useState<HTMLImageElement>(new Image());
  const renderRef = useRef<RenderExportFunction>({
    addToDesign(): void {},
    setOffset(): void {},
    setOpacity(): void {},
    setPosition(): void {},
  });

  useEffect(() => {
    return selection.registerOnChange({
      scope: "image",
      async onChange(event) {
        const draft = await event.read();
        if (draft.contents.length > 1) {
          setSelectMoreElement(true);
          setImageRef("");
        } else {
          setSelectMoreElement(false);
          setImageRef(((draft?.contents || [])[0] || {}).ref);
        }
      },
    });
  }, []);

  const loadImageResource = async () => {
    if (imageRef) {
      setLoading(true);
      const imageResult: TemporaryUrlForImage = await getTemporaryUrl({
        type: "image",
        ref: imageRef,
      });
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        setEditMode(true);
        setLoading(false);
        setImageSource(image);
      };
      image.onerror = () => {
        setLoading(false);
      };
      image.src = imageResult.url;
    } else {
      setSelectMoreElement(true);
      setLoading(false);
    }
  };

  const exitEditMode = () => {
    setEditMode(false);
  };

  if (editMode) {
    return (
      <Box className={styles.rootWrapper}>
        <Render ref={renderRef} source={imageSource} />
        <Button
          stretch={true}
          onClick={() => renderRef.current?.addToDesign()}
          variant="primary"
        >
          Add to design
        </Button>
        <Button stretch={true} onClick={exitEditMode} variant="secondary">
          Go back
        </Button>
      </Box>
    );
  }

  return (
    <Box className={styles.rootWrapper}>
      <Box className={styles.selectTipContainer}>
        {selectMoreElement ? (
          <Alert tone="critical">
            <strong>Multiple elements selected.</strong>Please select only one
            element at a time to create a reflection.
          </Alert>
        ) : (
          <Alert tone="neutral">Select an element from your design.</Alert>
        )}
      </Box>
      <Button
        stretch={true}
        onClick={loadImageResource}
        variant="primary"
        disabled={!imageRef}
        loading={loading}
      >
        Create reflection
      </Button>
    </Box>
  );
}
