/**
 * Fetch the latest shared document (admin-uploaded for all members)
 * and return its document_id + suggested filename.
 */
export const getLatestSharedDocument = async (listUrl, token) => {
  const response = await fetch(listUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message || "Failed to load available documents. Please try again later."
    );
  }

  const docs = Array.isArray(data.data) ? data.data.filter((doc) => !doc?.deleted) : [];
  if (!docs.length) {
    throw new Error("The document is not available yet. Please contact support or try again later.");
  }

  // API returns newest first; fall back to newest by createdAt if needed
  const latest = [...docs].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  })[0];

  const documentId = latest._id || latest.document_id || latest.id;
  if (!documentId) {
    throw new Error("Document id not found. Please contact support.");
  }

  return {
    documentId,
    fileName:
      latest.original_name ||
      latest.document_name ||
      latest.file_name ||
      "document.pdf",
  };
};

const getFilenameFromContentDisposition = (headerValue) => {
  if (!headerValue) return null;
  const utfMatch = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim().replace(/"/g, ""));
    } catch {
      return utfMatch[1].trim().replace(/"/g, "");
    }
  }
  const plainMatch = headerValue.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1]?.trim() || null;
};

const looksLikePdf = async (blob) => {
  const slice = blob.slice(0, 5);
  const text = await slice.text();
  return text.startsWith("%PDF");
};

/**
 * Download a shared document by document_id and trigger a browser file save.
 */
export const downloadSharedDocument = async ({
  downloadBaseUrl,
  documentId,
  token,
  fallbackFileName = "document.pdf",
}) => {
  const response = await fetch(`${downloadBaseUrl}${documentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = "Failed to download document";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `${errorMessage} (${response.status} ${response.statusText})`;
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new Error("The document is empty or unavailable. Please try again later.");
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const isPdfType =
    contentType.includes("application/pdf") ||
    contentType.includes("application/octet-stream") ||
    contentType.includes("binary/octet-stream");

  if (!isPdfType) {
    const isPdf = await looksLikePdf(blob);
    if (!isPdf) {
      let message =
        "The document is not available yet. Please contact support or try again later.";
      try {
        const parsed = JSON.parse(await blob.text());
        if (parsed?.message) message = parsed.message;
      } catch {
        // ignore parse errors; keep default message
      }
      throw new Error(message);
    }
  }

  const headerName = getFilenameFromContentDisposition(
    response.headers.get("content-disposition")
  );
  const fileName = headerName || fallbackFileName;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  return fileName;
};
