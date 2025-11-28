// "use client";

// import { useEffect, useRef, useState } from "react";
// import { PDFDocument, PDFName, rgb, StandardFonts } from "pdf-lib";
// import * as pdfjsLib from "pdfjs-dist/webpack.mjs";


// interface Annotation {
//   page: number;
//   x: number;
//   y: number;
//   text: string;
// }

// interface PendingAnnotation {
//   page: number;
//   x: number;
//   y: number;
// }

// export default function PdfAnnotator({ pdfUrl }: { pdfUrl: string }) {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [canvases, setCanvases] = useState<HTMLCanvasElement[]>([]);
//   const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
//   const [annotations, setAnnotations] = useState<Annotation[]>([]);
//   const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
//   const [pdfPages, setPdfPages] = useState<HTMLCanvasElement[]>([]);

//   const [pendingAnnotation, setPendingAnnotation] = useState<PendingAnnotation | null>(null);
//   const [annotationText, setAnnotationText] = useState("");
//   const [hoveredAnnotation, setHoveredAnnotation] = useState<{
//     ann: Annotation;
//     screenX: number;
//     screenY: number
//   }|null>()

//   useEffect(() => {
//     const loadPdf = async () => {
//       const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
//       const numPages = pdf.numPages;
//       const canvasList: HTMLCanvasElement[] = [];
      
//       const arrayBuffer = await fetch(pdfUrl).then((res) => res.arrayBuffer());
//       setPdfBytes(new Uint8Array(arrayBuffer));
//       for (let pageNum = 1; pageNum <= numPages; pageNum++) {
//         const page = await pdf.getPage(pageNum);
//         const viewport = page.getViewport({ scale: 1.5 });

//         const canvas = document.createElement("canvas");
//         const ctx = canvas.getContext("2d")!;

//         canvas.width = viewport.width;
//         canvas.height = viewport.height;
//         canvas.dataset.page = String(pageNum);

//         await page.render({
//           canvasContext: ctx,
//           canvas: canvas,
//           viewport,
//         }).promise;

//         canvasList.push(canvas);
//         // canvas.dataset.page = String(pageNum);

//         // canvasList.push(canvas);
//       }

//     //   setCanvases(canvasList);

//     //   const buf = await fetch(pdfUrl).then(r => r.arrayBuffer());
//     //   setPdfBytes(new Uint8Array(buf));
//       setPdfPages(canvasList);
//     };

//     loadPdf();
//   }, [pdfUrl]);

//   // Handle annotation click
//   const handleCanvasClick = (pageNum: number, e: React.MouseEvent<HTMLCanvasElement>) => {
//     const canvas = e.currentTarget;
//     const rect = canvas.getBoundingClientRect();

//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
//     // const text = prompt("Enter comment:");

//     // if (!text) return;

//     setPendingAnnotation({page: pageNum, x, y});
//     setAnnotationText("");
//     // setAnnotations(prev => [...prev, { page: pageNum, x, y, text }]);

//     // const ctx = canvas.getContext("2d")!;
//     // ctx.fillStyle = "red";
//     // ctx.beginPath();
//     // ctx.arc(x, y, 5, 0, Math.PI * 2);
//     // ctx.fill();
//   };

//   // Attach click listeners to canvases
// //   useEffect(() => {
// //     canvases.forEach((canvas, idx) => {
// //       const pageNum = idx + 1;
// //       const listener = (e: any) => handleCanvasClick(pageNum, e);
// //       canvas.addEventListener("click", listener);

// //       return () => canvas.removeEventListener("click", listener);
// //     });
// //   }, [canvases]);

//   const drawDot = (canvas: HTMLCanvasElement, x: number, y: number) => {
//     const ctx = canvas.getContext("2d")!;
//     ctx.fillStyle = "#FF5722";
//     ctx.beginPath();
//     ctx.arc(x, y, 6, 0, Math.PI * 2);
//     ctx.fill();
//   };

//   const redrawAnnotations = (pageNum: number, annsParam?: Annotation[]) => {
//     const anns = annsParam ?? annotations
//     const sourceCanvas = pdfPages[pageNum - 1];
//     const targetCanvas = canvasRefs.current[pageNum - 1];
    
//     if (!sourceCanvas || !targetCanvas) return;

//     const ctx = targetCanvas.getContext("2d");
//     if (!ctx) return;

//     // Clear and redraw original PDF
//     ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
//     ctx.drawImage(sourceCanvas, 0, 0);

//     anns.filter((a) => a.page === pageNum)
//     .forEach(a => drawDot(targetCanvas, a.x, a.y));

//     // const pageAnnotations = anns.filter(ann => ann.page === pageNum);
//     // pageAnnotations.forEach((ann, idx) => {
//     //   const globalIdx = anns.findIndex(a => a === ann) + 1;
//     //   drawAnnotationBox(targetCanvas, ann.x, ann.y, ann.text, globalIdx + 1);
//     // });
//   };

// //  const drawAnnotationBox = (canvas: HTMLCanvasElement, x: number, y: number, text: string, number: number) => {
// //     const ctx = canvas.getContext("2d")!;
// //     console.log("inside draw annotation box");
// //     if(!ctx) return;

// //      const boxWidth = 120;  // fixed width
// //     const boxHeight = 100; // fixed height
// //     const padding = 8;
// //     const lineHeight = 16;

// //     let boxX = x;
// //     let boxY = y - boxHeight - 10;
// //     if (boxX + boxWidth > canvas.width) boxX = canvas.width - boxWidth - 10;
// //     if (boxX < 10) boxX = 10;
// //     if (boxY < 10) boxY = y + 10;

// //     ctx.save();
// //     // Measure text to determine box size
// //     ctx.font = "14px Arial";
// //     const lines = text.split('\n');
// //     const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
// //     const boxWidth = Math.min(maxWidth + 20, 300); // Max width 300px
// //     const lineHeight = 20;
// //     const boxHeight = Math.max(lines.length * lineHeight + 20, 50);
    
// //     // Adjust position to keep box within canvas
// //     let boxX = x;
// //     let boxY = y - boxHeight - 10; // Position above the click point
    
// //     if (boxX + boxWidth > canvas.width) boxX = canvas.width - boxWidth - 10;
// //     if (boxX < 10) boxX = 10;
// //     if (boxY < 10) boxY = y + 10; // If no space above, show below
    
// //     // Draw box shadow
// //     ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
// //     ctx.fillRect(boxX + 2, boxY + 2, boxWidth, boxHeight);
    
// //     // Draw box background
// //     ctx.fillStyle = "#FFF9C4";
// //     ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    
// //     // Draw box border
// //     ctx.strokeStyle = "#FBC02D";
// //     ctx.lineWidth = 2;
// //     ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
// //     // Draw annotation number badge
// //     ctx.fillStyle = "orange";
// //     ctx.beginPath();
// //     ctx.arc(boxX + 15, boxY + 15, 12, 0, Math.PI * 2);
// //     ctx.fill();
    
// //     ctx.fillStyle = "white";
// //     ctx.font = "bold 12px Arial";
// //     ctx.textAlign = "center";
// //     ctx.textBaseline = "middle";
// //     ctx.fillText(String(number), boxX + 15, boxY + 15);
    
// //     // Draw text content
// //     ctx.fillStyle = "#000";
// //     ctx.font = "14px Arial";
// //     ctx.textAlign = "left";
// //     ctx.textBaseline = "top";
    
// //     const maxTextWidth = boxWidth - 45;
// //     let currentYText = boxY+8;
// //     lines.forEach((line, i) => {
// //       const words = line.split(" ");
// //       let currentLine = "";
      
// //       words.forEach((word, wordIdx) => {
// //         const testLine = currentLine.length === 0 ? word : currentLine + word + ' ';
// //         const metrics = ctx.measureText(testLine);
        
// //         if (metrics.width > maxTextWidth) {
// //           ctx.fillText(currentLine, boxX+35, currentYText);
// //           currentLine = word ;
// //           currentYText += lineHeight;
// //         } else {
// //           currentLine = testLine;
// //         }
// //         if(currentLine) {
// //             ctx.fillText(currentLine, boxX+35, currentYText);
// //             currentYText += lineHeight
// //         }
// //       });
      
// //     });
    
// //     // Draw pointer from box to click point
// //     ctx.strokeStyle = "#FBC02D";
// //     ctx.lineWidth = 2;
// //     ctx.beginPath();
// //     ctx.moveTo(x, y);
// //     ctx.lineTo(boxX + 15, boxY + (boxY < y ? boxHeight : 0));
// //     ctx.stroke();
    
// //     // Draw click point
// //     ctx.fillStyle = "#FF5722";
// //     ctx.beginPath();
// //     ctx.arc(x, y, 5, 0, Math.PI * 2);
// //     ctx.fill();
// //   };

// const drawAnnotationBox = (
//   canvas: HTMLCanvasElement,
//   x: number,
//   y: number,
//   text: string,
//   number: number
// ) => {
//   const ctx = canvas.getContext("2d")!;
//   if (!ctx) return;

//   const boxWidth = 120;  // fixed width
//   const boxHeight = 100; // fixed height
//   const padding = 8;
//   const lineHeight = 16;

//   // Positioning (same as before)
//   let boxX = x;
//   let boxY = y - boxHeight - 10;
//   if (boxX + boxWidth > canvas.width) boxX = canvas.width - boxWidth - 10;
//   if (boxX < 10) boxX = 10;
//   if (boxY < 10) boxY = y + 10;

//   ctx.save();

//   // Background
//   ctx.fillStyle = "#FFF9C4";
//   ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

//   // Border
//   ctx.strokeStyle = "#FBC02D";
//   ctx.lineWidth = 2;
//   ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

//   // Annotation number badge
//   ctx.fillStyle = "#FF5722";
//   ctx.beginPath();
//   ctx.arc(boxX + 15, boxY + 15, 12, 0, Math.PI * 2);
//   ctx.fill();

//   ctx.fillStyle = "white";
//   ctx.font = "bold 12px Arial";
//   ctx.textAlign = "center";
//   ctx.textBaseline = "middle";
//   ctx.fillText(String(number), boxX + 15, boxY + 15);

//   // Prepare text area with clipping
//   ctx.save();
//   ctx.beginPath();
//   ctx.rect(boxX + 35, boxY + 8, boxWidth - 45, boxHeight - 16);
//   ctx.clip();

//   ctx.fillStyle = "#000";
//   ctx.font = "14px Arial";
//   ctx.textAlign = "left";
//   ctx.textBaseline = "top";

//   const words = text.split(" ");
//   let line = "";
//   let textY = boxY + 8;

//   words.forEach((word) => {
//     const testLine = line.length === 0 ? word : line + " " + word;
//     const width = ctx.measureText(testLine).width;

//     if (width > boxWidth - 45) {
//       ctx.fillText(line, boxX + 35, textY);
//       textY += lineHeight;
//       line = word;
//     } else {
//       line = testLine;
//     }
//   });

//   ctx.fillText(line, boxX + 35, textY); // final line
//   ctx.restore();

//   // Fake scrollbar if overflow exists
//   const totalHeight = textY - (boxY + 8) + lineHeight;
//   const viewHeight = boxHeight - 16;

//   if (totalHeight > viewHeight) {
//     const scrollTrackX = boxX + boxWidth - 10;
//     const scrollTrackY = boxY + 8;
//     const scrollTrackHeight = boxHeight - 16;

//     // Track
//     ctx.fillStyle = "#ddd";
//     ctx.fillRect(scrollTrackX, scrollTrackY, 4, scrollTrackHeight);

//     // Thumb size proportional
//     const thumbHeight = Math.max(20, (viewHeight / totalHeight) * scrollTrackHeight);

//     ctx.fillStyle = "#999";
//     ctx.fillRect(scrollTrackX, scrollTrackY, 4, thumbHeight);
//   }

//   // Pointer
//   ctx.strokeStyle = "#FBC02D";
//   ctx.lineWidth = 2;
//   ctx.beginPath();
//   ctx.moveTo(x, y);
//   ctx.lineTo(boxX + 15, boxY < y ? boxY + boxHeight : boxY);
//   ctx.stroke();

//   // Click point
//   ctx.fillStyle = "#FF5722";
//   ctx.beginPath();
//   ctx.arc(x, y, 5, 0, Math.PI * 2);
//   ctx.fill();

//   ctx.restore();
// };



// // Save the annotation

//   const saveAnnotation = () => {
//     if (!pendingAnnotation || !annotationText.trim()) return;
//     const newAnnotation: Annotation = {
//       page: pendingAnnotation.page,
//       x: pendingAnnotation.x,
//       y: pendingAnnotation.y,
//       text: annotationText.trim(),
//     };

//     const updatedAnnotations = [...annotations, newAnnotation];
//     setAnnotations(updatedAnnotations);

//     // setTimeout(() => {
//         redrawAnnotations(pendingAnnotation.page, updatedAnnotations);
//     // },0);

//     // Draw visual indicator on canvas
//     // const canvas = canvasRefs.current[pendingAnnotation.page - 1];
//     // if (canvas) {
//     // //   const ctx = canvas.getContext("2d")!;
      
//     // //   // Draw red dot
//     // //   ctx.fillStyle = "red";
//     // //   ctx.beginPath();
//     // //   ctx.arc(pendingAnnotation.x, pendingAnnotation.y, 5, 0, Math.PI * 2);
//     // //   ctx.fill();

//     // //   // Draw annotation number
//     // //   ctx.fillStyle = "white";
//     // //   ctx.font = "bold 10px Arial";
//     // //   ctx.textAlign = "center";
//     // //   ctx.textBaseline = "middle";
//     // //   ctx.fillText(String(annotations.length + 1), pendingAnnotation.x, pendingAnnotation.y);
//     //     drawAnnotationBox(
//     //         canvas,pendingAnnotation.x,pendingAnnotation.y,
//     //         annotationText.trim(),
//     //         annotations.length+1
//     //     )
//     // }

//     // Reset
//     setPendingAnnotation(null);
//     setAnnotationText("");
//   };

//     const handleMouseMove = (pageNum: number, e: React.MouseEvent<HTMLCanvasElement>) => {
//     const canvas = e.currentTarget;
//     const rect = canvas.getBoundingClientRect();

//     const mouseX = e.clientX - rect.left;
//     const mouseY = e.clientY - rect.top;

//     let found: Annotation | null = null;

//     annotations.forEach((ann) => {
//       if (ann.page !== pageNum) return;

//       const dx = mouseX - ann.x;
//       const dy = mouseY - ann.y;
//       if (dx * dx + dy * dy <= 64) {
//         found = ann;
//       }
//     });

//     if (found)
//       setHoveredAnnotation({ ann: found, screenX: e.clientX, screenY: e.clientY });
//     else
//       setHoveredAnnotation(null);
//   };

//    const cancelAnnotation = () => {
//     setPendingAnnotation(null);
//     setAnnotationText("");
//   };

//    useEffect(() => {
//     if (pdfPages.length === 0) return;

//     const affectedPages = new Set(annotations.map((a) => a.page));
//     affectedPages.forEach((pageNum) => {
//       redrawAnnotations(pageNum);
//     });
//   }, [annotations, pdfPages]);

//    const deleteAnnotation = (index: number) => {
//     setAnnotations(prev => prev.filter((_, idx) => idx !== index));
    
//     // Re-render all canvases to remove the visual indicator
//     pdfPages.forEach((sourceCanvas, idx) => {
//       const canvas = canvasRefs.current[idx];
//       if (canvas) {
//         const ctx = canvas.getContext("2d");
//         if (ctx) {
//           ctx.clearRect(0, 0, canvas.width, canvas.height);
//           ctx.drawImage(sourceCanvas, 0, 0);
//         }
//       }
//     });
//     annotations.forEach((ann, annIdx) => {
//       if (annIdx !== index) {
//         const canvas = canvasRefs.current[ann.page - 1];
//         if (canvas) {
//         //   const ctx = canvas.getContext("2d")!;
//         //   ctx.fillStyle = "red";
//         //   ctx.beginPath();
//         //   ctx.arc(ann.x, ann.y, 5, 0, Math.PI * 2);
//         //   ctx.fill();
//         //   ctx.fillStyle = "white";
//         //   ctx.font = "bold 10px Arial";
//         //   ctx.textAlign = "center";
//         //   ctx.textBaseline = "middle";
//         //   ctx.fillText(String(annIdx + 1), ann.x, ann.y);
//             drawAnnotationBox(canvas, ann.x, ann.y, ann.text, annIdx + 1);
//         }
//       }
//     })
//     }

//     useEffect(() => {
//     if (pdfPages.length > 0 && annotations.length > 0) {
//       const affectedPages = new Set(annotations.map(a => a.page));
//       affectedPages.forEach(pageNum => {
//         redrawAnnotations(pageNum);
//       });
//     }
//   }, [annotations, pdfPages]);

   
//   // Save PDF with real annotations
//   const handleSavePdf = async () => {
//     if (!pdfBytes) {
//         alert("PDF not loaded yet!");
//         return;
//     };

//     const pdfDoc = await PDFDocument.load(pdfBytes);
//     const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

//     annotations.forEach(a => {
//       const page = pdfDoc.getPage(a.page - 1);

//       const canvas = canvasRefs.current[a.page - 1];
//       if(!canvas) return;
//       const xPdf = (a.x / canvas.width) * page.getWidth();
//       const yPdf = page.getHeight() - (a.y / canvas.height) * page.getHeight();

//       // page.drawText(a.text, {
//       //   x,
//       //   y,
//       //   size: 12,
//       //   font,
//       //   color: rgb(1, 0, 0),
//       // });

//       //   page.drawCircle({
//       //     x,
//       //     y: y + 6,
//       //     size: 3,
//       //     color: rgb(1, 0, 0),
//       //   });
      
//       const annotationDict = pdfDoc.context.obj({
//         Type: "Annot",
//         Subtype: "Text",
//         Rect: [xPdf - 10, yPdf - 10, xPdf + 10, yPdf + 10], // icon size
//         Contents: a.text,       // comment text
//         RC: `<p>${a.text}</p>`,
//         T: "Comment",
//         Name: "Comment",          // icon style: Comment / Note / Help / Insert / Key / NewParagraph
//         Open: false,              // popup closed initially
//         AnnotFlags: 4,            // no zoom/move
//       });
//       const popupObj = pdfDoc.context.obj({
//         Type: "Annot",
//         Subtype: "Popup",
//         Rect: [xPdf + 20, yPdf - 50, xPdf + 220, yPdf + 50], // popup box geometry
//         Parent: annotationDict,     // link popup to the icon annotation
//       });
//       // annotationDict.set(
//       //   PDFName.of("Popup"),
//       //   popupObj
//       // );

//       const annotationRef = pdfDoc.context.register(annotationDict);
//       const popupRef = pdfDoc.context.register(popupObj);

//       annotationDict.set(PDFName.of("Popup"), popupRef);
//       popupObj.set(PDFName.of("Parent"), annotationRef);

//       const existingAnnots = page.node.Annots();
//         if (existingAnnots) {
//           existingAnnots.push(annotationRef);
//           existingAnnots.push(popupRef)
//         } else {
//           page.node.set(PDFName.of("Annots"),pdfDoc.context.obj([annotationRef, popupRef]));
//         }
//     });

//     const saved = await pdfDoc.save();
//     const clean = Uint8Array.from(saved);
//     const blob = new Blob([clean], { type: "application/pdf" });
//     const url = URL.createObjectURL(blob);

//     const link = document.createElement("a");
//     link.href = url;
//     link.download = "annotated.pdf";
//     link.click();
//   };

//   return (
//     <div style={{ padding: "20px", position: "relative" }}>
//       <div style={{ marginBottom: "15px" }}>
//         <h2 style={{ marginBottom: "10px" }}>PDF Annotator</h2>
//         <p style={{ color: "#666", fontSize: "14px" }}>
//           Click anywhere on the PDF to add an annotation
//         </p>
//       </div>

//       {/* Scrollable PDF container */}
//       <div
//         ref={containerRef}
//         style={{
//           height: "70vh",
//           overflowY: "scroll",
//           border: "2px solid #ddd",
//           padding: "20px",
//           backgroundColor: "#f5f5f5",
//           borderRadius: "8px",
//           position: "relative",
//         }}
//       >
//         {pdfPages.length === 0 ? (
//           <div style={{ textAlign: "center", padding: "40px" }}>
//             Loading PDF...
//           </div>
//         ) : (
//           pdfPages.map((sourceCanvas, idx) => (
//             <div
//               key={idx}
//               style={{
//                 marginBottom: "30px",
//                 backgroundColor: "white",
//                 boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//                 display: "inline-block",
//                 position: "relative",
//               }}
//             >
//               <canvas
//                 ref={(el) => {
//                   canvasRefs.current[idx] = el;
//                   if (el && sourceCanvas) {
//                     el.width = sourceCanvas.width;
//                     el.height = sourceCanvas.height;
//                     const ctx = el.getContext("2d");
//                     if (ctx) {
//                       ctx.drawImage(sourceCanvas, 0, 0);
//                       redrawAnnotations(idx+1);
//                     }
//                   }
//                 }}
//                 onClick={(e) => handleCanvasClick(idx + 1, e)}
//                 onMouseMove={(e) => handleMouseMove(idx+1, e)}
//                 onMouseLeave={() => setHoveredAnnotation(null)}
//                 style={{
//                   cursor: "text",
//                   display: "block",
//                 }}
//               />
//               <div
//                 style={{
//                   padding: "8px",
//                   backgroundColor: "#f9f9f9",
//                   borderTop: "1px solid #ddd",
//                   fontSize: "12px",
//                   color: "#666",
//                 }}
//               >
//                 Page {idx + 1} of {pdfPages.length}
//               </div>
//             </div>
//           ))
//         )}

//         {/* Annotation Input Box */}
//         {pendingAnnotation && (
//           <div
//             style={{
//               position: "fixed",
//               top: "50%",
//               left: "50%",
//               transform: "translate(-50%, -50%)",
//               backgroundColor: "white",
//               padding: "20px",
//               borderRadius: "8px",
//               boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
//               zIndex: 1000,
//               minWidth: "400px",
//             }}
//           >
//             <h3 style={{ marginBottom: "15px", fontSize: "18px", fontWeight: "600" }}>
//               Add Annotation
//             </h3>
//             <p style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}>
//               Page {pendingAnnotation.page} • Position: ({Math.round(pendingAnnotation.x)}, {Math.round(pendingAnnotation.y)})
//             </p>
//             <textarea
//               value={annotationText}
//               onChange={(e) => setAnnotationText(e.target.value)}
//               placeholder="Enter your annotation text..."
//               autoFocus
//               style={{
//                 width: "100%",
//                 minHeight: "100px",
//                 padding: "10px",
//                 border: "1px solid #ddd",
//                 borderRadius: "4px",
//                 fontSize: "14px",
//                 fontFamily: "inherit",
//                 resize: "vertical",
//                 marginBottom: "15px",
//               }}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" && e.ctrlKey) {
//                   saveAnnotation();
//                 } else if (e.key === "Escape") {
//                   cancelAnnotation();
//                 }
//               }}
//             />
//             <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
//               <button
//                 onClick={cancelAnnotation}
//                 style={{
//                   padding: "10px 20px",
//                   border: "1px solid #ddd",
//                   backgroundColor: "white",
//                   borderRadius: "6px",
//                   cursor: "pointer",
//                   fontSize: "14px",
//                 }}
//               >
//                 Cancel (Esc)
//               </button>
//               <button
//                 onClick={saveAnnotation}
//                 disabled={!annotationText.trim()}
//                 style={{
//                   padding: "10px 20px",
//                   border: "none",
//                   backgroundColor: annotationText.trim() ? "#007bff" : "#ccc",
//                   color: "white",
//                   borderRadius: "6px",
//                   cursor: annotationText.trim() ? "pointer" : "not-allowed",
//                   fontSize: "14px",
//                   fontWeight: "500",
//                 }}
//               >
//                 Save (Ctrl+Enter)
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Overlay backdrop when annotation box is open */}
//         {pendingAnnotation && (
//           <div
//             style={{
//               position: "fixed",
//               top: 0,
//               left: 0,
//               right: 0,
//               bottom: 0,
//               backgroundColor: "rgba(0,0,0,0.5)",
//               zIndex: 999,
//             }}
//             onClick={cancelAnnotation}
//           />
//         )}
//       </div>

//       {hoveredAnnotation && (
//         <div
//           style={{
//             position: "fixed",
//             top: hoveredAnnotation.screenY + 12,
//             left: hoveredAnnotation.screenX + 12,
//             background: "#FFF9C4",
//             border: "2px solid #FBC02D",
//             padding: 10,
//             borderRadius: 8,
//             boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
//             maxWidth: 200,
//             maxHeight: 120,
//             overflowY: "auto",
//             zIndex: 2000,
//             whiteSpace: "pre-wrap",
//             pointerEvents: "none",
//           }}
//         >
//           {hoveredAnnotation.ann.text}
//         </div>
//       )}

//       {/* Annotations list */}
//       {annotations.length > 0 && (
//         <div
//           style={{
//             marginTop: "15px",
//             padding: "15px",
//             border: "1px solid #ddd",
//             borderRadius: "8px",
//             backgroundColor: "white",
//           }}
//         >
//           <h3 style={{ marginBottom: "10px", fontSize: "16px" }}>
//             Annotations ({annotations.length})
//           </h3>
//           <div style={{ maxHeight: "150px", overflowY: "auto" }}>
//             {annotations.map((ann, idx) => (
//               <div
//                 key={idx}
//                 style={{
//                   padding: "10px",
//                   marginBottom: "8px",
//                   backgroundColor: "#f9f9f9",
//                   borderRadius: "4px",
//                   fontSize: "14px",
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "flex-start",
//                   gap: "10px",
//                 }}
//               >
//                 <div style={{ flex: 1 }}>
//                   <div style={{ fontWeight: "600", marginBottom: "4px", color: "#007bff" }}>
//                     #{idx + 1} • Page {ann.page}
//                   </div>
//                   <div style={{ color: "#333" }}>{ann.text}</div>
//                 </div>
//                 <button
//                   onClick={() => deleteAnnotation(idx)}
//                   style={{
//                     padding: "4px 8px",
//                     border: "none",
//                     backgroundColor: "#dc3545",
//                     color: "white",
//                     borderRadius: "4px",
//                     cursor: "pointer",
//                     fontSize: "12px",
//                   }}
//                 >
//                   Delete
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Save button */}
//       <button
//         onClick={handleSavePdf}
//         disabled={!pdfBytes || annotations.length === 0}
//         style={{
//           marginTop: "15px",
//           padding: "12px 24px",
//           border: "none",
//           backgroundColor: pdfBytes && annotations.length > 0 ? "#28a745" : "#ccc",
//           color: "white",
//           borderRadius: "6px",
//           cursor: pdfBytes && annotations.length > 0 ? "pointer" : "not-allowed",
//           fontSize: "14px",
//           fontWeight: "500",
//         }}
//       >
//         Download PDF with Annotations ({annotations.length})
//       </button>
//     </div>
//   );
// }
