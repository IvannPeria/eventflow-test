import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ users: [] }, null, 2), "utf8");
  }
}

async function readAll() {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw || "{}");
  return { users: Array.isArray(parsed?.users) ? parsed.users : [] };
}

async function writeAll(payload) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf8");
}

export function generateMax6Password() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%&*";
  const all = `${letters}${numbers}${symbols}`;

  const pick = (charset) => charset[crypto.randomInt(0, charset.length)];
  const out = [pick(letters), pick(numbers), pick(symbols), pick(all), pick(all), pick(all)];

  for (let i = out.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join("");
}

function hashPassword(password, salt) {
  const derived = crypto.scryptSync(password, salt, 32);
  return derived.toString("hex");
}

export function verifyPassword({ password, salt, hash }) {
  try {
    const next = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(next, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

export async function findUserByLogin(login) {
  const q = String(login || "").trim().toLowerCase();
  if (!q) return null;
  const { users } = await readAll();
  return users.find((u) => u?.email?.toLowerCase() === q || u?.username?.toLowerCase() === q) ?? null;
}

export async function upsertClientUser({ email, name }) {
  const safeEmail = String(email || "").trim().toLowerCase();
  if (!safeEmail) throw new Error("Missing applicant email.");

  const { users } = await readAll();
  const existing = users.find((u) => u?.email?.toLowerCase() === safeEmail) ?? null;

  // Always (re)issue a fresh 6-char password on booking confirmation
  const password = generateMax6Password();
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);

  if (existing) {
    const updated = {
      ...existing,
      role: existing.role || "client",
      name: String(name || "").trim() || existing.name || null,
      password: { salt, hash, algorithm: "scrypt", v: 1 },
      updatedAt: new Date().toISOString(),
    };
    const nextUsers = users.map((u) => (u?.email?.toLowerCase() === safeEmail ? updated : u));
    await writeAll({ users: nextUsers });
    return { user: updated, created: false, password };
  }

  const next = {
    id: `usr-${crypto.randomInt(100000, 999999)}`,
    role: "client",
    email: safeEmail,
    username: safeEmail,
    name: String(name || "").trim() || null,
    password: { salt, hash, algorithm: "scrypt", v: 1 },
    createdAt: new Date().toISOString(),
  };

  await writeAll({ users: [next, ...users] });
  return { user: next, created: true, password };
}

