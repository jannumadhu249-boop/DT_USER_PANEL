import React, { useState, useEffect, useRef } from "react";
import { URLS } from "../../url";
import "../../styles/MyTaxSummary.css";

const DocumentViewer = ({ item, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  const overlayRef = useRef(null);

  const baseUrl = URLS.Base_Url || "http://187.127.143.141:4000/";
  const normalizedPath = item.file_path.replace(/\\/g, "/");
  const baseFileUrl = `${baseUrl}${normalizedPath}`;
  // Hide native PDF viewer toolbar, print, drive, download buttons
  const pdfFileUrl = `${baseFileUrl}#toolbar=0&navpanes=0&scrollbar=0`;
  const isPdf = item.mime_type === "application/pdf";
  const isImage = item.mime_type?.startsWith("image/");

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="dv-overlay"
    >
      {/* ── Top Toolbar (No download, drive, or print options) ── */}
      <div className="dv-toolbar">
        {/* File info */}
        <div className="dv-file-info">
          <div className="dv-file-name">
            📄 {item.document_name || item.original_name}
          </div>
          <div className="dv-file-meta">
            {item.document_type} &nbsp;·&nbsp; Tax Year {item.year?.name || "N/A"}
          </div>
        </div>

        {/* Zoom & Rotate — only for images */}
        {isImage && (
          <div className="dv-image-controls">
            <button
              className="dv-tool-btn"
              title="Zoom Out"
              disabled={zoom <= 0.3}
              onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.2).toFixed(1)))}
            >
              🔍<span className="dv-zoom-sub">−</span>
            </button>
            <div className="dv-zoom-level">
              {Math.round(zoom * 100)}%
            </div>
            <button
              className="dv-tool-btn"
              title="Zoom In"
              disabled={zoom >= 3}
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(1)))}
            >
              🔍<span className="dv-zoom-sub">+</span>
            </button>
            <button
              className="dv-tool-btn"
              title="Rotate"
              onClick={() => setRotate((r) => (r + 90) % 360)}
            >
              🔄
            </button>
            <button
              className="dv-tool-btn"
              title="Reset View"
              onClick={() => {
                setZoom(1);
                setRotate(0);
              }}
            >
              ↩
            </button>
          </div>
        )}

        {/* Close Button Only */}
        <button
          className="dv-tool-btn dv-close-btn"
          title="Close (Esc)"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* ── Viewer Body ── */}
      <div className={`dv-body ${isImage ? "is-image" : ""}`}>
        {isPdf ? (
          <iframe
            src={pdfFileUrl}
            title={item.document_name}
            className="dv-iframe"
          />
        ) : isImage ? (
          <img
            src={baseFileUrl}
            alt={item.document_name}
            className="dv-image"
            style={{
              transform: `scale(${zoom}) rotate(${rotate}deg)`,
            }}
          />
        ) : (
          <div className="dv-fallback">
            <div className="dv-fallback-icon">📎</div>
            <div className="dv-fallback-text">
              Preview not available for this file type.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
