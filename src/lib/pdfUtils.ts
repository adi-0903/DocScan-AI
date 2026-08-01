import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker to render PDF pages on canvas
try {
  // Use jsDelivr CDN matching pdfjsLib version with fallback
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('Could not set pdfjs workerSrc:', e);
}

/**
 * Converts the first page of a PDF File into a high-resolution PNG Data URL
 * so it can be processed by the image extraction pipeline.
 */
export async function convertPdfFirstPageToImage(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;

    if (pdf.numPages < 1) {
      throw new Error('The uploaded PDF file contains no pages.');
    }

    const page = await pdf.getPage(1);
    const scale = 2.0; // 2x scale for sharp text extraction
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to create 2D canvas context for PDF rendering.');
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Fill white background to avoid transparent PDF text
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    };

    await page.render(renderContext).promise;
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl;
  } catch (err: any) {
    console.error('Error rendering PDF page 1:', err);
    throw new Error(
      err?.message || 'Failed to parse PDF document. Please upload a clear image or unencrypted PDF.'
    );
  }
}
