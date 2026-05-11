import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function requireSupabaseConfig() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).");
  }
}

function createSupabaseClient() {
  requireSupabaseConfig();
  return createClient(supabaseUrl, supabaseKey);
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toTextOrNull(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

function buildAdditionalNotes(form) {
  return [form?.specialRequirements, form?.additionalNotes]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join("\n\n") || null;
}

function buildSystemFlags(form) {
  const technologies = Array.isArray(form?.technologies) ? form.technologies : [];
  return {
    rfid_attendance_tracking: technologies.includes("rfid"),
    facial_recognition_system: technologies.includes("face"),
    geofencing_location_monitoring: technologies.includes("geo"),
    realtime_staff_tracking: technologies.includes("live"),
    identity_verification_requirement: Boolean(form?.consentIdentity),
    biometric_consent_agreement: Boolean(form?.consentBiometric),
    data_privacy_acknowledgment: Boolean(form?.consentPrivacy),
    security_compliance_confirmation: Boolean(form?.consentSecurity),
    additional_notes: buildAdditionalNotes(form),
  };
}

function buildRequestRecord(form, eventRow, clientRow, activationRow) {
  const technologies = Array.isArray(form?.technologies) ? form.technologies : [];

  return {
    id: `HD-${String(eventRow?.event_id ?? "0000")}`,
    createdAt: new Date().toISOString(),
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
      technologies,
      activationId: activationRow?.activation_id ?? null,
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
    database: {
      eventId: eventRow?.event_id ?? null,
      clientId: clientRow?.client_id ?? null,
      activationId: activationRow?.activation_id ?? null,
    },
  };
}

async function rollbackSubmission(client, eventId, clientId) {
  if (eventId !== null && eventId !== undefined) {
    await client.from("events").delete().eq("event_id", eventId);
  }
  if (clientId !== null && clientId !== undefined) {
    await client.from("clients").delete().eq("client_id", clientId);
  }
}

export async function saveHiringDetailsSubmission(form) {
  const client = createSupabaseClient();

  const eventPayload = {
    event_name: String(form?.eventName || "").trim(),
    event_type: toTextOrNull(form?.eventType),
    expected_attendance: toNumberOrNull(form?.attendance),
    event_date: toTextOrNull(form?.eventDate),
    start_time: toTextOrNull(form?.eventStartTime),
    end_time: toTextOrNull(form?.eventEndTime),
    venue_name: toTextOrNull(form?.venue),
    full_address: toTextOrNull(form?.address),
  };

  const clientPayload = {
    organization_name: toTextOrNull(form?.organization),
    contact_full_name: toTextOrNull(form?.contactName),
    email_address: toTextOrNull(form?.email),
    phone_number: toTextOrNull(form?.phone),
    organization_type: toTextOrNull(form?.organizationType),
  };

  const eventInsert = await client.from("events").insert(eventPayload).select("event_id,event_name").single();
  if (eventInsert.error) {
    throw new Error(`events insert failed: ${eventInsert.error.message}`);
  }

  const clientInsert = await client.from("clients").insert(clientPayload).select("client_id").single();
  if (clientInsert.error) {
    await rollbackSubmission(client, eventInsert.data.event_id, null);
    throw new Error(`clients insert failed: ${clientInsert.error.message}`);
  }

  const junctionInsert = await client.from("event_clients").insert({
    event_id: eventInsert.data.event_id,
    client_id: clientInsert.data.client_id,
  });
  if (junctionInsert.error) {
    await rollbackSubmission(client, eventInsert.data.event_id, clientInsert.data.client_id);
    throw new Error(`event_clients insert failed: ${junctionInsert.error.message}`);
  }

  const activationInsert = await client.from("system_activation").insert({
    event_id: eventInsert.data.event_id,
    ...buildSystemFlags(form),
  }).select("activation_id").single();
  if (activationInsert.error) {
    await rollbackSubmission(client, eventInsert.data.event_id, clientInsert.data.client_id);
    throw new Error(`system_activation insert failed: ${activationInsert.error.message}`);
  }

  return {
    event: eventInsert.data,
    client: clientInsert.data,
    activation: activationInsert.data,
    request: buildRequestRecord(form, eventInsert.data, clientInsert.data, activationInsert.data),
  };
}
