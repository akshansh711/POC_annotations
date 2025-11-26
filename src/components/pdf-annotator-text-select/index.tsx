import React, {useState, useRef, useEffect} from 'react'
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/webpack.mjs";

function pdfTransformToCss(transform: number[], viewport: any) {
  // matrix: [a, b, c, d, e, f]
  const [a, b, c, d, e, f] = transform;

  const [vx, vy] = viewport.convertToViewportPoint(e, f);

  return {
    left: vx,
    top: vy,
    fontSize: Math.abs(d),        // text height
    height: Math.abs(d),
    width: Math.abs(a),           // width can be approximated using 'a'
  };
}

type Rect = { left: number; top: number; width: number; height: number };

type Annotation = {
  id: string;
  page: number;
  rects: Rect[]; // bounding rects relative to page container (CSS px)
  selectedText: string;
  dot: { x: number; y: number }; // CSS px relative to page container (where dot is placed — start of selection)
  note?: string; // saved note
};

function PdfAnnotatorTextSelect({pdfUrl}: {pdfUrl: string}) {

    const [pdfPages, setPdfPages] = useState<HTMLCanvasElement[]>([]);
  const pageContainersRef = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const textLayerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const [selectionPreview, setSelectionPreview] = useState<{
    page: number;
    rects: Rect[];
    selectedText: string;
    dot: { x: number; y: number };
  } | null>(null);

  const [openNoteFor, setOpenNoteFor] = useState<Annotation | null>(null);
  const [noteText, setNoteText] = useState("");

  // Load PDF and render pages + text layers
  useEffect(() => {
    const load = async () => {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const buf = await fetch(pdfUrl).then((r) => r.arrayBuffer());
      setPdfBytes(new Uint8Array(buf));

      const canvases: HTMLCanvasElement[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, canvas, viewport }).promise;
        canvases.push(canvas);
      }

      setPdfPages(canvases);
    };

    load();
  }, [pdfUrl]);

  // When a page mounts, draw the canvas image and create the text layer
  useEffect(() => {
    if (pdfPages.length === 0) return;

    (async () => {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;

      for (let i = 0; i < pdfPages.length; i++) {
        const pageNum = i + 1;
        const page = await pdf.getPage(pageNum);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        // text layer container
      

        const textContent = await page.getTextContent();

        // Use pdfjs renderTextLayer if available (most builds)
        // If your build doesn't expose renderTextLayer, this may fail and you'll need to fallback to manual spans.
     const textLayerDiv = textLayerRefs.current[i];
       if (!textLayerDiv) continue;

        // Clear previous
        textLayerDiv.innerHTML = "";
textLayerDiv.innerHTML = "";
textLayerDiv.style.position = "absolute";
textLayerDiv.style.left = "0";
textLayerDiv.style.top = "0";
textLayerDiv.style.pointerEvents = "auto";
textLayerDiv.style.userSelect = "text";
textLayerDiv.style.width = `${viewport.width}px`;
textLayerDiv.style.height = `${viewport.height}px`;

textContent.items.forEach((item: any) => {
  const span = document.createElement("span");
  span.textContent = item.str;
  span.style.position = "absolute";
  span.style.whiteSpace = "pre";
  span.style.pointerEvents = "auto";
  span.style.userSelect = "text";
  span.style.color = "transparent";

  const css = pdfTransformToCss(item.transform, viewport);

  span.style.top = css.top + "px";
  span.style.left = css.left + "px";
  span.style.fontSize = css.fontSize + "px";
  span.style.lineHeight = css.fontSize + "px";
  span.style.transformOrigin = "left bottom";

  textLayerDiv.appendChild(span);
});

        // Make sure text layer covers canvas size
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;
        textLayerDiv.style.position = "absolute";
        textLayerDiv.style.left = "0";
        textLayerDiv.style.top = "0";
        textLayerDiv.style.pointerEvents = "auto"; // allow selection
      }
    })();
  }, [pdfPages, pdfUrl]);

  // Helper: compute client bounding rects for a Selection that is inside a given textLayer element
  const getSelectionRectsForTextLayer = (pageIndex: number) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return null;
    const textLayer = textLayerRefs.current[pageIndex];
    if (!textLayer) return null;

    // Check selection intersects this textLayer
    let contains = false;
    for (let i = 0; i < sel.rangeCount; i++) {
      const range = sel.getRangeAt(i);
      if (textLayer.contains(range.commonAncestorContainer as Node)) {
        contains = true;
        break;
      }
    }
    if (!contains) return null;

    // Build rects from range.getClientRects()
    const range = sel.getRangeAt(0);
    const clientRects = Array.from(range.getClientRects());
    const containerRect = textLayer.getBoundingClientRect();

    const rects: Rect[] = clientRects.map((r) => ({
      left: r.left - containerRect.left,
      top: r.top - containerRect.top,
      width: r.width,
      height: r.height,
    }));

    // Get selected text
    const selectedText = range.toString();

    return { rects, selectedText, containerRect };
  };

  // Handle mouseup: determine which page had selection and prepare preview highlight + dot
  const handleMouseUpOnTextLayer = (pageIndex: number) => {
    const result = getSelectionRectsForTextLayer(pageIndex);
    if (!result) {
      setSelectionPreview(null);
      return;
    }

    const { rects, selectedText } = result;

    if (rects.length === 0 || !selectedText.trim()) {
      setSelectionPreview(null);
      return;
    }

    // dot at the top-left of the first rect (start of selection)
    const first = rects[0];
    const dot = { x: first.left + 4, y: first.top + first.height / 2 };

    setSelectionPreview({
      page: pageIndex + 1,
      rects,
      selectedText,
      dot,
    });

    // clear selection UI so user sees highlight we draw (optional)
    window.getSelection()?.removeAllRanges();
  };

  // Accept preview → open modal to type note, or auto-save without note
  const openNoteModal = () => {
    if (!selectionPreview) return;

    // Show modal with prefilled selectedText
    setOpenNoteFor({
      id: Math.random().toString(36).slice(2),
      page: selectionPreview.page,
      rects: selectionPreview.rects,
      selectedText: selectionPreview.selectedText,
      dot: selectionPreview.dot,
      note: "",
    });
    setNoteText("");
    setSelectionPreview(null);
  };

  const saveNote = () => {
    if (!openNoteFor) return;

    const saved: Annotation = { ...openNoteFor, note: noteText || "" };
    const updated = [...annotations, saved];
    setAnnotations(updated);
    setOpenNoteFor(null);
    setNoteText("");
    // redraw highlights are rendered by render markup below automatically
  };

  // Click dot to open note (view/edit)
  const handleDotClick = (ann: Annotation) => {
    setOpenNoteFor(ann);
    setNoteText(ann.note || "");
  };

  // Export to PDF: draw rectangles and text for annotations
  const handleSavePdf = async () => {
    if (!pdfBytes) {
      alert("PDF not loaded");
      return;
    }
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const ann of annotations) {
      const page = pdfDoc.getPage(ann.page - 1);

      // find canvas for that page
      const canvas = canvasRefs.current[ann.page - 1];
      const container = pageContainersRef.current[ann.page - 1];
      if (!canvas || !container) continue;

      const canvasRect = canvas.getBoundingClientRect();
      const pageWidthPts = page.getWidth();
      const pageHeightPts = page.getHeight();

      // For each rect, map CSS px to PDF points
      for (const r of ann.rects) {
        const xPdf = (r.left / canvas.width) * pageWidthPts;
        // PDF y origin is bottom-left
        const yPdf = pageHeightPts - ((r.top + r.height) / canvas.height) * pageHeightPts;
        const wPdf = (r.width / canvas.width) * pageWidthPts;
        const hPdf = (r.height / canvas.height) * pageHeightPts;

        page.drawRectangle({
          x: xPdf,
          y: yPdf,
          width: wPdf,
          height: hPdf,
          color: rgb(1, 1, 0),
          opacity: 0.35,
        });
      }

      // write the note at the start dot (approx)
      const dot = ann.dot;
      const xPdfDot = (dot.x / canvas.width) * pageWidthPts;
      const yPdfDot = pageHeightPts - (dot.y / canvas.height) * pageHeightPts;

      page.drawText(ann.note || ann.selectedText.slice(0, 120), {
        x: xPdfDot,
        y: yPdfDot,
        size: 10,
        font,
        color: rgb(1, 0, 0),
      });
    }

    const bytes = await pdfDoc.save();
    const clean = new Uint8Array(bytes);
    const blob = new Blob([clean], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "annotated.pdf";
    a.click();
  };

  // Renders the highlight overlays and dot anchors (HTML overlay on top of page)
  const renderHighlightsForPage = (pageIndex: number) => {
    const pageNum = pageIndex + 1;
    const anns = annotations.filter((a) => a.page === pageNum);

    return anns.map((ann) => {
      const key = ann.id;
      return (
        <React.Fragment key={key}>
          {/* highlight rects */}
          {ann.rects.map((r, idx) => (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: r.left,
                top: r.top,
                width: r.width,
                height: r.height,
                background: "yellow",
                opacity: 0.35,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* anchor dot */}
          <div
            onClick={() => handleDotClick(ann)}
            title={ann.note || ann.selectedText}
            style={{
              position: "absolute",
              left: ann.dot.x - 6,
              top: ann.dot.y - 6,
              width: 12,
              height: 12,
              borderRadius: 12,
              background: "#FF5722",
              cursor: "pointer",
              zIndex: 50,
              border: "2px solid white",
              boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
            }}
          />
        </React.Fragment>
      );
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>PDF Annotator — Text Selection</h2>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: "70vh",
              overflowY: "auto",
              border: "1px solid #ddd",
              padding: 12,
              position: "relative",
            }}
          >
            {pdfPages.length === 0 && <div>Loading PDF...</div>}

            {pdfPages.map((sourceCanvas, idx) => {
              return (
                <div
                  key={idx}
                  ref={(el) => {pageContainersRef.current[idx] = el}}
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginBottom: 24,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    background: "white",
                  }}
                >
                  {/* Canvas (visual) */}
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[idx] = el;
                      if (el) {
                        el.width = sourceCanvas.width;
                        el.height = sourceCanvas.height;
                        const ctx = el.getContext("2d")!;
                        ctx.clearRect(0, 0, el.width, el.height);
                        ctx.drawImage(sourceCanvas, 0, 0);
                      }
                    }}
                    style={{ display: "block" }}
                  />

                  {/* textLayer (selectable text) positioned over the canvas */}
                  <div
                    ref={(el) => {textLayerRefs.current[idx] = el}}
                    onMouseUp={() => handleMouseUpOnTextLayer(idx)}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      // width/height will be set by the text-layer creation effect
                      color: "transparent", // hide native text color (renderTextLayer spans have their own styles)
                      // make text selectable
                      userSelect: "text",
                    }}
                  />

                  {/* overlay for highlights and anchor dots */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: sourceCanvas.width,
                      height: sourceCanvas.height,
                      pointerEvents: "none",
                    }}
                  >
                    {/* visible highlights + dots (pointerEvents disabled on highlights to not block selection) */}
                    <div style={{ position: "relative", width: "100%", height: "100%" }}>
                      {renderHighlightsForPage(idx)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* toolbar */}
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button onClick={() => setSelectionPreview(null)}>Clear Preview</button>
            <button
              onClick={() =>
                selectionPreview ? openNoteModal() : alert("Select some text to annotate first.")
              }
            >
              Add Annotation from Selection
            </button>
            <button onClick={handleSavePdf} style={{ marginLeft: "auto", background: "#28a745", color: "white" }}>
              Export PDF with Highlights ({annotations.length})
            </button>
          </div>
        </div>

        {/* Right side: list of annotations */}
        <div style={{ width: 320 }}>
          <h4>Annotations ({annotations.length})</h4>
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {annotations.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: 8,
                  marginBottom: 8,
                  border: "1px solid #eee",
                  borderRadius: 6,
                  background: "#fafafa",
                }}
              >
                <div style={{ fontWeight: 600, color: "#007bff" }}>Page {a.page}</div>
                <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{a.selectedText}</div>
                <div style={{ marginTop: 8, color: "#333" }}>{a.note}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => handleDotClick(a)}>Open</button>
                  <button
                    onClick={() =>
                      setAnnotations((prev) => prev.filter((p) => p.id !== a.id))
                    }
                    style={{ background: "#dc3545", color: "white" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selection preview highlight (user hasn't saved note yet) */}
      {selectionPreview && (
        <div
          style={{
            position: "fixed",
            left: 20,
            bottom: 20,
            background: "white",
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
            boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
            zIndex: 2000,
          }}
        >
          <div style={{ fontWeight: 700 }}>Selection Preview — Page {selectionPreview.page}</div>
          <div style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{selectionPreview.selectedText}</div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button onClick={openNoteModal}>Add Annotation</button>
            <button onClick={() => setSelectionPreview(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Note modal (add / edit annotation) */}
      {openNoteFor && (
        <>
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "white",
              padding: 16,
              borderRadius: 8,
              boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
              zIndex: 3000,
              width: 520,
              maxWidth: "95%",
            }}
          >
            <h3 style={{ margin: 0 }}>Annotation — Page {openNoteFor.page}</h3>
            <div style={{ marginTop: 10, whiteSpace: "pre-wrap", background: "#fff8e1", padding: 8, borderRadius: 6 }}>
              {openNoteFor.selectedText}
            </div>
            <textarea
              placeholder="Add note (optional)"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              style={{ width: "100%", height: 120, marginTop: 12 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={() => setOpenNoteFor(null)}>Cancel</button>
              <button
                onClick={() => {
                  // If editing existing annotation, update it
                  if (annotations.some((a) => a.id === openNoteFor.id)) {
                    setAnnotations((prev) =>
                      prev.map((a) => (a.id === openNoteFor.id ? { ...a, note: noteText } : a))
                    );
                    setOpenNoteFor(null);
                    setNoteText("");
                  } else {
                    saveNote();
                  }
                }}
                style={{ background: "#007bff", color: "white" }}
              >
                Save
              </button>
            </div>
          </div>

          {/* backdrop */}
          <div
            onClick={() => setOpenNoteFor(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 2500,
            }}
          />
        </>
      )}
    </div>
  )
}

export default PdfAnnotatorTextSelect