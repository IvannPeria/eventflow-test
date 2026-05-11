export async function POST(request) {
  try {
    const body = await request.json();
    const { name, studentId, image, eventId } = body;

    if (!name || !studentId || !image || !eventId) {
      return Response.json(
        { error: "name, studentId, eventId, and image are required." },
        { status: 400 }
      );
    }

    const FACE_API_URL = process.env.FACE_API_URL ?? "http://localhost:8000";

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    const formData = new FormData();
    formData.append("name",       name);
    formData.append("student_id", studentId);
    formData.append("event_id",   String(eventId));
    formData.append(
      "image",
      new Blob([imageBuffer], { type: "image/png" }),
      "capture.png"
    );

    const pythonRes = await fetch(
      `${FACE_API_URL}/api/register`,
      { method: "POST", body: formData }
    );

    const rawResponse = await pythonRes.text();
    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = { error: rawResponse || "Invalid response from face API." };
    }

    if (!pythonRes.ok) {
      return Response.json(
        { error: data.detail || data.error || "Registration failed." },
        { status: pythonRes.status }
      );
    }

    return Response.json(data, { status: 200 });

  } catch (err) {
    console.error("[face-register] Error:", err);
    return Response.json(
      { error: "Internal server error. Is the Python API running?" },
      { status: 500 }
    );
  }
}