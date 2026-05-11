/** @typedef {'overview' | 'attendance' | 'participants' | 'analytics'} OperationsPanel */

/** @type {OperationsPanel[]} */
export const OPERATIONS_PANELS = ["overview", "attendance", "participants", "analytics"];

/**
 * @param {string | null} raw
 * @returns {OperationsPanel}
 */
export function parseOperationsPanel(raw) {
  const v = raw?.toLowerCase() ?? "";
  return OPERATIONS_PANELS.includes(v) ? /** @type {OperationsPanel} */ (v) : "overview";
}

/**
 * @param {OperationsPanel} panel
 * @returns {string}
 */
export function operationsHref(panel) {
  return panel === "overview" ? "/dashboard" : `/dashboard?panel=${panel}`;
}
