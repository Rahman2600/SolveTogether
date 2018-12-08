//TODO 
//two modes - mode to divide up pdf, mode to select what each section is
//show message to signify current mode, when top is visible top when bottom is visible but not top bottom,
//when neither top or bottom sides
//CLICK TO REMOVE, CLICK AGAIN TO REMOVE
//higlight line when it is hovered over, remove line if user clicks
//handle pages
const TOLERANCE = 10;
var canvasWithOnlyPDF = document.createElement('canvas');
var canvas = document.getElementById("pdf-processing-area");
var ycoordinates = [];
var selectedLineIndex = null;
//CONTINUE: multiple pages

// atob() is used to convert base64 encoded PDF to binary-like data.
// (See also https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/
// Base64_encoding_and_decoding.)
var url = "https://arxiv.org/pdf/quant-ph/0410100.pdf";
  
  // Loaded via <script> tag, create shortcut to access PDF.js exports.
  var pdfjsLib = window['pdfjs-dist/build/pdf'];
  
  // The workerSrc property shall be specified.
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'http://mozilla.github.io/pdf.js/build/pdf.worker.js';
  
  // Using DocumentInitParameters object to load binary data.
  var loadingTask = pdfjsLib.getDocument(url);
  loadingTask.promise.then(function(pdf) {
    console.log('PDF loaded');
    
    // Fetch the first page
    var pageNumber = 1;
    pdf.getPage(pageNumber).then(function(page) {
      console.log('Page loaded');
      
      var scale = 1.5;
      var viewport = page.getViewport(scale);
      // Prepare canvas using PDF page dimensions
      var context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
  
      // Render PDF page into canvas context
      var renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      var renderTask = page.render(renderContext);
      renderTask.then(function () {
        canvasWithOnlyPDF.height = viewport.height;
        canvasWithOnlyPDF.width = viewport.width;
        var destCtx = canvasWithOnlyPDF.getContext('2d');
        destCtx.drawImage(canvas, 0, 0);
        canvas.onclick = (evt) => {
          
          if (selectedLineIndex != null) {
            ycoordinates.splice(selectedLineIndex, 1);
            selectedLineIndex = null;
            clearCanvas();
            drawAllLines();
          } else {
            var y = convertPageToCanvasCoordinateY(evt.clientY);
            //TODO: tell user too close if tolerated returns false
            if (tolerated(y)) {
              ycoordinates.push(y)
              selectedLineIndex = ycoordinates.length - 1;
              context.beginPath();
              context.moveTo(0, y);
              context.lineTo(canvas.width, y);
              context.strokeStyle = "#000000";
              context.stroke();
            }
          }
        }

        canvas.onmousemove = (evt) => {
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
        }
      });
    });
  }, function (reason) {
    // PDF loading error
    console.error(reason);
  });

function tolerated (y) {
  if (ycoordinates.length > 0) {
    return Math.abs(y - getClosestPoint(y)) > TOLERANCE;
  } else {
    return true;
  }
}

function getClosestPoint(y) {
  return ycoordinates[getClosestPointIndex(y)];
}

function getClosestPointIndex (y)  {
  var closestPointIndex = 0;
  var closestDistance = Math.abs(y - ycoordinates[0]);
  for (var i = 1; i < ycoordinates.length; i++) {
    var currentPoint = ycoordinates[i];
    var distance = Math.abs(y - currentPoint);
    if (distance < closestDistance){
      closestDistance = distance;
      closestPointIndex = i;
    }
  }
  return closestPointIndex;
}

function convertPageToCanvasCoordinateY (ypage) {
  var rect = canvas.getBoundingClientRect();
  return ypage - rect.top;
}

function clearCanvas() {
  var destCtx = canvas.getContext('2d');
  destCtx.drawImage(canvasWithOnlyPDF, 0, 0);
}

function drawAllLines() {
  var context = canvas.getContext('2d');
  for (var i = 0; i < ycoordinates.length; i++) {
    var point = ycoordinates[i];
    context.beginPath();
    context.moveTo(0, point);
    context.lineTo(canvas.width, point);
    context.strokeStyle = "#000000";
    context.stroke();
  }
}
