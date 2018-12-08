const TOLERANCE = 10;
// If absolute URL from the remote server is provided, configure the CORS
// header on that server.
var url = "https://arxiv.org/pdf/quant-ph/0410100.pdf";

// Loaded via <script> tag, create shortcut to access PDF.js exports.
var pdfjsLib = window["pdfjs-dist/build/pdf"];

// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "//mozilla.github.io/pdf.js/build/pdf.worker.js";

var body = document.getElementById("body");

var pdfDoc = null;

/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
function renderPages(i) {
  // Using promise to fetch the page
  return pdfDoc.getPage(i).then(function(page) {
    var canvasWithOnlyPDF = document.createElement("canvas");
    var ycoordinates = [];
    var selectedLineIndex = null;
    var canvas = document.createElement("canvas");
    var scale = 1.5;
    var viewport = page.getViewport(scale);
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    var context = canvas.getContext("2d");
    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);

    // Wait for rendering to finish
    renderTask.promise.then(function() {
      if (i + 1 <= pdfDoc.numPages) {
        renderPages(i + 1);
      }
      canvasWithOnlyPDF.height = viewport.height;
      canvasWithOnlyPDF.width = viewport.width;
      var destCtx = canvasWithOnlyPDF.getContext("2d");
      destCtx.drawImage(canvas, 0, 0);
      canvas.onclick = evt => {
        if (selectedLineIndex != null) {
          ycoordinates.splice(selectedLineIndex, 1);
          selectedLineIndex = null;
          clearCanvas();
          drawAllLines();
        } else {
          var y = convertPageToCanvasCoordinateY(evt.clientY);
          //TODO: tell user too close if tolerated returns false
          if (tolerated(y)) {
            ycoordinates.push(y);
            selectedLineIndex = ycoordinates.length - 1;
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
            context.strokeStyle = "#000000";
            context.stroke();
          }
        }
      };

      canvas.onmousemove = evt => {
        if (ycoordinates.length > 0) {
          var y = convertPageToCanvasCoordinateY(evt.clientY);
          var closestPointIndex = getClosestPointIndex(y);
          var closestPoint = ycoordinates[closestPointIndex];
          if (selectedLineIndex != null) {
            if (ycoordinates[selectedLineIndex] > TOLERANCE) {
              selectedLineIndex = null;
              clearCanvas();
              drawAllLines();
            }
          }
          if (Math.abs(y - getClosestPoint(y)) <= TOLERANCE) {
            selectedLineIndex = closestPointIndex;
            clearCanvas();
            drawAllLines();
            context.beginPath();
            context.moveTo(0, closestPoint);
            context.lineTo(canvas.width, closestPoint);
            context.strokeStyle = "#ff0000";
            context.stroke();
          }
        }
      };

      function tolerated(y) {
        if (ycoordinates.length > 0) {
          return Math.abs(y - getClosestPoint(y)) > TOLERANCE;
        } else {
          return true;
        }
      }

      function getClosestPoint(y) {
        return ycoordinates[getClosestPointIndex(y)];
      }

      function getClosestPointIndex(y) {
        var closestPointIndex = 0;
        var closestDistance = Math.abs(y - ycoordinates[0]);
        for (var i = 1; i < ycoordinates.length; i++) {
          var currentPoint = ycoordinates[i];
          var distance = Math.abs(y - currentPoint);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPointIndex = i;
          }
        }
        return closestPointIndex;
      }

      function convertPageToCanvasCoordinateY(ypage) {
        var rect = canvas.getBoundingClientRect();
        return ypage - rect.top;
      }

      function clearCanvas() {
        var destCtx = canvas.getContext("2d");
        destCtx.drawImage(canvasWithOnlyPDF, 0, 0);
      }

      function drawAllLines() {
        var context = canvas.getContext("2d");
        for (var i = 0; i < ycoordinates.length; i++) {
          var point = ycoordinates[i];
          context.beginPath();
          context.moveTo(0, point);
          context.lineTo(canvas.width, point);
          context.strokeStyle = "#000000";
          context.stroke();
        }
      }
    });

    body.appendChild(canvas);
  });
}

/**
 * If another page rendering in progress, waits until the rendering is
 * finised. Otherwise, executes rendering immediately.
 */

/**
 * Asynchronously downloads PDF.
 */
pdfjsLib.getDocument(url).then(function(pdfDoc_) {
  pdfDoc = pdfDoc_;

  renderPages(1).then(() => {
    console.log("done");
  });
});
