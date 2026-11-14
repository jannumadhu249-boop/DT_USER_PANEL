// Shared mail helpers.
// Desktop handoff always happens through a plain `mailto:` link (the anchor
// navigates on its own); this module only adds a web-compose fallback for
// machines where no "mailto" handler is registered, so a click never ends in
// silence.

// Support address used by the top header contact block
export const CONTACT_EMAIL = "contact@dollartaxfiler.com";

// Time given to the OS mail client before the fallback opens
const FALLBACK_DELAY = 1500;

// Manual encoding: URLSearchParams writes spaces as "+", which mail clients
// render literally inside the body, so each value is encoded individually.
const buildQuery = (pairs) =>
  pairs
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

// Addresses are encoded one by one so a multiple-recipient list keeps its
// separating commas, which encodeURIComponent would otherwise escape.
const encodeAddresses = (value = "") =>
  String(value)
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean)
    .map((address) => encodeURIComponent(address))
    .join(",");

export const buildMailtoUrl = ({ to = "", subject = "", body = "" }) => {
  const query = buildQuery([
    ["subject", subject],
    ["body", body],
  ]);
  return `mailto:${encodeAddresses(to)}${query ? `?${query}` : ""}`;
};

// Web compose window used only when the desktop handler never launches.
// The raw address list is passed in: buildQuery encodes it once, so the result
// never contains a double-encoded value such as friend%2540example.com.
export const buildWebComposeUrl = ({ to = "", subject = "", body = "" }) => {
  const query = buildQuery([
    ["view", "cm"],
    ["fs", "1"],
    ["to", to],
    ["su", subject],
    ["body", body],
  ]);
  return `https://mail.google.com/mail/?${query}`;
};

// A desktop client opens outside the browser, so the page loses focus. If the
// page still has focus shortly after the click, no handler ran and the compose
// window is opened in the browser instead. A delayed window.open is treated as a
// popup by most browsers and may return null, so the blocked case is reported to
// the caller instead of failing silently. Returns the timer id for cleanup.
export const scheduleMailFallback = (
  { to = "", subject = "", body = "" },
  delay = FALLBACK_DELAY,
  onBlocked
) =>
  window.setTimeout(() => {
    if (!document.hasFocus()) return; // a desktop client already opened
    const composeUrl = buildWebComposeUrl({ to, subject, body });
    const composeWindow = window.open(composeUrl, "_blank", "noopener,noreferrer");
    if (!composeWindow && typeof onBlocked === "function") onBlocked(composeUrl);
  }, delay);
