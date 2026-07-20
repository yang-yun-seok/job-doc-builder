(() => {
  "use strict";

  const pptxButton = document.querySelector("#export-pptx");
  const svgButton = document.querySelector("#export-svg");
  const status = document.querySelector("#export-status");
  const SVG_NS = "http://www.w3.org/2000/svg";
  const PPTX_PAGE_WIDTH = 8.2677165;
  const PPTX_PAGE_HEIGHT = 11.692913;

  if (!pptxButton || !svgButton) return;

  pptxButton.addEventListener("click", exportPptx);
  svgButton.addEventListener("click", exportFigmaSvg);

  async function exportPptx() {
    await withExportState("PPTX 파일을 만들고 있어요…", async () => {
      if (typeof window.PptxGenJS !== "function") {
        throw new Error("PPTX 출력 기능을 불러오지 못했어요.");
      }

      const pages = await serializeDocumentPages();
      const pptx = new window.PptxGenJS();
      const title = getDocumentName();

      pptx.defineLayout({
        name: "A4",
        width: PPTX_PAGE_WIDTH,
        height: PPTX_PAGE_HEIGHT,
      });
      pptx.layout = "A4";
      pptx.author = "나의 취업 서류 만들기";
      pptx.company = "Job Document Builder";
      pptx.subject = "취업 제출 문서";
      pptx.title = title;
      pptx.lang = "ko-KR";

      pages.forEach((page, index) => {
        const slide = pptx.addSlide();
        slide.background = { color: "FFFFFF" };
        addEditablePageToSlide(slide, pptx, page, index);
      });

      await pptx.writeFile({
        fileName: `${safeFileName(title)}-A4.pptx`,
        compression: true,
      });

      return `수정 가능한 PPTX ${pages.length}장을 저장했어요.`;
    });
  }

  async function exportFigmaSvg() {
    await withExportState("Figma용 SVG를 만들고 있어요…", async () => {
      const pages = await serializeDocumentPages();
      const svg = combinePagesForFigma(pages);
      downloadBlob(
        new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
        `${safeFileName(getDocumentName())}-Figma.svg`,
      );
      return `Figma SVG에 A4 ${pages.length}쪽을 담았어요.`;
    });
  }

  async function withExportState(message, task) {
    pptxButton.disabled = true;
    svgButton.disabled = true;
    setStatus(message, "working");

    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const result = await task();
      setStatus(result, "saved");
    } catch (error) {
      console.warn("문서 내보내기에 실패했습니다.", error);
      setStatus(error?.message || "파일을 만들지 못했어요. 다시 시도해 주세요.", "error");
    } finally {
      pptxButton.disabled = false;
      svgButton.disabled = false;
    }
  }

  function setStatus(message, stateName) {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = stateName;
  }

  async function serializeDocumentPages() {
    const pages = Array.from(document.querySelectorAll(".document-page"));
    if (pages.length === 0) throw new Error("내보낼 문서 페이지가 없어요.");

    return pages.map((page, index) => serializePage(page, index));
  }

  function serializePage(page, pageIndex) {
    const pageRect = page.getBoundingClientRect();
    const width = page.offsetWidth || 794;
    const height = page.offsetHeight || 1123;
    const scaleX = pageRect.width ? width / pageRect.width : 1;
    const scaleY = pageRect.height ? height / pageRect.height : 1;
    const shapes = [];
    const images = [];
    const texts = [];
    const usedBullets = new Set();
    const editable = {
      shapes: [],
      images: [],
      texts: [],
    };

    const context = {
      page,
      pageRect,
      width,
      height,
      scaleX,
      scaleY,
      pageIndex,
      editable,
    };

    shapes.push(`<rect width="${round(width)}" height="${round(height)}" fill="#ffffff"/>`);

    page.querySelectorAll("*").forEach((element) => {
      if (!isVisibleElement(element)) return;
      appendElementShape(element, context, shapes);
      if (element instanceof HTMLImageElement) {
        appendImage(element, context, images);
      }
    });

    const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode();
    while (textNode) {
      const parent = textNode.parentElement;
      if (parent && isVisibleElement(parent) && textNode.nodeValue?.trim()) {
        appendTextNode(textNode, context, texts, usedBullets);
      }
      textNode = walker.nextNode();
    }

    const content = [...shapes, ...images, ...texts].join("");
    const svg = [
      `<svg xmlns="${SVG_NS}" xmlns:xlink="http://www.w3.org/1999/xlink"`,
      ` width="${round(width)}" height="${round(height)}"`,
      ` viewBox="0 0 ${round(width)} ${round(height)}">`,
      `<title>${escapeXml(getDocumentName())} ${pageIndex + 1}쪽</title>`,
      `<g id="page-${pageIndex + 1}">${content}</g>`,
      `</svg>`,
    ].join("");

    return { width, height, content, svg, editable };
  }

  function appendElementShape(element, context, output) {
    const style = getComputedStyle(element);
    const box = localBox(element.getBoundingClientRect(), context);
    if (!box || box.width <= 0 || box.height <= 0) return;

    const background = parseCssColor(style.backgroundColor);
    const radius = Math.max(0, parseFloat(style.borderTopLeftRadius) || 0);

    if (background.opacity > 0 && element !== context.page) {
      output.push(
        `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"`,
        ` rx="${round(radius * context.scaleX)}" fill="${background.color}"`,
        background.opacity < 1 ? ` fill-opacity="${background.opacity}"` : "",
        `/>`,
      );
      context.editable.shapes.push({
        type: "rect",
        ...box,
        radius: round(radius * context.scaleX),
        color: background.color,
        opacity: background.opacity,
      });
    }

    appendBorder("top", style, box, context, output);
    appendBorder("right", style, box, context, output);
    appendBorder("bottom", style, box, context, output);
    appendBorder("left", style, box, context, output);
  }

  function appendBorder(side, style, box, context, output) {
    const cap = side[0].toUpperCase() + side.slice(1);
    const width = parseFloat(style[`border${cap}Width`]) || 0;
    const borderStyle = style[`border${cap}Style`];
    const color = parseCssColor(style[`border${cap}Color`]);
    if (width <= 0 || borderStyle === "none" || color.opacity <= 0) return;

    const strokeWidth = round(width * ((context.scaleX + context.scaleY) / 2));
    let points;
    if (side === "top") points = [box.x, box.y, box.x + box.width, box.y];
    if (side === "right") points = [box.x + box.width, box.y, box.x + box.width, box.y + box.height];
    if (side === "bottom") points = [box.x, box.y + box.height, box.x + box.width, box.y + box.height];
    if (side === "left") points = [box.x, box.y, box.x, box.y + box.height];

    const dash = borderStyle === "dashed"
      ? ` stroke-dasharray="${round(strokeWidth * 4)} ${round(strokeWidth * 3)}"`
      : borderStyle === "dotted"
        ? ` stroke-dasharray="${strokeWidth} ${round(strokeWidth * 2)}"`
        : "";

    output.push(
      `<line x1="${round(points[0])}" y1="${round(points[1])}"`,
      ` x2="${round(points[2])}" y2="${round(points[3])}"`,
      ` stroke="${color.color}" stroke-width="${strokeWidth}"`,
      color.opacity < 1 ? ` stroke-opacity="${color.opacity}"` : "",
      dash,
      `/>`,
    );
    context.editable.shapes.push({
      type: "line",
      x1: round(points[0]),
      y1: round(points[1]),
      x2: round(points[2]),
      y2: round(points[3]),
      color: color.color,
      opacity: color.opacity,
      width: strokeWidth,
      dash: borderStyle,
    });
  }

  function appendImage(image, context, output) {
    const source = image.currentSrc || image.src;
    if (!source) return;
    const box = localBox(image.getBoundingClientRect(), context);
    if (!box) return;
    const style = getComputedStyle(image);
    const preserve = style.objectFit === "contain" ? "xMidYMid meet" : "xMidYMid slice";
    const markup = [
      `<image x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"`,
      ` href="${escapeXml(source)}" preserveAspectRatio="${preserve}"/>`,
    ].join("");
    const link = image.closest("a")?.href;
    output.push(link ? `<a href="${escapeXml(link)}" target="_blank">${markup}</a>` : markup);
    context.editable.images.push({
      ...box,
      source,
      link: link || "",
      altText: image.alt || `문서 이미지 ${context.editable.images.length + 1}`,
    });
  }

  function appendTextNode(node, context, output, usedBullets) {
    const parent = node.parentElement;
    const style = getComputedStyle(parent);
    const color = parseCssColor(style.color);
    if (color.opacity <= 0) return;

    const lines = measureTextLines(node, context);
    if (lines.length === 0) return;

    const fontSize = round((parseFloat(style.fontSize) || 12) * context.scaleY);
    const fontFamily = cleanFontFamily(style.fontFamily);
    const fontWeight = normalizeFontWeight(style.fontWeight);
    const fontStyle = style.fontStyle === "italic" ? "italic" : "normal";
    const decoration = style.textDecorationLine?.includes("underline") ? "underline" : "none";
    const link = parent.closest("a")?.href;

    if (parent.closest("li") && !usedBullets.has(parent.closest("li"))) {
      usedBullets.add(parent.closest("li"));
      const first = lines[0];
      const bulletX = round(first.x - fontSize * 0.82);
      output.push(
        `<text x="${bulletX}" y="${first.y}"`,
        ` fill="${color.color}" font-family="${escapeXml(fontFamily)}"`,
        ` font-size="${fontSize}" font-weight="${fontWeight}">•</text>`,
      );
      context.editable.texts.push({
        text: "•",
        x: bulletX,
        y: first.top,
        width: round(fontSize * 0.72),
        height: first.height,
        color: color.color,
        opacity: color.opacity,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle: "normal",
        decoration: "none",
        link: "",
      });
    }

    lines.forEach((line) => {
      const textMarkup = [
        `<text x="${line.x}" y="${line.y}" xml:space="preserve"`,
        ` fill="${color.color}"`,
        color.opacity < 1 ? ` fill-opacity="${color.opacity}"` : "",
        ` font-family="${escapeXml(fontFamily)}" font-size="${fontSize}"`,
        ` font-weight="${fontWeight}" font-style="${fontStyle}"`,
        ` text-decoration="${decoration}">${escapeXml(line.text)}</text>`,
      ].join("");
      output.push(link ? `<a href="${escapeXml(link)}" target="_blank">${textMarkup}</a>` : textMarkup);
      context.editable.texts.push({
        text: line.text,
        x: line.x,
        y: line.top,
        width: line.width,
        height: line.height,
        color: color.color,
        opacity: color.opacity,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        decoration,
        link: link || "",
      });
    });
  }

  function measureTextLines(node, context) {
    const text = node.nodeValue || "";
    const range = document.createRange();
    const lines = [];
    let current = null;

    for (let index = 0; index < text.length; index += 1) {
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const rect = range.getBoundingClientRect();
      if ((!rect.width && !rect.height) || rect.bottom < context.pageRect.top || rect.top > context.pageRect.bottom) {
        continue;
      }

      const x = (rect.left - context.pageRect.left) * context.scaleX;
      const top = (rect.top - context.pageRect.top) * context.scaleY;
      const right = (rect.right - context.pageRect.left) * context.scaleX;
      const bottom = (rect.bottom - context.pageRect.top) * context.scaleY;
      const char = text[index] === "\n" ? "" : text[index];

      if (!current || Math.abs(current.top - top) > 1.5) {
        current = {
          x,
          top,
          right,
          bottom,
          y: bottom - Math.max(0.5, (bottom - top) * 0.12),
          text: char,
        };
        lines.push(current);
      } else {
        current.text += char;
        current.right = Math.max(current.right, right);
        current.bottom = Math.max(current.bottom, bottom);
      }
    }

    range.detach?.();
    return lines
      .filter((line) => line.text.trim())
      .map((line) => ({
        x: round(Math.max(0, line.x)),
        top: round(Math.max(0, line.top)),
        y: round(Math.max(0, line.y)),
        width: round(Math.max(0.5, line.right - line.x)),
        height: round(Math.max(0.5, line.bottom - line.top)),
        text: line.text,
      }));
  }

  function localBox(rect, context) {
    if (!rect.width && !rect.height) return null;
    const x = (rect.left - context.pageRect.left) * context.scaleX;
    const y = (rect.top - context.pageRect.top) * context.scaleY;
    const width = rect.width * context.scaleX;
    const height = rect.height * context.scaleY;
    if (x > context.width || y > context.height || x + width < 0 || y + height < 0) return null;
    return {
      x: round(Math.max(0, x)),
      y: round(Math.max(0, y)),
      width: round(Math.min(context.width - Math.max(0, x), width)),
      height: round(Math.min(context.height - Math.max(0, y), height)),
    };
  }

  function isVisibleElement(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity || 1) > 0 &&
      (rect.width > 0 || rect.height > 0)
    );
  }

  function combinePagesForFigma(pages) {
    const gap = 48;
    const width = Math.max(...pages.map((page) => page.width));
    const height = pages.reduce((sum, page) => sum + page.height, 0) + gap * (pages.length - 1);
    let offsetY = 0;
    const groups = pages.map((page, index) => {
      const group = [
        `<g id="A4-page-${index + 1}" data-page="${index + 1}" transform="translate(0 ${round(offsetY)})">`,
        `<title>A4 ${index + 1}쪽</title>`,
        page.content,
        `</g>`,
      ].join("");
      offsetY += page.height + gap;
      return group;
    });

    return [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<svg xmlns="${SVG_NS}" xmlns:xlink="http://www.w3.org/1999/xlink"`,
      ` width="${round(width)}" height="${round(height)}"`,
      ` viewBox="0 0 ${round(width)} ${round(height)}">`,
      `<title>${escapeXml(getDocumentName())} · Figma 편집용</title>`,
      `<metadata>A4 pages exported from Job Document Builder</metadata>`,
      groups.join(""),
      `</svg>`,
    ].join("");
  }

  function addEditablePageToSlide(slide, pptx, page, pageIndex) {
    const xToInches = (value) => (value / page.width) * PPTX_PAGE_WIDTH;
    const yToInches = (value) => (value / page.height) * PPTX_PAGE_HEIGHT;
    const pageLabel = pageIndex + 1;

    page.editable.shapes.forEach((shape, index) => {
      if (shape.type === "rect") {
        const shapeType = shape.radius >= 2
          ? pptx.ShapeType.roundRect
          : pptx.ShapeType.rect;
        const width = xToInches(shape.width);
        const height = yToInches(shape.height);
        const options = {
          x: xToInches(shape.x),
          y: yToInches(shape.y),
          w: width,
          h: height,
          fill: {
            color: pptxColor(shape.color),
            transparency: opacityToTransparency(shape.opacity),
          },
          line: { type: "none" },
          objectName: `배경 ${pageLabel}-${index + 1}`,
        };

        if (shapeType === pptx.ShapeType.roundRect) {
          const radiusBase = Math.max(1, Math.min(shape.width, shape.height) / 2);
          options.rectRadius = Math.min(1, shape.radius / radiusBase);
        }
        slide.addShape(shapeType, options);
        return;
      }

      if (shape.type === "line") {
        slide.addShape(pptx.ShapeType.line, {
          x: xToInches(shape.x1),
          y: yToInches(shape.y1),
          w: xToInches(shape.x2 - shape.x1),
          h: yToInches(shape.y2 - shape.y1),
          line: {
            color: pptxColor(shape.color),
            transparency: opacityToTransparency(shape.opacity),
            width: Math.max(0.25, shape.width * 0.75),
            dashType: pptxDashType(shape.dash),
            beginArrowType: "none",
            endArrowType: "none",
          },
          objectName: `구분선 ${pageLabel}-${index + 1}`,
        });
      }
    });

    page.editable.images.forEach((item, index) => {
      const options = {
        x: xToInches(item.x),
        y: yToInches(item.y),
        w: xToInches(item.width),
        h: yToInches(item.height),
        altText: item.altText,
        objectName: `이미지 ${pageLabel}-${index + 1}`,
      };
      if (item.source.startsWith("data:")) options.data = item.source;
      else options.path = item.source;
      if (item.link) {
        options.hyperlink = {
          url: item.link,
          tooltip: "연결된 페이지 열기",
        };
      }
      slide.addImage(options);
    });

    page.editable.texts.forEach((item, index) => {
      const width = editableTextWidth(page.editable.texts, item, page.width);
      const estimatedPowerPointWidth = item.width * 1.4 + item.fontSize * 0.45;
      const metricScale = Math.min(1, width / Math.max(1, estimatedPowerPointWidth));
      const height = Math.max(item.height * 1.3, item.fontSize * 1.35);
      const options = {
        x: xToInches(item.x),
        y: yToInches(Math.max(0, item.y - item.fontSize * 0.04)),
        w: xToInches(width),
        h: yToInches(height),
        margin: 0,
        color: pptxColor(item.color),
        transparency: opacityToTransparency(item.opacity),
        fontFace: pptxFontFace(item.fontFamily),
        fontSize: Math.max(1, item.fontSize * 0.7 * metricScale),
        bold: item.fontWeight >= 600,
        italic: item.fontStyle === "italic",
        underline: item.decoration === "underline"
          ? { style: "sng", color: pptxColor(item.color) }
          : undefined,
        lang: "ko-KR",
        breakLine: false,
        fit: "none",
        wrap: false,
        valign: "top",
        isTextBox: true,
        fill: { type: "none" },
        line: { type: "none" },
        objectName: `텍스트 ${pageLabel}-${index + 1}`,
      };
      if (item.link) {
        options.hyperlink = {
          url: item.link,
          tooltip: "연결된 페이지 열기",
        };
      }
      slide.addText(item.text, options);
    });
  }

  function editableTextWidth(items, item, pageWidth) {
    let boundary = pageWidth;
    items.forEach((candidate) => {
      if (candidate === item || candidate.x <= item.x + 1) return;
      const overlap = Math.min(
        item.y + item.height,
        candidate.y + candidate.height,
      ) - Math.max(item.y, candidate.y);
      const requiredOverlap = Math.min(item.height, candidate.height) * 0.5;
      if (overlap >= requiredOverlap) boundary = Math.min(boundary, candidate.x - 3);
    });
    return Math.max(1, boundary - item.x);
  }

  function pptxColor(value) {
    const normalized = String(value || "#000000").replace("#", "");
    return /^[0-9a-f]{6}$/i.test(normalized) ? normalized.toUpperCase() : "000000";
  }

  function opacityToTransparency(value) {
    const opacity = Number.isFinite(Number(value)) ? Number(value) : 1;
    return Math.round((1 - Math.max(0, Math.min(1, opacity))) * 100);
  }

  function pptxDashType(value) {
    if (value === "dashed") return "dash";
    if (value === "dotted") return "sysDot";
    return "solid";
  }

  function pptxFontFace(value) {
    if (/pretendard|noto sans kr|apple sd gothic/i.test(value || "")) {
      return "Malgun Gothic";
    }
    return value || "Malgun Gothic";
  }

  function parseCssColor(value) {
    if (!value || value === "transparent") return { color: "#000000", opacity: 0 };
    const match = value.match(/rgba?\(\s*([\d.]+)[, ]+\s*([\d.]+)[, ]+\s*([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/i);
    if (!match) return { color: value, opacity: 1 };
    const red = Math.round(Number(match[1]));
    const green = Math.round(Number(match[2]));
    const blue = Math.round(Number(match[3]));
    return {
      color: `#${toHex(red)}${toHex(green)}${toHex(blue)}`,
      opacity: match[4] === undefined ? 1 : Number(match[4]),
    };
  }

  function toHex(value) {
    return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
  }

  function cleanFontFamily(value) {
    return (value || "Malgun Gothic")
      .split(",")[0]
      .replace(/["']/g, "")
      .trim();
  }

  function normalizeFontWeight(value) {
    if (value === "bold") return 700;
    const numeric = Number.parseInt(value, 10);
    return Number.isFinite(numeric) ? numeric : 400;
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.append(anchor);
    anchor.click();
    window.setTimeout(() => {
      anchor.remove();
      URL.revokeObjectURL(url);
    }, 1200);
  }

  function getDocumentName() {
    return document.querySelector(".document-title")?.textContent?.trim() || "취업-서류";
  }

  function safeFileName(value) {
    return value
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "취업-서류";
  }

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function round(value) {
    return Number(value.toFixed(2));
  }

  window.JobDocExports = {
    serializeDocumentPages,
    combinePagesForFigma,
  };
})();
