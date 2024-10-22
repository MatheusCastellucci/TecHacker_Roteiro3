(function() {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type) {
    if (type === '2d' || type === 'webgl' || type === 'webgl2') {
      console.log(`[Canvas Fingerprinting] Contexto ${type} acessado no canvas.`);
      browser.runtime.sendMessage({ action: "canvasFingerprintDetected", method: "getContext", url: window.location.href });
    }
    return originalGetContext.apply(this, arguments);
  };

  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function() {
    console.log(`[Canvas Fingerprinting] toDataURL chamado no canvas.`);
    browser.runtime.sendMessage({ action: "canvasFingerprintDetected", method: "toDataURL", url: window.location.href });
    return originalToDataURL.apply(this, arguments);
  };

  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  CanvasRenderingContext2D.prototype.getImageData = function() {
    console.log(`[Canvas Fingerprinting] getImageData chamado.`);
    browser.runtime.sendMessage({ action: "canvasFingerprintDetected", method: "getImageData", url: window.location.href });
    return originalGetImageData.apply(this, arguments);
  };

  const originalFillText = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function() {
    console.log(`[Canvas Fingerprinting] fillText chamado.`);
    browser.runtime.sendMessage({ action: "canvasFingerprintDetected", method: "fillText", url: window.location.href });
    return originalFillText.apply(this, arguments);
  };
})();
