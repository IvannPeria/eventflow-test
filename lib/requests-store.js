import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "requests.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ requests: [] }, null, 2), "utf8");
  }
}

async function readAll() {
  try {
    await ensureStore();
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    const requests = Array.isArray(parsed?.requests) ? parsed.requests : [];
    return { requests };
  } catch (e) {
    console.error("Failed to read requests store:", e);
    return { requests: [] };
  }
}

async function writeAll(payload) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf8");
}

function normalizeSubmission(form) {
  const createdAt = new Date().toISOString();
  const id = `EF-${crypto.randomInt(1000, 9999)}`;

  return {
    id,
    createdAt,
    status: "In Review",
    applicant: {
      name: String(form?.contactName || "").trim(),
      email: String(form?.email || "").trim(),
    },
    organizer: {
      organization: String(form?.organization || "").trim(),
      phone: String(form?.phone || "").trim(),
      organizationType: String(form?.organizationType || "").trim(),
    },
    event: {
      name: String(form?.eventName || "").trim(),
      type: String(form?.eventType || "").trim(),
      date: String(form?.eventDate || "").trim(),
      startTime: String(form?.eventStartTime || "").trim(),
      endTime: String(form?.eventEndTime || "").trim(),
      venue: String(form?.venue || "").trim(),
      address: String(form?.address || "").trim(),
      attendance: String(form?.attendance || "").trim(),
    },
    systems: {
      technologies: Array.isArray(form?.technologies) ? form.technologies : [],
    },
    consents: {
      identity: Boolean(form?.consentIdentity),
      biometric: Boolean(form?.consentBiometric),
      privacy: Boolean(form?.consentPrivacy),
      security: Boolean(form?.consentSecurity),
    },
    notes: {
      specialRequirements: String(form?.specialRequirements || "").trim(),
      additionalNotes: String(form?.additionalNotes || "").trim(),
    },
  };
}

export async function listRequests() {
  const { requests } = await readAll();
  return requests.sort((a, b) => (b?.createdAt || "").localeCompare(a?.createdAt || ""));
}

export async function createRequest(form) {
  const next = normalizeSubmission(form);
  const { requests } = await readAll();
  await writeAll({ requests: [next, ...requests] });
  return next;
}

export async function getRequestById(id) {
  const { requests } = await readAll();
  return requests.find((r) => r.id === id) ?? null;
}

export async function updateRequestStatus(id, status) {
  const { requests } = await readAll();
  const next = requests.map((r) => (r.id === id ? { ...r, status } : r));
  await writeAll({ requests: next });
  return next.find((r) => r.id === id) ?? null;
}

