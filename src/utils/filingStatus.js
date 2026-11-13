
export const FILE_STATUS_MAP = {
  RGO: { stage: 0, label: "Registered Users", shortLabel: "Intake" },
  SP: { stage: 0, label: "Scheduling Pending", shortLabel: "Intake" },
  BIP: { stage: 0, label: "Information Pending", shortLabel: "Intake" },
  IP: { stage: 0, label: "Interview Pending", shortLabel: "Intake" },
  DP: { stage: 1, label: "Documents Pending", shortLabel: "Documents" },
  PP_I: { stage: 2, label: "Preparation - 1", shortLabel: "Preparation" },
  PP_II: { stage: 2, label: "Preparation - 2", shortLabel: "Preparation" },
  ITIN: { stage: 3, label: "ITIN Files", shortLabel: "Review" },
  RE_ES: { stage: 2, label: "Revised Estimate", shortLabel: "Preparation" },
  TR_S_I: { stage: 3, label: "Review & Summary 1", shortLabel: "Review" },
  TR_S_II: { stage: 3, label: "Review & Summary 2", shortLabel: "Review" },
  PP_EF: { stage: 3, label: "Payment Pending - Efiling", shortLabel: "Review" },
  PP_PF: { stage: 3, label: "Payment Pending - Paper filing", shortLabel: "Review" },
  FPR: { stage: 4, label: "Fee Payment Received - I", shortLabel: "Payment Done" },
  FPR_II: { stage: 4, label: "Fee Payment Received - II", shortLabel: "Payment Done" },
  CR_EF: { stage: 3, label: "Client Review - Efiling", shortLabel: "Review" },
  CR_PF: { stage: 3, label: "Client Review - Paper Filing", shortLabel: "Review" },
  EFP_I: { stage: 4, label: "Efiling Pending - 1", shortLabel: "Filing" },
  EFP_II: { stage: 4, label: "Efiling Pending - 2", shortLabel: "Filing" },
  PF_P: { stage: 4, label: "Paper Filing Pending", shortLabel: "Filing" },
  EF_AA_I: { stage: 4, label: "E - Filed & Awaiting Acceptance - 1", shortLabel: "Filing" },
  EF_AA_II: { stage: 4, label: "E - Filed & Awaiting Acceptance - 2", shortLabel: "Filing" },
  EF_REJ: { stage: 4, label: "E - Filed & Rejected", shortLabel: "Filing" },
  C_R: { stage: 4, label: "City Return", shortLabel: "Filing" },
  EFA_FC: { stage: 5, label: "E-Filing Accepted & Filing Complete", shortLabel: "Completed" },
  PF_D: { stage: 5, label: "Paper Filing Done", shortLabel: "Completed" },
  CANC: { stage: -1, label: "Cancelled", shortLabel: "Cancelled" },
};

// ── Journey progress states ──────────────────────────────────────────────
// Every stage of the client dashboard journey resolves to exactly one of these.
export const PROGRESS_STATE = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

export const PROGRESS_STATE_LABELS = {
  [PROGRESS_STATE.PENDING]: "Pending",
  [PROGRESS_STATE.IN_PROGRESS]: "In Progress",
  [PROGRESS_STATE.COMPLETED]: "Completed",
};

// ── Status alias catalogue ───────────────────────────────────────────────
// The API may return a short code, a slug or the display label. Every known
// spelling resolves to one canonical workflow code so the progress logic never
// has to guess. Keys are normalised before lookup (case, separators, punctuation).
const STATUS_ALIASES = {
  RGO: ["registered users", "registered user", "registered", "registration", "new registration"],
  SP: ["scheduling pending", "schedule pending", "interview scheduled", "scheduled"],
  BIP: ["information pending", "basic information pending", "basic info pending"],
  IP: ["interview pending", "interview"],
  DP: [
    "documents pending",
    "document pending",
    "docs pending",
    "document upload pending",
    "documents upload pending",
  ],
  PP_I: ["preparation - 1", "preparation-1", "preparation 1", "prep - 1", "prep 1", "preparation i"],
  PP_II: ["preparation - 2", "preparation-2", "preparation 2", "prep - 2", "prep 2", "preparation ii"],
  TR_S_I: ["review & summary 1", "review & summary - 1", "review and summary 1", "review and summary 1"],
  TR_S_II: ["review & summary 2", "review & summary - 2", "review and summary 2", "review and summary 2"],
  ITIN: ["itin files", "itin file", "itin"],
  RE_ES: ["revised estimate", "revised estimates"],
  PP_EF: [
    "payment pending - efiling",
    "payment pending - e-filing",
    "payment pending efiling",
    "payment pending e filing",
  ],
  PP_PF: ["payment pending - paper filing", "payment pending paper filing"],
  FPR: [
    "fee payment received - 1",
    "fee payment received - i",
    "fee payment received 1",
    "fee payment received i",
  ],
  FPR_II: [
    "fee payment received - 2",
    "fee payment received - ii",
    "fee payment received 2",
    "fee payment received ii",
  ],
  CR_EF: [
    "client review - efiling",
    "client review - e-filing",
    "client review efiling",
    "client review e filing",
  ],
  CR_PF: ["client review - paper filing", "client review paper filing"],
  EFP_I: ["efiling pending - 1", "e-filing pending - 1", "efiling pending 1", "e-filing pending 1", "e filing pending 1"],
  EFP_II: ["efiling pending - 2", "e-filing pending - 2", "efiling pending 2", "e-filing pending 2", "e filing pending 2"],
  EF_AA_I: [
    "e-filed & awaiting acceptance - 1",
    "e-filed and awaiting acceptance - 1",
    "e-filed & awaiting acceptance 1",
    "e-filed and awaiting acceptance 1",
    "e-filed awaiting acceptance - 1",
    "e-filed awaiting acceptance 1",
    "efiled & awaiting acceptance - 1",
  ],
  EF_AA_II: [
    "e-filed & awaiting acceptance - 2",
    "e-filed and awaiting acceptance - 2",
    "e-filed & awaiting acceptance 2",
    "e-filed and awaiting acceptance 2",
    "e-filed awaiting acceptance - 2",
    "e-filed awaiting acceptance 2",
    "efiled & awaiting acceptance - 2",
  ],
  EF_REJ: [
    "e-filed & rejected",
    "e-filed and rejected",
    "efiled & rejected",
    "e-filing rejected",
    "efiling rejected",
  ],
  C_R: ["city return", "city returns"],
  EFA_FC: [
    "e-filing accepted & complete",
    "e-filing accepted and complete",
    "efiling accepted & complete",
    "e-filing accepted & filing complete",
    "efiling accepted & filing complete",
  ],
  PF_P: ["paper filing pending"],
  PF_D: ["paper filing done", "paper filing completed"],
  CANC: ["cancelled", "canceled", "cancel"],
};

/**
 * Normalise any raw status value (code, slug or label) so the same status
 * always produces the same lookup key.
 */
export const normalizeStatusKey = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
};

// Build the canonical lookup table once at module load.
const STATUS_LOOKUP = (() => {
  const lookup = {};
  const add = (value, code) => {
    const key = normalizeStatusKey(value);
    if (key && !lookup[key]) lookup[key] = code;
  };
  Object.entries(FILE_STATUS_MAP).forEach(([code, meta]) => {
    add(code, code);
    add(meta.label, code);
    (STATUS_ALIASES[code] || []).forEach((alias) => add(alias, code));
  });
  return lookup;
})();

/**
 * Resolve a raw code or label into a canonical FILE_STATUS_MAP code.
 * Returns an empty string when the value cannot be recognised.
 */
export const getCanonicalStatusCode = (code, name) => {
  const codeKey = normalizeStatusKey(code).replace(/ /g, "_").toUpperCase();
  if (codeKey && FILE_STATUS_MAP[codeKey]) return codeKey;

  const fromCode = STATUS_LOOKUP[normalizeStatusKey(code)];
  if (fromCode) return fromCode;

  return STATUS_LOOKUP[normalizeStatusKey(name)] || "";
};

export const FILING_PHASES = [
  { stage: 0, label: "Intake", color: "#6366F1" },
  { stage: 1, label: "Documents", color: "#F59E0B" },
  { stage: 2, label: "Preparation", color: "#8B5CF6" },
  { stage: 3, label: "Review", color: "#0EA5E9" },
  { stage: 4, label: "Filing", color: "#EF4C23" },
  { stage: 5, label: "Completed", color: "#0D9488" },
];

export const STATUS_NAME_TO_CODE = {
  "registered users": "RGO",
  registered: "RGO",
  "scheduling pending": "SP",
  "interview scheduled": "SP",
  "scheduled": "SP",
  "information pending": "BIP",
  "basic information pending": "BIP",
  "interview pending": "IP",
  "documents pending": "DP",
  "document pending": "DP",
  "preparation - 1": "PP_I",
  "preparation 1": "PP_I",
  "preparation - 2": "PP_II",
  "preparation 2": "PP_II",
  "review & summary 1": "TR_S_I",
  "review & summary - 1": "TR_S_I",
  "review & summary 2": "TR_S_II",
  "review & summary - 2": "TR_S_II",
  "itin files": "ITIN",
  itin: "ITIN",
  "revised estimate": "RE_ES",
  "payment pending - efiling": "PP_EF",
  "payment pending efiling": "PP_EF",
  "payment pending - paper filing": "PP_PF",
  "payment pending paper filing": "PP_PF",
  "fee payment received - i": "FPR",
  "fee payment received 1": "FPR",
  "fee payment received - 1": "FPR",
  "fee payment received - ii": "FPR_II",
  "fee payment received 2": "FPR_II",
  "fee payment received - 2": "FPR_II",
  "client review - efiling": "CR_EF",
  "client review efiling": "CR_EF",
  "client review - paper filing": "CR_PF",
  "client review paper filing": "CR_PF",
  "efiling pending - 1": "EFP_I",
  "efiling pending 1": "EFP_I",
  "efiling pending - 2": "EFP_II",
  "efiling pending 2": "EFP_II",
  "e - filed & awaiting acceptance - 1": "EF_AA_I",
  "e-filed & awaiting acceptance - 1": "EF_AA_I",
  "e-filed and awaiting acceptance 1": "EF_AA_I",
  "e - filed & awaiting acceptance - 2": "EF_AA_II",
  "e-filed & awaiting acceptance - 2": "EF_AA_II",
  "e - filed & rejected": "EF_REJ",
  "city return": "C_R",
  "e-filing accepted & filing complete": "EFA_FC",
  "efiling accepted & filing complete": "EFA_FC",
  "paper filing pending": "PF_P",
  "paper filing done": "PF_D",
  cancelled: "CANC",
};

export const getStatusesByStage = (stage) =>
  Object.entries(FILE_STATUS_MAP)
    .filter(([, meta]) => meta.stage === stage)
    .map(([code, meta]) => ({ code, ...meta }));

export const resolveFilingStatusInfo = ({
  fileStatusCode = "",
  fileStatusName = "",
}) => {
  const code = fileStatusCode.toUpperCase().trim();

  if (code && FILE_STATUS_MAP[code]) {
    return {
      ...FILE_STATUS_MAP[code],
      code,
      name: fileStatusName || FILE_STATUS_MAP[code].label,
    };
  }

  const norm = (fileStatusName || "").toLowerCase().trim();
  const mappedCode =
    STATUS_NAME_TO_CODE[norm] || STATUS_LOOKUP[normalizeStatusKey(fileStatusName)];
  if (mappedCode && FILE_STATUS_MAP[mappedCode]) {
    return {
      ...FILE_STATUS_MAP[mappedCode],
      code: mappedCode,
      name: fileStatusName,
    };
  }

  if (norm.includes("complete") || norm.includes("accepted") || norm.includes("paper filing done")) {
    return { stage: 5, label: fileStatusName, shortLabel: "Completed", code: "EFA_FC", name: fileStatusName };
  }
  if (
    norm.includes("filed") ||
    norm.includes("efiling") ||
    norm.includes("awaiting acceptance") ||
    norm.includes("city return")
  ) {
    return { stage: 4, label: fileStatusName, shortLabel: "Filing", code: "EFP_I", name: fileStatusName };
  }
  if (norm.includes("review") || norm.includes("summary") || norm.includes("payment") || norm.includes("fee")) {
    return { stage: 3, label: fileStatusName, shortLabel: "Review", code: "TR_S_I", name: fileStatusName };
  }
  if (norm.includes("preparation") || norm.includes("estimate") || norm.includes("itin")) {
    return { stage: 2, label: fileStatusName, shortLabel: "Preparation", code: "PP_I", name: fileStatusName };
  }
  if (norm.includes("document") || norm.includes("upload")) {
    return { stage: 1, label: fileStatusName, shortLabel: "Documents", code: "DP", name: fileStatusName };
  }
  if (norm.includes("schedul") || norm.includes("interview")) {
    return { stage: 1, label: fileStatusName, shortLabel: "Scheduled", code: "SP", name: fileStatusName };
  }

  return {
    stage: 0,
    label: fileStatusName || "Registered Users",
    shortLabel: "Intake",
    code: "RGO",
    name: fileStatusName || "Registered Users",
  };
};

export const FILE_STATUS_PIPELINE = [
  { code: "RGO", label: "Registered Users" },
  { code: "SP", label: "Scheduling Pending" },
  { code: "BIP", label: "Information Pending" },
  { code: "IP", label: "Interview Pending" },
  { code: "DP", label: "Documents Pending" },
  { code: "PP_I", label: "Preparation - 1" },
  { code: "PP_II", label: "Preparation - 2" },
  { code: "TR_S_I", label: "Review & Summary 1" },
  { code: "TR_S_II", label: "Review & Summary 2" },
  { code: "ITIN", label: "ITIN Files" },
  { code: "RE_ES", label: "Revised Estimate" },
  { code: "PP_EF", label: "Payment Pending - Efiling" },
  { code: "PP_PF", label: "Payment Pending - Paper filing" },
  { code: "FPR", label: "Fee Payment Received - I" },
  { code: "FPR_II", label: "Fee Payment Received - II" },
  { code: "CR_EF", label: "Client Review - Efiling" },
  { code: "CR_PF", label: "Client Review - Paper Filing" },
  { code: "EFP_I", label: "Efiling Pending - 1" },
  { code: "EFP_II", label: "Efiling Pending - 2" },
  { code: "EF_AA_I", label: "E - Filed & Awaiting Acceptance - 1" },
  { code: "EF_AA_II", label: "E - Filed & Awaiting Acceptance - 2" },
  { code: "EF_REJ", label: "E - Filed & Rejected" },
  { code: "C_R", label: "City Return" },
  { code: "EFA_FC", label: "E-Filing Accepted & Filing Complete" },
  { code: "PF_P", label: "Paper Filing Pending" },
  { code: "PF_D", label: "Paper Filing Done" },
  { code: "CANC", label: "Cancelled" },
];

export const getPipelineIndex = (code) => {
  if (!code) return 0;
  const normalized = code.toUpperCase().trim();
  const index = FILE_STATUS_PIPELINE.findIndex((item) => item.code === normalized);
  return index >= 0 ? index : 0;
};

export const getPipelineProgressPercentage = (code) => {
  if (FILE_STATUS_PIPELINE.length <= 1) return 0;
  const index = getPipelineIndex(code);
  return Math.min(100, Math.round((index / (FILE_STATUS_PIPELINE.length - 1)) * 100));
};

export const getStageProgressPercentage = (stage) => {
  if (stage < 0) return 0;
  return Math.min(100, Math.round((stage / 5) * 100));
};

// Calculate detailed progress including sub-stages within each main stage
export const getDetailedStageProgress = (code) => {
  if (!code) return { stage: 0, subProgress: 0, overallProgress: 0 };
  
  const pipelineIndex = getPipelineIndex(code);
  const statusInfo = FILE_STATUS_MAP[code];
  
  if (!statusInfo) return { stage: 0, subProgress: 0, overallProgress: 0 };
  
  const stage = statusInfo.stage;
  
  // Get all statuses in this stage
  const statusesInStage = Object.entries(FILE_STATUS_MAP)
    .filter(([, meta]) => meta.stage === stage)
    .map(([statusCode]) => statusCode);
  
  // Find position within the stage by looking at pipeline order
  const stageStatuses = FILE_STATUS_PIPELINE
    .filter(item => FILE_STATUS_MAP[item.code]?.stage === stage)
    .map(item => item.code);
  
  const positionInStage = stageStatuses.indexOf(code);
  const totalInStage = stageStatuses.length;
  
  // Calculate sub-progress within the stage (0 to 1)
  const subProgress = totalInStage > 0 ? positionInStage / totalInStage : 0;
  
  // Calculate overall progress across all stages (0 to 6)
  // Stage represents the main milestone, subProgress adds granularity
  const overallProgress = stage + subProgress;
  
  return {
    stage,
    subProgress,
    overallProgress,
    pipelineIndex,
    totalStatuses: FILE_STATUS_PIPELINE.length
  };
};

// ── Journey stage mapping ────────────────────────────────────────────────
// The six dashboard milestones. Each one is derived independently from the
// taxpayer record, the uploaded documents and the current file status.
export const JOURNEY_STEPS = [
  { key: "clientInfo", label: "Client info" },
  { key: "documents", label: "Documents" },
  { key: "taxPreparation", label: "Tax Preparation" },
  { key: "clientReview", label: "Client Review" },
  { key: "returnFiled", label: "Return Filed" },
  { key: "irsAcceptance", label: "IRS Acceptance" },
];

/**
 * Position of a canonical status inside the filing workflow pipeline.
 * Returns -1 when the status is unknown / missing so callers can fall back to
 * the safest (Pending) state instead of assuming a stage.
 */
export const getWorkflowIndex = (code) => {
  if (!code) return -1;
  const normalized = String(code).toUpperCase().trim();
  // Cancelled is not part of the filing journey, so it never advances a stage.
  if (normalized === "CANC") return -1;
  return FILE_STATUS_PIPELINE.findIndex((item) => item.code === normalized);
};

const workflowIndex = (code) => FILE_STATUS_PIPELINE.findIndex((item) => item.code === code);

const resolveStageState = (currentIndex, inProgressCode, completedCode) => {
  if (currentIndex < 0) return PROGRESS_STATE.PENDING;
  if (completedCode && currentIndex >= workflowIndex(completedCode)) return PROGRESS_STATE.COMPLETED;
  if (inProgressCode && currentIndex >= workflowIndex(inProgressCode)) return PROGRESS_STATE.IN_PROGRESS;
  return PROGRESS_STATE.PENDING;
};

/**
 * Workflow boundaries (see FILE_STATUS_PIPELINE ordering):
 *   Tax Preparation → In Progress from Preparation-1, Completed from Payment Pending
 *   Client Review   → In Progress from Client Review, Completed from E-Filing Pending-1
 *   Return Filed    → In Progress from E-Filed & Awaiting Acceptance, Completed from City Return
 *   IRS Acceptance  → Completed from City Return onwards
 */
export const getFilingStageProgress = (code) => {
  const index = getWorkflowIndex(code);
  return {
    taxPreparation: resolveStageState(index, "PP_I", "PP_EF"),
    clientReview: resolveStageState(index, "CR_EF", "EFP_I"),
    returnFiled: resolveStageState(index, "EF_AA_I", "C_R"),
    irsAcceptance: resolveStageState(index, null, "C_R"),
  };
};

/**
 * Resolve the state of all six journey milestones.
 * Client info and Documents only depend on their own submission data, every
 * other milestone depends solely on the current file status.
 */
export const getJourneyStepStates = ({
  fileStatusCode = "",
  taxpayerCompleted = false,
  documentsCompleted = false,
} = {}) => {
  const filing = getFilingStageProgress(fileStatusCode);
  const states = {
    clientInfo: taxpayerCompleted ? PROGRESS_STATE.COMPLETED : PROGRESS_STATE.PENDING,
    documents: documentsCompleted ? PROGRESS_STATE.COMPLETED : PROGRESS_STATE.PENDING,
    taxPreparation: filing.taxPreparation,
    clientReview: filing.clientReview,
    returnFiled: filing.returnFiled,
    irsAcceptance: filing.irsAcceptance,
  };

  return JOURNEY_STEPS.map((step) => {
    const state = states[step.key] || PROGRESS_STATE.PENDING;
    return { ...step, state, statusLabel: PROGRESS_STATE_LABELS[state] };
  });
};

// ── Payload helpers ──────────────────────────────────────────────────────
const firstTextValue = (values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

/**
 * Resolve the current file status from the dashboard, member and profile
 * payloads into one canonical code + label. Unknown values fall back to the
 * default "Registered Users" status.
 */
export const resolveFileStatus = ({ header, dashboardData, user } = {}) => {
  const member = dashboardData?.member;
  const headerFileStatus = header?.file_status;
  const dashboardFileStatus = dashboardData?.file_status;
  const memberFileStatus = member?.file_status;
  const userFileStatus = user?.file_status;

  const rawCode = firstTextValue([
    header?.file_status_code,
    typeof headerFileStatus === "object" ? headerFileStatus?.code : "",
    header?.file_status_id,
    dashboardData?.file_status_code,
    typeof dashboardFileStatus === "object" ? dashboardFileStatus?.code : "",
    dashboardData?.file_status_id,
    member?.file_status_code,
    typeof memberFileStatus === "object" ? memberFileStatus?.code : "",
    typeof userFileStatus === "object" ? userFileStatus?.code : "",
  ]);

  const rawName = firstTextValue([
    header?.file_status_name,
    typeof headerFileStatus === "string" ? headerFileStatus : headerFileStatus?.name,
    dashboardData?.file_status_name,
    typeof dashboardFileStatus === "string" ? dashboardFileStatus : dashboardFileStatus?.name,
    member?.file_status_name,
    typeof memberFileStatus === "string" ? memberFileStatus : memberFileStatus?.name,
    dashboardData?.filing?.status,
    typeof userFileStatus === "string" ? userFileStatus : userFileStatus?.name,
  ]);

  const canonicalCode = getCanonicalStatusCode(rawCode, rawName);
  const info = resolveFilingStatusInfo({
    fileStatusCode: canonicalCode || rawCode,
    fileStatusName: rawName,
  });

  return {
    code: canonicalCode || info.code,
    name: rawName || info.label,
    info,
  };
};

// Fields that are only present once the taxpayer form has actually been
// submitted. Registration alone (name / email / phone) never sets these.
const TAXPAYER_SUBMISSION_FIELDS = [
  "ssn_tin",
  "ssn_itin",
  "date_of_birth",
  "occupation",
  "mailing_address",
  "street_address",
  "zipcode",
  "visa_type",
  "date_of_marriage",
];

const hasValue = (value) =>
  (typeof value === "string" && value.trim().length > 0) || typeof value === "number";

const pickTaxpayerRecord = (value) => {
  if (Array.isArray(value)) return value.find((item) => item && typeof item === "object") || null;
  if (value && typeof value === "object") {
    const nested = value.taxpayer;
    if (nested && typeof nested === "object") return nested;
    return value;
  }
  return null;
};

/**
 * True only when actual taxpayer information has been submitted. Spouse,
 * dependent or any other record never satisfies this check.
 */
export const hasSubmittedTaxpayerInfo = (value) => {
  const record = pickTaxpayerRecord(value);
  if (!record) return false;
  return TAXPAYER_SUBMISSION_FIELDS.some((field) => hasValue(record[field]));
};

/**
 * True as soon as at least one document has been uploaded successfully.
 * All documents do not need to be uploaded for the stage to be completed.
 */
export const hasUploadedDocuments = (...sources) => {
  for (const source of sources) {
    if (!source) continue;
    if (Array.isArray(source)) {
      if (source.length > 0) return true;
      continue;
    }
    if (typeof source !== "object") continue;

    if (Array.isArray(source.documents) && source.documents.length > 0) return true;
    if (Array.isArray(source.uploaded_documents) && source.uploaded_documents.length > 0) return true;
    if (Array.isArray(source.document_uploads) && source.document_uploads.length > 0) return true;
    if (Number(source.count) > 0) return true;
  }
  return false;
};
