import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import {
  Upload as UploadIcon,
  Eye,
  Trash2,
  Loader2,
  FileText,
  X,
  FolderOpen,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { URLS } from "../url";
import "../styles/Dashboard.css";

const UploadDocuments = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState("");
  const [document_name, setDocument_name] = useState("");
  const [documentTypes, setDocumentTypes] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewingId, setViewingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Document viewer modal
  const [viewModalDoc, setViewModalDoc] = useState(null);
  const [viewModalUrl, setViewModalUrl] = useState("");

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // ─── Auto‑dismiss alerts ─────────────────────────────────────────
  const alertTimeoutRef = useRef(null);

  useEffect(() => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    if (error || successMsg) {
      alertTimeoutRef.current = setTimeout(() => {
        setError("");
        setSuccessMsg("");
      }, 5000);
    }
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [error, successMsg]);

  /* ── 1. Fetch Document Types ───────────────────────────────────── */
  const fetchDocumentTypes = async () => {
    setLoadingTypes(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(URLS.GetDocumentType, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDocumentTypes(data.data);
      }
    } catch (err) {
      console.error("Error fetching document types:", err);
    } finally {
      setLoadingTypes(false);
    }
  };

  /* ── 2. Fetch User Documents ───────────────────────────────────── */
  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(URLS.GetDocuments, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDocuments(data.data);
      } else if (Array.isArray(data)) {
        setDocuments(data);
      } else if (Array.isArray(data.documents)) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Handle sidebar responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch document types and uploaded documents on mount
  useEffect(() => {
    fetchDocumentTypes();
    fetchDocuments();
  }, []);

  /* ── File Selection Change ─────────────────────────────────────── */
  const MAX_FILE_SIZE_MB = 25;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please choose a smaller file.`);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      if (error) setError("");
    }
  };

  /* ── 3. Upload Document ────────────────────────────────────────── */
  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!selectedDocTypeId) {
      setError("Please select a document type.");
      return;
    }

    if (!selectedFile) {
      setError("Please select a document file to upload.");
      return;
    }

    // Check if document_name is required (only for "Others" or "Other" type)
    const selectedType = documentTypes.find((t) => t._id === selectedDocTypeId);
    const typeName = selectedType?.name?.toLowerCase() || "";
    const isOthers = typeName === "others" || typeName === "other";
    
    if (isOthers && !document_name.trim()) {
      setError("Please enter a name for the file.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please choose a smaller file.`);
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("document_type_id", selectedDocTypeId);
      
      // Only include document_name for "Others"/"Other" type
      if (isOthers && document_name.trim()) {
        formData.append("document_name", document_name.trim());
      }
      
      formData.append("document", selectedFile);

      const res = await fetch(URLS.UploadDocuments, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const textErr = await res.text();
        data = {
          success: false,
          message: `Server error (${res.status}): ${textErr || "Upload failed."}`,
        };
      }

      if (data.success) {
        setSuccessMsg(data.message || "Document uploaded successfully!");
        setSelectedFile(null);
        setSelectedDocTypeId("");
        setDocument_name("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setShowUploadForm(false);
        fetchDocuments();
      } else {
        setError(data.message || "Failed to upload document.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Network error while uploading document.");
    } finally {
      setUploading(false);
    }
  };

  /* ── 4. View Document in Modal ─────────────────────────────────── */
  const handleViewDocument = (doc) => {
    const filePath = doc.file_path || doc.url || doc.filePath || doc.path || doc.document;
    if (!filePath) {
      alert("Document file path not found.");
      return;
    }

    // Build absolute URL, ensuring no double slashes
    const base = URLS.ImageUrl || "";
    const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const cleanPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
    const finalUrl = filePath.startsWith("http")
      ? filePath
      : `${cleanBase}${cleanPath}`;

    setViewModalDoc(doc);
    setViewModalUrl(finalUrl);
  };

  const closeModal = () => {
    setViewModalDoc(null);
    setViewModalUrl("");
  };

  /* ── 5. Delete Document by ID ─────────────────────────────────── */
  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }
    setDeletingId(docId);
    setError("");
    setSuccessMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${URLS.DeleteDocument}${docId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || "Document deleted successfully!");
        fetchDocuments();
      } else {
        setError(data.message || "Failed to delete document.");
      }
    } catch (err) {
      console.error("Delete document error:", err);
      setError("Network error while deleting document.");
    } finally {
      setDeletingId(null);
    }
  };

  // Helper to extract display name for document type from API object structure
  const getDocTypeName = (doc) => {
    if (doc.document_type_id && typeof doc.document_type_id === "object" && doc.document_type_id.name) {
      return doc.document_type_id.name;
    }
    if (typeof doc.document_type_id === "string") {
      const match = documentTypes.find((t) => t._id === doc.document_type_id);
      if (match) return match.name;
    }
    return doc.document_type_name || doc.document_type || doc.typeName || "Tax Document";
  };

  // Helper to extract filename from API object structure
  const getFileName = (doc) => {
    return (
      doc.document_name ||
      // doc.file_name ||
      // doc.original_name ||
      doc.name ||
      ""
    );
  };

  // ─── Alert component ─────────────────────────────────────────────
  const Alert = ({ type, message, onClose }) => {
    if (!message) return null;
    const isError = type === "error";
    const Icon = isError ? XCircle : CheckCircle;
    const color = isError ? "#dc3545" : "#198754";
    const bg = isError ? "#fff5f5" : "#f0fff4";
    const border = isError ? "#dc3545" : "#198754";
    const textColor = isError ? "#842029" : "#0a5c36";

    return (
      <div
        className="d-flex align-items-center justify-content-between py-2 px-3 mb-3"
        style={{
          fontSize: "0.875rem",
          borderRadius: "8px",
          borderLeft: `4px solid ${border}`,
          backgroundColor: bg,
          color: textColor,
        }}
      >
        <div className="d-flex align-items-center">
          <Icon size={18} className="me-2" style={{ color: color }} />
          <span>{message}</span>
        </div>
        <button
          type="button"
          style={{
            background: "none",
            border: "none",
            fontSize: "1.2rem",
            lineHeight: 1,
            cursor: "pointer",
            color: textColor,
            padding: "0 0.25rem",
          }}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <main className="main-content">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <a href="/dashboard">Home</a>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Upload Tax Documents</span>
        </div>

        <div className="form-container" style={{ width: "100%" }}>

          {/* ── 1. Upload Form Collapsible Card ──────────────────────────────── */}
          {showUploadForm && (
            <div
              className="form-card"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "1.75rem 2rem",
                marginBottom: "1.5rem",
                boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                border: "1px solid #e2e8f0",
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem 1rem",
                  marginBottom: "1.25rem",
                }}
              >
                <h3 className="form-title" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                  Upload New Document
                </h3>
              </div>

              {/* Alerts inside form */}
              <Alert type="success" message={successMsg} onClose={() => setSuccessMsg("")} />
              <Alert type="error" message={error} onClose={() => setError("")} />

              <form onSubmit={handleUpload}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  {/* Document Type Dropdown */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, color: "#1e293b", marginBottom: "0.5rem", display: "block" }}>
                      Document Type <span style={{ color: "#e63946" }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      value={selectedDocTypeId}
                      onChange={(e) => {
                        setSelectedDocTypeId(e.target.value);
                        if (error) setError("");
                      }}
                      disabled={loadingTypes || uploading}
                    >
                      <option value="">
                        {loadingTypes ? "Loading document types..." : "-- Select Document Type --"}
                      </option>
                      {documentTypes.map((type) => (
                        <option key={type._id} value={type._id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* File Name Input - Only show when document type is "Others" or "Other" */}
                  {selectedDocTypeId && (() => {
                    const selectedType = documentTypes.find((t) => t._id === selectedDocTypeId);
                    const typeName = selectedType?.name?.toLowerCase() || "";
                    const isOthers = typeName === "others" || typeName === "other";
                    return isOthers ? (
                      <div className="form-group">
                        <label style={{ fontWeight: 600, color: "#1e293b", marginBottom: "0.5rem", display: "block" }}>
                          Enter name of the file <span style={{ color: "#e63946" }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter file name"
                          value={document_name}
                          onChange={(e) => {
                            setDocument_name(e.target.value);
                            if (error) setError("");
                          }}
                          disabled={uploading}
                        />
                      </div>
                    ) : null;
                  })()}

                  {/* Document File Input */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, color: "#1e293b", marginBottom: "0.5rem", display: "block" }}>
                      Document File <span style={{ color: "#e63946" }}>*</span>
                    </label>
                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        id="fileUpload"
                        ref={fileInputRef}
                        className="file-input"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        disabled={uploading}
                      />
                      <label htmlFor="fileUpload" className="file-upload-label">
                        <span className="file-upload-button">Choose File</span>
                        <span className="file-upload-text">
                          {selectedFile ? selectedFile.name : "No file chosen"}
                        </span>
                      </label>
                    </div>
                    <p className="file-note" style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.4rem" }}>
                      Note: Please upload files size below 25MB (.pdf, .doc, .docx, .png, .jpg)
                    </p>
                  </div>
                </div>

                {/* Form Buttons */}
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadForm(false);
                      setSelectedFile(null);
                      setSelectedDocTypeId("");
                      setDocument_name("");
                      setError("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    style={{
                      padding: "0.55rem 1.25rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#f8fafc",
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-upload"
                    disabled={uploading}
                    style={{
                      padding: "0.55rem 1.5rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: uploading ? "not-allowed" : "pointer",
                      maxWidth: "100%",
                    }}
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadIcon size={16} />
                        Upload Now
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── 2. Documents List Card (FIRST) ────────────────────────────────── */}
          <div
            className="form-card"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "1.75rem 2rem",
              boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
              border: "1px solid #e2e8f0",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem 1rem",
                marginBottom: "1.5rem",
                width: "100%",
              }}
            >
              <h3 className="form-title" style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700 }}>
                Uploaded Documents ({documents.length})
              </h3>
              <button
                onClick={() => {
                  setShowUploadForm((prev) => !prev);
                  setError("");
                  setSuccessMsg("");
                }}
                className="btn-upload"
                style={{
                  padding: "0.55rem 1.25rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  borderRadius: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  maxWidth: "100%",
                }}
              >
                {showUploadForm ? (
                  <>
                    <X size={16} /> Close Upload
                  </>
                ) : (
                  <>
                    <UploadIcon size={16} /> + Upload Document
                  </>
                )}
              </button>
            </div>

            {/* Alerts outside form (shown when form is closed) */}
            {!showUploadForm && (
              <>
                <Alert type="success" message={successMsg} onClose={() => setSuccessMsg("")} />
                <Alert type="error" message={error} onClose={() => setError("")} />
              </>
            )}

            {loadingDocs ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                <Loader2 size={28} style={{ animation: "spin 1s linear infinite", marginBottom: "0.75rem", color: "#2563eb" }} />
                <p style={{ margin: 0, fontSize: "0.9rem" }}>Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3.5rem 1rem",
                  backgroundColor: "#f8fafc",
                  borderRadius: "10px",
                  border: "2px dashed #cbd5e1",
                }}
              >
                <FolderOpen size={40} style={{ color: "#94a3b8", marginBottom: "0.5rem" }} />
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
                  No documents uploaded yet. Click "+ Upload Document" above to get started.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "0.85rem 1rem", color: "#475569", fontWeight: 600 }}>S.No</th>
                      <th style={{ padding: "0.85rem 1rem", color: "#475569", fontWeight: 600 }}>Document Type</th>
                      <th style={{ padding: "0.85rem 1rem", color: "#475569", fontWeight: 600 }}>File Name</th>
                      <th style={{ padding: "0.85rem 1rem", color: "#475569", fontWeight: 600 }}>Upload Date</th>
                      <th style={{ padding: "0.85rem 1rem", color: "#475569", fontWeight: 600, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc, idx) => (
                      <tr key={doc._id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.85rem 1rem", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "0.85rem 1rem", fontWeight: 500 }}>
                          <span
                            style={{
                              backgroundColor: "#eff6ff",
                              color: "#1d4ed8",
                              fontWeight: 600,
                              fontSize: "0.82rem",
                              padding: "0.3rem 0.75rem",
                              borderRadius: "20px",
                            }}
                          >
                            {getDocTypeName(doc)}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#0f172a", fontWeight: 500 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <FileText size={16} style={{ color: "#2563eb" }} />
                            <span>{getFileName(doc)}</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#64748b", fontSize: "0.85rem" }}>
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", gap: "0.5rem", justifyContent: "center" }}>
                            {/* ── View Button (Icon only) ── */}
                            <button
                              onClick={() => handleViewDocument(doc)}
                              title="View Document"
                              style={{
                                padding: "0.4rem",
                                fontSize: "0.8rem",
                                borderRadius: "6px",
                                border: "1px solid #bfdbfe",
                                backgroundColor: "#eff6ff",
                                color: "#1d4ed8",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Eye size={16} />
                            </button>
                            {/* ── Delete Button (Icon only) ── */}
                            <button
                              onClick={() => handleDeleteDocument(doc._id)}
                              disabled={deletingId === doc._id}
                              title="Delete Document"
                              style={{
                                padding: "0.4rem",
                                fontSize: "0.8rem",
                                borderRadius: "6px",
                                border: "1px solid #fecaca",
                                backgroundColor: "#fef2f2",
                                color: "#dc2626",
                                cursor: deletingId === doc._id ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {deletingId === doc._id ? (
                                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>

      {/* ── Document Viewer Modal ────────────────────────────────────── */}
      {viewModalDoc && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "14px",
              width: "90%",
              maxWidth: "860px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.5rem",
                borderBottom: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <FileText size={18} style={{ color: "#2563eb" }} />
                <span
                  style={{
                    fontWeight: 600,
                    color: "#1e293b",
                    fontSize: "0.95rem",
                    maxWidth: "600px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {getFileName(viewModalDoc)}
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <a
                  href={viewModalUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "0.35rem 0.85rem",
                    fontSize: "0.8rem",
                    borderRadius: "6px",
                    border: "1px solid #bfdbfe",
                    backgroundColor: "#eff6ff",
                    color: "#1d4ed8",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Open in New Tab
                </a>
                <button
                  onClick={closeModal}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    padding: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
           {/* Modal Body */}
<div style={{ flex: 1, overflow: "auto", backgroundColor: "#f1f5f9" }}>
  {viewModalDoc.mime_type &&
    (viewModalDoc.mime_type.includes("image") ||
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(viewModalUrl)) ? (
    /* Image viewer */
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        padding: "1.5rem",
      }}
    >
      <img
        src={viewModalUrl}
        alt={getFileName(viewModalDoc)}
        style={{
          maxWidth: "100%",
          maxHeight: "70vh",
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
        onError={(e) => {
          e.target.style.display = "none";
          e.target.nextSibling.style.display = "block";
        }}
      />
      <p
        style={{
          display: "none",
          color: "#64748b",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        Unable to load image. Please use "Open in New Tab".
      </p>
    </div>
  ) : (
    /* PDF / other – iframe with toolbar hidden for PDFs */
    (() => {
      const isPdf =
        viewModalDoc.mime_type?.includes('pdf') ||
        /\.pdf$/i.test(viewModalUrl);
      const src = isPdf ? viewModalUrl + '#toolbar=0' : viewModalUrl;
      return (
        <iframe
          src={src}
          title={getFileName(viewModalDoc)}
          style={{
            width: "100%",
            height: "70vh",
            border: "none",
          }}
        />
      );
    })()
  )}
</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadDocuments;