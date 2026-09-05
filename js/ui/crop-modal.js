/**
 * Aven - Interactive Circular Image Cropper Modal
 * Provides a zero-dependency, canvas-based circular crop tool with smooth pan & zoom.
 */

export class CropModal {
  constructor() {
    this.modalEl = null;
    this.canvasEl = null;
    this.ctx = null;
    this.zoomInput = null;
    this.saveBtn = null;
    this.cancelBtns = [];

    this.image = null;
    this.scale = 1;
    this.minScale = 1;
    this.maxScale = 3.5;
    this.offsetX = 0;
    this.offsetY = 0;

    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartOffsetX = 0;
    this.dragStartOffsetY = 0;

    this.onCropCallback = null;
    this.onCancelCallback = null;

    this.init();
  }

  init() {
    // Check if modal already exists in DOM
    let existing = document.getElementById('avatar-crop-modal');
    if (existing) {
      existing.remove();
    }

    const modalHtml = `
      <div class="modal-overlay crop-modal-overlay" id="avatar-crop-modal" role="dialog" aria-modal="true" aria-labelledby="crop-modal-title">
        <div class="modal-card crop-modal-card">
          <div class="modal-header">
            <h3 class="modal-title" id="crop-modal-title">Crop Profile Picture</h3>
            <button type="button" class="btn btn-ghost btn-icon crop-modal-close" aria-label="Close crop modal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body crop-modal-body">
            <p class="crop-hint-text">Drag to reposition, scroll or use slider to zoom into circle.</p>

            <div class="crop-viewport-container">
              <canvas class="crop-canvas" id="crop-canvas" width="320" height="320"></canvas>
            </div>

            <div class="crop-zoom-controls">
              <button type="button" class="btn btn-ghost btn-sm crop-zoom-btn" id="crop-zoom-out" aria-label="Zoom out">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <input type="range" class="crop-zoom-slider" id="crop-zoom-slider" min="1" max="3.5" step="0.01" value="1" aria-label="Zoom level">
              <button type="button" class="btn btn-ghost btn-sm crop-zoom-btn" id="crop-zoom-in" aria-label="Zoom in">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>

          <div class="modal-footer crop-modal-footer">
            <button type="button" class="btn btn-secondary crop-btn-cancel">Cancel</button>
            <button type="button" class="btn btn-primary crop-btn-save" id="crop-btn-save">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="crop-save-icon">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Apply &amp; Save</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    this.modalEl = document.getElementById('avatar-crop-modal');
    this.canvasEl = document.getElementById('crop-canvas');
    this.ctx = this.canvasEl.getContext('2d');
    this.zoomInput = document.getElementById('crop-zoom-slider');
    this.saveBtn = document.getElementById('crop-btn-save');

    this.bindEvents();
  }

  bindEvents() {
    // Close / Cancel
    this.modalEl.querySelectorAll('.crop-modal-close, .crop-btn-cancel').forEach(btn => {
      btn.addEventListener('click', () => this.close(false));
    });

    // Save
    this.saveBtn.addEventListener('click', () => this.handleSave());

    // Zoom Slider
    this.zoomInput.addEventListener('input', (e) => {
      this.setZoom(parseFloat(e.target.value));
    });

    // Zoom Buttons
    document.getElementById('crop-zoom-out')?.addEventListener('click', () => {
      this.setZoom(this.scale - 0.2);
    });
    document.getElementById('crop-zoom-in')?.addEventListener('click', () => {
      this.setZoom(this.scale + 0.2);
    });

    // Mouse Wheel Zoom on Canvas
    this.canvasEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.12 : -0.12;
      this.setZoom(this.scale + delta);
    }, { passive: false });

    // Drag / Pan Events (Mouse)
    this.canvasEl.addEventListener('mousedown', (e) => {
      if (!this.image) return;
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.dragStartOffsetX = this.offsetX;
      this.dragStartOffsetY = this.offsetY;
      this.canvasEl.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.image) return;
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      this.offsetX = this.dragStartOffsetX + dx;
      this.offsetY = this.dragStartOffsetY + dy;
      this.clampOffsets();
      this.render();
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        if (this.canvasEl) this.canvasEl.style.cursor = 'grab';
      }
    });

    // Drag / Pan Events (Touch for mobile / tablets)
    this.canvasEl.addEventListener('touchstart', (e) => {
      if (!this.image || e.touches.length !== 1) return;
      this.isDragging = true;
      const touch = e.touches[0];
      this.dragStartX = touch.clientX;
      this.dragStartY = touch.clientY;
      this.dragStartOffsetX = this.offsetX;
      this.dragStartOffsetY = this.offsetY;
    }, { passive: true });

    this.canvasEl.addEventListener('touchmove', (e) => {
      if (!this.isDragging || !this.image || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - this.dragStartX;
      const dy = touch.clientY - this.dragStartY;
      this.offsetX = this.dragStartOffsetX + dx;
      this.offsetY = this.dragStartOffsetY + dy;
      this.clampOffsets();
      this.render();
    }, { passive: true });

    this.canvasEl.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  open(imageSource) {
    return new Promise((resolve, reject) => {
      this.onCropCallback = resolve;
      this.onCancelCallback = reject;

      const img = new Image();
      img.onload = () => {
        this.image = img;
        this.setupInitialView();
        this.modalEl.classList.add('open');
      };
      img.onerror = (err) => {
        reject(new Error('Failed to load selected image.'));
      };

      if (typeof imageSource === 'string') {
        img.src = imageSource;
      } else if (imageSource instanceof File || imageSource instanceof Blob) {
        img.src = URL.createObjectURL(imageSource);
      } else {
        reject(new Error('Unsupported image source.'));
      }
    });
  }

  setupInitialView() {
    const canvasW = this.canvasEl.width;
    const canvasH = this.canvasEl.height;
    const circleDiameter = 240; // Diameter of crop circle

    // Minimum scale to cover circle completely in both dimensions
    const scaleX = circleDiameter / this.image.width;
    const scaleY = circleDiameter / this.image.height;
    this.minScale = Math.max(scaleX, scaleY);
    this.maxScale = Math.max(this.minScale * 4, 3.5);

    // Initial scale slightly larger to look great
    this.scale = this.minScale;
    this.offsetX = 0;
    this.offsetY = 0;

    this.zoomInput.min = this.minScale;
    this.zoomInput.max = this.maxScale;
    this.zoomInput.value = this.scale;

    this.clampOffsets();
    this.render();
  }

  setZoom(newZoom) {
    if (!this.image) return;
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, newZoom));
    this.zoomInput.value = this.scale;
    this.clampOffsets();
    this.render();
  }

  clampOffsets() {
    if (!this.image) return;
    const circleRadius = 120;
    const scaledW = this.image.width * this.scale;
    const scaledH = this.image.height * this.scale;

    // The circle center is at (canvasW / 2, canvasH / 2)
    // The image center is at (canvasW / 2 + offsetX, canvasH / 2 + offsetY)
    // To ensure the circle is fully covered, the image bounds must contain the circle
    const maxOffsetX = (scaledW / 2) - circleRadius;
    const minOffsetX = -maxOffsetX;
    const maxOffsetY = (scaledH / 2) - circleRadius;
    const minOffsetY = -maxOffsetY;

    this.offsetX = Math.max(minOffsetX, Math.min(maxOffsetX, this.offsetX));
    this.offsetY = Math.max(minOffsetY, Math.min(maxOffsetY, this.offsetY));
  }

  render() {
    if (!this.image || !this.ctx) return;

    const w = this.canvasEl.width;
    const h = this.canvasEl.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const circleRadius = 120;

    this.ctx.clearRect(0, 0, w, h);

    // 1. Draw Image
    this.ctx.save();
    const drawW = this.image.width * this.scale;
    const drawH = this.image.height * this.scale;
    const drawX = centerX + this.offsetX - (drawW / 2);
    const drawY = centerY + this.offsetY - (drawH / 2);

    this.ctx.drawImage(this.image, drawX, drawY, drawW, drawH);
    this.ctx.restore();

    // 2. Draw Dark Overlay with Transparent Circular Cutout
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(10, 14, 20, 0.62)';
    this.ctx.beginPath();
    this.ctx.rect(0, 0, w, h);
    this.ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2, true);
    this.ctx.closePath();
    this.ctx.fill();

    // 3. Draw Circle Boundary Guide Ring
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Subtle inner dashed guide
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, circleRadius - 1, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  async handleSave() {
    if (!this.image) return;

    const originalBtnHtml = this.saveBtn.innerHTML;
    this.saveBtn.disabled = true;
    this.saveBtn.innerHTML = `
      <span class="spinner-small" style="width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; display: inline-block; animation: spin 0.6s linear infinite; margin-right: 6px;"></span>
      <span>Saving...</span>
    `;

    try {
      // Export high-res circular cropped image
      const outputSize = 256; // 256x256 high-def avatar
      const outCanvas = document.createElement('canvas');
      outCanvas.width = outputSize;
      outCanvas.height = outputSize;
      const outCtx = outCanvas.getContext('2d');

      // Circular clip on output canvas
      outCtx.beginPath();
      outCtx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      outCtx.closePath();
      outCtx.clip();

      // Calculate slice coordinates
      const circleRadius = 120;
      const scaleFactor = outputSize / (circleRadius * 2);

      // On the preview canvas, the circle top-left is at (canvasCenter - circleRadius)
      // We map the image offset relative to the circle
      const previewCenterX = this.canvasEl.width / 2;
      const previewCenterY = this.canvasEl.height / 2;

      const imgDrawW = this.image.width * this.scale;
      const imgDrawH = this.image.height * this.scale;
      const imgDrawX = previewCenterX + this.offsetX - (imgDrawW / 2);
      const imgDrawY = previewCenterY + this.offsetY - (imgDrawH / 2);

      const circleTopLeftX = previewCenterX - circleRadius;
      const circleTopLeftY = previewCenterY - circleRadius;

      const outDrawX = (imgDrawX - circleTopLeftX) * scaleFactor;
      const outDrawY = (imgDrawY - circleTopLeftY) * scaleFactor;
      const outDrawW = imgDrawW * scaleFactor;
      const outDrawH = imgDrawH * scaleFactor;

      outCtx.drawImage(this.image, outDrawX, outDrawY, outDrawW, outDrawH);

      let blob = await new Promise((resolve) => {
        outCanvas.toBlob((b) => resolve(b), 'image/webp', 0.85);
      });
      let dataUrl = outCanvas.toDataURL('image/webp', 0.85);

      if (!blob || !dataUrl.startsWith('data:image/webp')) {
        blob = await new Promise((resolve) => {
          outCanvas.toBlob((b) => resolve(b), 'image/png');
        });
        dataUrl = outCanvas.toDataURL('image/png');
      }

      if (this.onCropCallback) {
        this.onCropCallback({ blob, dataUrl });
      }

      this.close(true);
    } catch (err) {
      console.error('Crop export failed:', err);
      alert('Could not crop image. Please try again.');
    } finally {
      this.saveBtn.disabled = false;
      this.saveBtn.innerHTML = originalBtnHtml;
    }
  }

  close(saved = false) {
    this.modalEl.classList.remove('open');
    if (!saved && this.onCancelCallback) {
      this.onCancelCallback(new Error('User cancelled crop'));
    }
    this.image = null;
    this.onCropCallback = null;
    this.onCancelCallback = null;
  }
}

// Singleton helper for simple programmatic calls
let cropModalInstance = null;

export function openCropModal(imageSource) {
  if (!cropModalInstance) {
    cropModalInstance = new CropModal();
  }
  return cropModalInstance.open(imageSource);
}
