/**
 * Frontend DTOs aligned with a future REST API.
 *
 * Planned endpoints (not implemented here):
 * - GET  /api/events
 * - POST /api/events
 * - POST /api/attendance/sessions/{eventId}/rfid-scan
 * - POST /api/attendance/sessions/{eventId}/face-verify
 * - GET  /api/attendance/logs?eventId=&limit=
 *
 * @typedef {Object} AttendanceLogEntryDto
 * @property {string} id
 * @property {string} eventId
 * @property {string} eventTitle
 * @property {string} attendeeName
 * @property {string} rfidTag
 * @property {string} timestamp ISO 8601
 * @property {'approved'|'rejected'} decision
 * @property {'rfid'|'face'|'complete'} lastStage
 */

export {};
