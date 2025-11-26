import jsPDF from "jspdf";

export interface PdfSection {
  [key: string]: unknown;
  heading?: string;
  level?: number;
  content?: (string | number)[];
  tables?: TableData[];
  images?: ImageData[];
  charts?: ImageData[];
  children?: PdfSection[];
}

export interface PdfData {
  [key: string]: unknown;
  fileName?: string;
  fileType?: string;
  title?: string;
  sections?: PdfSection[];
  stats?: {
    numSections?: number;
    numTables?: number;
  };
}

export interface TableData {
  [key: string]: unknown;
  headers?: (string | number)[];
  header?: (string | number)[];
  columns?: (string | number)[];
  rows?: (string | number | Record<string, unknown>)[][];
  data?: (string | number | Record<string, unknown>)[][];
  values?: (string | number | Record<string, unknown>)[][];
}

export interface ImageData {
  [key: string]: unknown;
  src?: string;
  url?: string;
  data?: string;
  image?: string;
  caption?: string;
  title?: string;
  alt?: string;
}

export interface NormalizedData {
  title: string;
  sections: PdfSection[];
}

export interface PdfConfig {
  orientation?: "portrait" | "landscape";
  format?: "a4" | "letter" | [number, number];
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  colors?: {
    headingColor?: [number, number, number];
    heading1Color?: [number, number, number];
    heading2Color?: [number, number, number];
    heading3Color?: [number, number, number];
    textColor?: [number, number, number];
    tableHeaderBg?: [number, number, number];
  };
  fonts?: {
    fontFamily?: string;
    title?: { size: number; style: "bold" | "normal" | "italic" };
    heading1?: { size: number; style: "bold" | "normal" | "italic" };
    heading2?: { size: number; style: "bold" | "normal" | "italic" };
    heading3?: { size: number; style: "bold" | "normal" | "italic" };
    body?: { size: number; style: "bold" | "normal" | "italic" };
  };
  fieldMappings?: {
    title?: string | string[];
    sections?: string | string[];
    heading?: string | string[];
    content?: string | string[];
    level?: string | string[];
    children?: string | string[];
    tables?: string | string[];
    images?: string | string[];
    charts?: string | string[];
  };
  showPageNumbers?: boolean;
  pageNumberFormat?: string;
  lineHeight?: number;
  paragraphSpacing?: number;
  imageConfig?: {
    maxWidth?: number;
    maxHeight?: number;
    align?: "left" | "center" | "right";
  };
}

function getNestedValue(obj: Record<string, unknown>, path?: string | string[]): unknown {
  if (!path) return undefined;

  const paths = Array.isArray(path) ? path : [path];

  for (const p of paths) {
    const keys = p.split(".");
    let value: unknown = obj;

    for (const key of keys) {
      if (value && typeof value === "object" && value !== null && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        value = undefined;
        break;
      }
    }

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function normalizeData(
  data: PdfData | PdfSection[] | Record<string, unknown>,
  fieldMappings: NonNullable<PdfConfig["fieldMappings"]>
): NormalizedData {
  if (Array.isArray(data)) {
    return {
      title: "Report",
      sections: data
    };
  }

  const titleValue = getNestedValue(data, fieldMappings?.title);
  const title = typeof titleValue === "string" ? titleValue : "Report";

  let sections = getNestedValue(data, fieldMappings?.sections);

  if (!sections) {
    sections = [data as PdfSection];
  }

  return {
    title,
    sections: Array.isArray(sections) ? (sections as PdfSection[]) : [sections as PdfSection]
  };
}

function extractContent(
  item: Record<string, unknown>,
  fieldMappings: NonNullable<PdfConfig["fieldMappings"]>
): string[] {
  const content = getNestedValue(item, fieldMappings?.content);

  if (!content) return [];

  if (Array.isArray(content)) {
    return content.filter(c => typeof c === "string" || typeof c === "number").map(String);
  }

  if (typeof content === "string") {
    return [content];
  }

  if (typeof content === "object") {
    return Object.values(content)
      .filter(v => typeof v === "string" || typeof v === "number")
      .map(String);
  }

  return [];
}

function extractTables(
  item: Record<string, unknown>,
  fieldMappings: NonNullable<PdfConfig["fieldMappings"]>
): TableData[] {
  const tables = getNestedValue(item, fieldMappings?.tables);
  if (!tables) return [];
  if (!Array.isArray(tables)) return [tables as TableData];
  return tables as TableData[];
}

function extractImages(
  item: Record<string, unknown>,
  fieldMappings: NonNullable<PdfConfig["fieldMappings"]>
): ImageData[] {
  const images = getNestedValue(item, fieldMappings?.images || fieldMappings?.charts);
  if (!images) return [];
  if (!Array.isArray(images)) return [images as ImageData];
  return images as ImageData[];
}

export async function convertJsonToPdf(
  data: PdfData | PdfSection[] | Record<string, unknown>,
  config: Partial<PdfConfig> = {}
): Promise<jsPDF> {
  const cfg = {
    orientation: config.orientation || "portrait",
    format: config.format || "a4",
    margins: {
      top: config.margins?.top ?? 20,
      bottom: config.margins?.bottom ?? 20,
      left: config.margins?.left ?? 20,
      right: config.margins?.right ?? 20
    },
    colors: {
      headingColor:
        config.colors?.headingColor || config.colors?.heading1Color || ([0, 0, 0] as [number, number, number]),
      heading1Color:
        config.colors?.heading1Color || config.colors?.headingColor || ([0, 0, 0] as [number, number, number]),
      heading2Color:
        config.colors?.heading2Color || config.colors?.headingColor || ([0, 0, 0] as [number, number, number]),
      heading3Color:
        config.colors?.heading3Color || config.colors?.headingColor || ([0, 0, 0] as [number, number, number]),
      textColor: config.colors?.textColor || ([0, 0, 0] as [number, number, number]),
      tableHeaderBg: config.colors?.tableHeaderBg || ([220, 220, 220] as [number, number, number])
    },
    fonts: {
      fontFamily: config.fonts?.fontFamily || "helvetica",
      title: config.fonts?.title || { size: 20, style: "bold" as const },
      heading1: config.fonts?.heading1 || { size: 16, style: "bold" as const },
      heading2: config.fonts?.heading2 || { size: 14, style: "bold" as const },
      heading3: config.fonts?.heading3 || { size: 12, style: "bold" as const },
      body: config.fonts?.body || { size: 10, style: "normal" as const }
    },
    fieldMappings: {
      title: config.fieldMappings?.title || ["fileName", "title", "name", "reportName"],
      sections: config.fieldMappings?.sections || ["sections", "items", "data", "content"],
      heading: config.fieldMappings?.heading || ["heading", "title", "name"],
      content: config.fieldMappings?.content || ["content", "text", "body", "description"],
      level: config.fieldMappings?.level || ["level", "depth", "hierarchy"],
      children: config.fieldMappings?.children || ["children", "subsections", "items"],
      tables: config.fieldMappings?.tables || ["tables", "tableData"],
      images: config.fieldMappings?.images || ["images", "image", "img"],
      charts: config.fieldMappings?.charts || ["charts", "chart", "graphs", "visualizations"]
    },
    imageConfig: {
      maxWidth: config.imageConfig?.maxWidth || 150,
      maxHeight: config.imageConfig?.maxHeight || 100,
      align: config.imageConfig?.align || "center"
    },
    showPageNumbers: config.showPageNumbers ?? true,
    pageNumberFormat: config.pageNumberFormat || "Page {current} of {total}",
    lineHeight: config.lineHeight ?? 7,
    paragraphSpacing: config.paragraphSpacing ?? 2
  };

  const doc = new jsPDF({
    orientation: cfg.orientation,
    unit: "mm",
    format: cfg.format
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const maxWidth = pageWidth - cfg.margins.left - cfg.margins.right;

  let yPosition = cfg.margins.top;

  const checkAndAddPage = (requiredSpace = 10): void => {
    if (yPosition + requiredSpace > pageHeight - cfg.margins.bottom) {
      doc.addPage();
      yPosition = cfg.margins.top;
    }
  };

  const splitTextToLines = (text: string, fontSize: number): string[] => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxWidth);
  };

  const addTitle = (title: string): void => {
    const font = cfg.fonts.title;
    doc.setFontSize(font.size);
    doc.setFont(cfg.fonts.fontFamily, font.style);
    doc.setTextColor(...cfg.colors.heading1Color);

    const lines = splitTextToLines(title, font.size);
    lines.forEach(line => {
      checkAndAddPage(font.size * 0.5);
      doc.text(line, cfg.margins.left, yPosition);
      yPosition += font.size * 0.5;
    });
    yPosition += 8;
  };

  const addHeading = (heading: string, level: number): void => {
    let font = cfg.fonts.heading1;
    let spaceBefore = 10;
    let spaceAfter = 6;

    if (level === 2) {
      font = cfg.fonts.heading2;
      spaceBefore = 8;
      spaceAfter = 5;
    } else if (level >= 3) {
      font = cfg.fonts.heading3;
      spaceBefore = 6;
      spaceAfter = 4;
    }

    yPosition += spaceBefore;
    checkAndAddPage(font.size * 0.5);

    doc.setFontSize(font.size);
    doc.setFont(cfg.fonts.fontFamily, font.style);

    let headingColor = cfg.colors.headingColor;
    if (level === 1) {
      headingColor = cfg.colors.heading1Color;
    } else if (level === 2) {
      headingColor = cfg.colors.heading2Color;
    } else if (level >= 3) {
      headingColor = cfg.colors.heading3Color;
    }
    doc.setTextColor(...headingColor);

    const lines = splitTextToLines(heading, font.size);
    lines.forEach(line => {
      checkAndAddPage(font.size * 0.5);
      doc.text(line, cfg.margins.left, yPosition);
      yPosition += font.size * 0.5;
    });

    yPosition += spaceAfter;
  };
  //adding content
  const addContent = (content: string[]): void => {
    const font = cfg.fonts.body;
    doc.setFont(cfg.fonts.fontFamily, font.style);
    doc.setFontSize(font.size);
    doc.setTextColor(...cfg.colors.textColor);

    content.forEach(paragraph => {
      if (!paragraph || String(paragraph).trim() === "") return;

      const lines = splitTextToLines(String(paragraph), font.size);
      lines.forEach(line => {
        checkAndAddPage(cfg.lineHeight);
        doc.text(line, cfg.margins.left, yPosition);
        yPosition += cfg.lineHeight;
      });

      yPosition += cfg.paragraphSpacing;
    });
  };
  // Done adding content


  // add table
  const addTable = (table: TableData): void => {
    const headers = table.headers || table.header || table.columns;
    const rows = table.rows || table.data || table.values;

    if (!headers && !rows) return;

    checkAndAddPage(20);

    const colWidth = maxWidth / (headers?.length || 1);
    const rowHeight = 8;

    if (headers && Array.isArray(headers) && headers.length > 0) {
      doc.setFont(cfg.fonts.fontFamily, "bold");
      doc.setFontSize(9);
      doc.setFillColor(...cfg.colors.tableHeaderBg);

      headers.forEach((header: string | number, index: number) => {
        const x = cfg.margins.left + index * colWidth;
        doc.rect(x, yPosition, colWidth, rowHeight, "FD");

        const headerText = String(header);
        const headerLines = splitTextToLines(headerText, 9);
        const textY = yPosition + rowHeight / 2 + 2;
        doc.text(headerLines[0] || "", x + 2, textY);
      });

      yPosition += rowHeight;
    }

    if (rows && Array.isArray(rows) && rows.length > 0) {
      doc.setFont(cfg.fonts.fontFamily, "normal");
      doc.setFontSize(9);

      rows.forEach((row: (string | number | Record<string, unknown>)[]) => {
        checkAndAddPage(rowHeight);

        const rowArray = Array.isArray(row) ? row : Object.values(row);

        rowArray.forEach((cell: string | number | unknown, index: number) => {
          const x = cfg.margins.left + index * colWidth;
          doc.rect(x, yPosition, colWidth, rowHeight, "S");

          const cellText = String(cell);
          const cellLines = splitTextToLines(cellText, 9);
          const textY = yPosition + rowHeight / 2 + 2;
          doc.text(cellLines[0] || "", x + 2, textY);
        });

        yPosition += rowHeight;
      });
    }

    yPosition += 5;
  };
  // done adding table


  // add image
  const addImage = async (imageData: string | ImageData): Promise<void> => {
    try {
      let imgSrc: string;
      let caption: string | undefined;

      if (typeof imageData === "string") {
        imgSrc = imageData;
      } else if (typeof imageData === "object") {
        imgSrc =
          (imageData.src as string | undefined) ||
          (imageData.url as string | undefined) ||
          (imageData.data as string | undefined) ||
          (imageData.image as string | undefined) ||
          "";
        caption =
          (imageData.caption as string | undefined) ||
          (imageData.title as string | undefined) ||
          (imageData.alt as string | undefined);
      } else {
        return;
      }

      if (!imgSrc) return;

      checkAndAddPage(cfg.imageConfig.maxHeight + 10);

      const img = new Image();
      img.src = imgSrc;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            const aspectRatio = img.width / img.height;
            let imgWidth = cfg.imageConfig.maxWidth;
            let imgHeight = imgWidth / aspectRatio;

            if (imgHeight > cfg.imageConfig.maxHeight) {
              imgHeight = cfg.imageConfig.maxHeight;
              imgWidth = imgHeight * aspectRatio;
            }

            let xPosition = cfg.margins.left;
            if (cfg.imageConfig.align === "center") {
              xPosition = (pageWidth - imgWidth) / 2;
            } else if (cfg.imageConfig.align === "right") {
              xPosition = pageWidth - cfg.margins.right - imgWidth;
            }

            doc.addImage(imgSrc, "PNG", xPosition, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 5;

            if (caption) {
              doc.setFontSize(9);
              doc.setFont("helvetica", "italic");
              const captionLines = splitTextToLines(caption, 9);
              captionLines.forEach(line => {
                checkAndAddPage(cfg.lineHeight);
                doc.text(line, cfg.margins.left, yPosition);
                yPosition += cfg.lineHeight;
              });
            }

            yPosition += 5;
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () => reject(new Error("Failed to load image"));
      });
    } catch (error) {
      console.warn("Failed to add image to PDF:", error);
    }
  };
  // done adding image

  

  const processItem = async (item: PdfSection | Record<string, unknown>, depth = 1): Promise<void> => {
    const heading = getNestedValue(item, cfg.fieldMappings.heading);
    if (heading) {
      const level = getNestedValue(item, cfg.fieldMappings.level) || depth;
      addHeading(String(heading), Number(level));
    }

    const content = extractContent(item, cfg.fieldMappings);
    if (content.length > 0) {
      addContent(content);
    }

    const tables = extractTables(item, cfg.fieldMappings);
    tables.forEach(table => addTable(table));

    const images = extractImages(item, cfg.fieldMappings);
    for (const image of images) {
      await addImage(image);
    }

    const children = getNestedValue(item, cfg.fieldMappings.children);
    if (children && Array.isArray(children)) {
      for (const child of children) {
        await processItem(child, depth + 1);
      }
    }
  };

  const normalized = normalizeData(data, cfg.fieldMappings);

  if (normalized.title) {
    addTitle(String(normalized.title));
  }

  if (normalized.sections && Array.isArray(normalized.sections)) {
    for (const section of normalized.sections) {
      await processItem(section);
    }
  }

  if (cfg.showPageNumbers) {
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(9);
    doc.setFont(cfg.fonts.fontFamily, "normal");
    doc.setTextColor(0, 0, 0);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageText = cfg.pageNumberFormat.replace("{current}", String(i)).replace("{total}", String(pageCount));
      const textWidth = doc.getTextWidth(pageText);
      doc.text(pageText, pageWidth / 2 - textWidth / 2, pageHeight - 10);
    }
  }

  return doc;
}

export async function downloadPdf(
  data: PdfData | PdfSection[] | Record<string, unknown>,
  filename = "report.pdf",
  config: Partial<PdfConfig> = {}
): Promise<void> {
  const doc = await convertJsonToPdf(data, config);
  const pdfFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  doc.save(pdfFilename);
}

export async function getPdfBlob(
  data: PdfData | PdfSection[] | Record<string, unknown>,
  config: Partial<PdfConfig> = {}
): Promise<Blob> {
  const doc = await convertJsonToPdf(data, config);
  return doc.output("blob");
}

export async function getPdfBase64(
  data: PdfData | PdfSection[] | Record<string, unknown>,
  config: Partial<PdfConfig> = {}
): Promise<string> {
  const doc = await convertJsonToPdf(data, config);
  return doc.output("dataurlstring");
}

export async function autoConvertJsonToPdf(
  data: PdfData | PdfSection[] | Record<string, unknown>,
  filename?: string
): Promise<void> {
  await downloadPdf(data, filename);
}