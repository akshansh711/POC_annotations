"use client";
import { useEffect, useRef, useState } from "react";
import { PDFDocument, PDFName, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/webpack.mjs";

interface Annotation {
  page: number;
  x: number;
  y: number;
  text: string;
}

interface PendingAnnotation {
  page: number;
  x: number;
  y: number;
}

export default function PdfAnnotator({ pdfUrl }: { pdfUrl: string }) {
  const [pdfPages, setPdfPages] = useState<HTMLCanvasElement[]>([]);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const [pendingAnnotation, setPendingAnnotation] = useState<PendingAnnotation | null>(null);
  const [annotationText, setAnnotationText] = useState("");

  const [activeTooltip, setActiveTooltip] = useState<{
    ann: Annotation;
    px: number;
    py: number;
  } | null>(null);

  const [hoverInsideTooltip, setHoverInsideTooltip] = useState(false);
  const [hoverOnDot, setHoverOnDot] = useState(false);

  useEffect(() => {
    const loadPdf = async () => {
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      const arrayBuffer = await fetch(pdfUrl).then(r => r.arrayBuffer());
      setPdfBytes(new Uint8Array(arrayBuffer));

      const pages: HTMLCanvasElement[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d")!, canvas, viewport }).promise;
        pages.push(canvas);
      }
      setPdfPages(pages);
    };
    loadPdf();
  }, [pdfUrl]);

  const handleCanvasClick = (page: number, e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPendingAnnotation({
      page,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const saveAnnotation = () => {
    if (!pendingAnnotation || !annotationText.trim()) return;
    const newAnn = { ...pendingAnnotation, text: annotationText.trim() };
    setAnnotations([...annotations, newAnn]);
    setPendingAnnotation(null);
    setAnnotationText("");
    redrawAnnotations(pendingAnnotation.page);
  };

  const redrawAnnotations = (pageNum: number, list?: Annotation[]) => {
    const canvas = canvasRefs.current[pageNum - 1];
    if (!canvas) return;
    const src = pdfPages[pageNum - 1];
    if (!src) return;

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, 0);

    (list || annotations)
      .filter(a => a.page === pageNum)
      .forEach(a => {
        ctx.fillStyle = "#FF5722";
        ctx.beginPath();
        ctx.arc(a.x, a.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
  };

  useEffect(() => {
    pdfPages.forEach((_, idx) => redrawAnnotations(idx + 1));
  }, [annotations, pdfPages]);

  const handleHoverDot = (ann: Annotation) => {
    const canvas = canvasRefs.current[ann.page - 1];
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setActiveTooltip({
      ann,
      px: rect.left + ann.x + 15,
      py: rect.top + ann.y + 15,
    });
  };

  const hideTooltip = () => {
    setTimeout(() => {
      if (!hoverInsideTooltip && !hoverOnDot) {
        setActiveTooltip(null);
        pdfPages.forEach((_, idx) => redrawAnnotations(idx + 1)); // restore dots
      }
    }, 60);
  };

  const handleSavePdf = async () => {
  if (!pdfBytes) return;

  const pdfDoc = await PDFDocument.load(pdfBytes);

  annotations.forEach(a => {
    const page = pdfDoc.getPage(a.page - 1);
    const canvas = canvasRefs.current[a.page - 1];
    if (!canvas) return;

    const xPdf = (a.x / canvas.width) * page.getWidth();
    const yPdf = page.getHeight() - (a.y / canvas.height) * page.getHeight();

    // Create Text annot (comment icon)
    const annot = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Text',
      Rect: [xPdf - 10, yPdf - 10, xPdf + 10, yPdf + 10], // clickable area
      Contents: a.text,          // comment text
      Name: 'Comment',           // icon style: "Comment", "Note", "Help", etc.
      Open: false,               // popup closed initially
      T: "Annotation",           // title (who wrote it)
      C: [1, 0.6, 0],            // icon color (optional)
    });

    const annots = page.node.Annots();
    if (annots) {
      annots.push(annot);
    } else {
      page.node.set(
        PDFName.of("Annots"),
        pdfDoc.context.obj([annot])
      );
    }
  });

  const saved = await pdfDoc.save();
  const clean = new Uint8Array(saved);
  const blob = new Blob([clean], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "annotated.pdf";
  a.click();
};

  return (
    <div style={{ padding: 20 }}>
      <h2>PDF Annotator</h2>

      <div style={{ height: "70vh", overflowY: "scroll", border: "1px solid #ccc", padding: 10 }}>
        {pdfPages.map((src, idx) => (
          <canvas
            key={idx}
            ref={el => {
              canvasRefs.current[idx] = el;
              if (el) {
                el.width = src.width;
                el.height = src.height;
                el.getContext("2d")?.drawImage(src, 0, 0);
              }
            }}
            onClick={e => handleCanvasClick(idx + 1, e)}
            onMouseMove={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mx = e.clientX - rect.left;
              const my = e.clientY - rect.top;

              const ann = annotations.find(a =>
                a.page === idx + 1 && (mx - a.x) ** 2 + (my - a.y) ** 2 < 36
              );

              if (ann) {
                setHoverOnDot(true);
                if (!activeTooltip || activeTooltip.ann !== ann) {
                  handleHoverDot(ann);
                }
              } else {
                setHoverOnDot(false);
                hideTooltip();
              }
            }}
            onMouseLeave={() => {
              setHoverOnDot(false);
              hideTooltip();
            }}
            style={{ cursor: "pointer", display: "block", marginBottom: 20 }}
          />
        ))}
      </div>

      {activeTooltip && (
        <div
          style={{
            position: "fixed",
            top: activeTooltip.py,
            left: activeTooltip.px,
            background: "#fff9c4",
            border: "2px solid #f4c32b",
            borderRadius: 8,
            padding: 10,
            maxWidth: 250,
            maxHeight: 200,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            zIndex: 2000
          }}
          onMouseEnter={() => setHoverInsideTooltip(true)}
          onMouseLeave={() => {
            setHoverInsideTooltip(false);
            hideTooltip();
          }}
        >
          <b>Comment:</b>
          <br />
          {activeTooltip.ann.text}
        </div>
      )}

      {pendingAnnotation && (
        <>
          <div
            onClick={() => setPendingAnnotation(null)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.4)", zIndex: 999
            }}
          />
          <div
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              background: "white", padding: 20,
              borderRadius: 8, zIndex: 1000, width: 400
            }}
          >
            <h3>Add Annotation</h3>
            <textarea
              value={annotationText}
              onChange={e => setAnnotationText(e.target.value)}
              style={{ width: "100%", height: 120 }}
            />
            <button onClick={() => setPendingAnnotation(null)}>Cancel</button>
            <button onClick={saveAnnotation} style={{ marginLeft: 10 }}>Save</button>
          </div>
        </>
      )}

      <button onClick={handleSavePdf} style={{ marginTop: 20 }}>
        Download PDF with Annotations
      </button>
    </div>
  );
}