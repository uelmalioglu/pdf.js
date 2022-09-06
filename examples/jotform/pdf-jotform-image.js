const Canvas = require("canvas");
const assert = require("assert");
const JotformCanvasMiddleware = require("./JotformCanvasMiddleware");
const fs = require("fs");

function NodeCanvasFactory() {}

NodeCanvasFactory.prototype = {
  create: function NodeCanvasFactory_create(width, height) {
    assert(width > 0 && height > 0, "Invalid canvas size");
    const canvas = Canvas.createCanvas(width, height);
    const context = canvas.getContext("2d");
    return { canvas, context };
  },

  reset: function NodeCanvasFactory_reset(canvasAndContext, width, height) {
    assert(canvasAndContext.canvas, "Canvas is not specified");
    assert(width > 0 && height > 0, "Invalid canvas size");
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },

  destroy: function NodeCanvasFactory_destroy(canvasAndContext) {
    assert(canvasAndContext.canvas, "Canvas is not specified");

    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  },
};

const pdfjsLib = require("../../build/generic/build/pdf");

// Relative path of the PDF file.
// var pdfURL = '/Users/iko/Documents/Code/pdf-importer/server/__tests__/samples/good/003.pdf';
const pdfURL =
  "/Users/iko/Documents/Code/pdf-importer/server/__tests__/samples/good/020.pdf";

// Read the PDF file into a typed array so PDF.js can load it.
const rawData = new Uint8Array(fs.readFileSync(pdfURL));

// Load the PDF file.
pdfjsLib
  .getDocument(rawData)
  .then(function (pdfDocument) {
    console.log("# PDF document loaded.");

    // Get the first page.
    pdfDocument.getPage(1).then(function (page) {
      // Render the page on a Node canvas with 100% scale.
      const viewport = page.getViewport(1.0);
      const canvasFactory = new NodeCanvasFactory();
      const { width, height } = viewport;
      const canvasAndContext = canvasFactory.create(width, height);
      canvasAndContext.context.JotformCanvasMiddleWare =
        new JotformCanvasMiddleware();
      const renderContext = {
        canvasContext: canvasAndContext.context,
        viewport,
        canvasFactory,
      };

      page.render(renderContext).then(function () {
        console.log("RENDERED");
        console.log(canvasAndContext.context.JotformCanvasMiddleWare);
        const fs = require("fs");
        const out = fs.createWriteStream(__dirname + "/test.png");
        const stream = canvasAndContext.canvas.createPNGStream();
        stream.pipe(out);
      });
    });
  })
  .catch(function (reason) {
    console.log(reason);
  });
