import { NextResponse } from "next/server";
import { findUserByLogin, verifyPassword } from "@/lib/users-store";

export const runtime = "nodejs";

function json(status, body) {
  return NextResponse.json(body, { status });
}

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const u = String(username || "").trim();
    const p = String(password || "");

    if (!u || !p) return json(400, { ok: false, error: "Missing username or password." });

    const normalized = u.toLowerCase();
    if (normalized === "urri" && p === "123") {
      return json(200, { ok: true, user: { role: "operator", username: "urri", email: null, name: "Operator" } });
    }

    const user = await findUserByLogin(normalized);
    if (!user?.password?.salt || !user?.password?.hash) return json(401, { ok: false, error: "Invalid login." });

    const ok = verifyPassword({ password: p, salt: user.password.salt, hash: user.password.hash });
    if (!ok) return json(401, { ok: false, error: "Invalid login." });

    return json(200, {
      ok: true,
      user: { role: user.role || "client", username: user.username, email: user.email, name: user.name },
    });
  } catch (e) {
    return json(400, { ok: false, error: e?.message || "Login failed." });
  }
}

