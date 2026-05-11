"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEvents } from "@/lib/events-context";

const initial = {
  title: "",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  capacity: "",
  description: "",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1540575467063-027aef7f9e88?w=1200&q=80";

function toLocalIso(dateStr, timeStr) {
  if (!dateStr || !timeStr) return "";
  return `${dateStr}T${timeStr}:00`;
}

function validate(values, imageDataUrl) {
  const e = {};
  if (!values.title.trim()) e.title = "Title is required.";
  if (!values.date) e.date = "Start date is required.";
  if (!values.startTime) e.startTime = "Start time is required.";
  if (!values.endTime) e.endTime = "End time is required.";
  if (!values.location.trim()) e.location = "Location is required.";
  const cap = Number(values.capacity);
  if (!values.capacity.trim()) e.capacity = "Capacity is required.";
  else if (!Number.isFinite(cap) || cap < 1) e.capacity = "Enter a capacity of at least 1.";

  if (values.date && values.startTime && values.endTime) {
    const start = new Date(toLocalIso(values.date, values.startTime));
    const end = new Date(toLocalIso(values.date, values.endTime));
    if (end <= start) e.endTime = "End time must be after start time on this date.";
  }

  if (imageDataUrl && imageDataUrl.length > 2_500_000) {
    e.image = "Image is too large. Try a smaller file.";
  }
  return e;
}

export function NewEventForm() {
  const router = useRouter();
  const { addEvent } = useEvents();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [imageName, setImageName] = useState("");
  const fileRef = useRef(null);

  function handleChange(field) {
    return (ev) => {
      const v = ev.target.value;
      setValues((prev) => ({ ...prev, [field]: v }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function handleFile(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Please choose an image file." }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImageDataUrl(result);
      setImageName(file.name);
      setErrors((prev) => ({ ...prev, image: undefined }));
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageDataUrl(null);
    setImageName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const next = validate(values, imageDataUrl);
    setErrors(next);
    if (Object.keys(next).length) return;

    const startIso = toLocalIso(values.date, values.startTime);
    const endIso = toLocalIso(values.date, values.endTime);

    addEvent({
      title: values.title.trim(),
      date: startIso,
      endDate: endIso,
      location: values.location.trim(),
      capacity: Number(values.capacity),
      description: values.description.trim() || "No description provided.",
      image: imageDataUrl || DEFAULT_IMAGE,
    });
    router.push("/events");
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel space-y-6 rounded-3xl border border-white/10 p-6 sm:p-8" noValidate>
      <Input
        label="Event title"
        name="title"
        value={values.title}
        onChange={handleChange("title")}
        error={errors.title}
        placeholder="e.g. Nebula DevConf 2026"
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Start date"
          name="date"
          type="date"
          value={values.date}
          onChange={handleChange("date")}
          error={errors.date}
          required
        />
        <Input
          label="Start time"
          name="startTime"
          type="time"
          value={values.startTime}
          onChange={handleChange("startTime")}
          error={errors.startTime}
          required
        />
        <Input
          label="End time"
          name="endTime"
          type="time"
          value={values.endTime}
          onChange={handleChange("endTime")}
          error={errors.endTime}
          hint="Same day as start date."
          required
        />
      </div>
      <Input
        label="Venue / location"
        name="location"
        value={values.location}
        onChange={handleChange("location")}
        error={errors.location}
        placeholder="City, venue, or hybrid"
        required
      />
      <Input
        label="Capacity"
        name="capacity"
        inputMode="numeric"
        value={values.capacity}
        onChange={handleChange("capacity")}
        error={errors.capacity}
        placeholder="e.g. 1200"
        required
      />

      <div className="space-y-2">
        <span className="label-caps text-on-surface-variant block px-1 font-sans">Cover image</span>
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-surface-container-highest/50 px-4 py-3 font-heading text-sm font-medium text-on-background transition hover:border-surface-tint/40 hover:bg-white/5"
          >
            <ImagePlus className="size-5 text-surface-tint" aria-hidden />
            Add image
          </button>
          {imageName ? (
            <span className="truncate text-sm text-on-surface-variant">
              {imageName}
              <button type="button" className="ml-2 text-error hover:underline" onClick={clearImage}>
                Remove
              </button>
            </span>
          ) : (
            <span className="text-sm text-on-surface-variant/70">Optional — opens your file library.</span>
          )}
        </div>
        {errors.image ? <p className="px-1 text-xs text-error">{errors.image}</p> : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="label-caps text-on-surface-variant block px-1 font-sans">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={values.description}
          onChange={handleChange("description")}
          className="w-full rounded-lg border border-white/10 bg-surface-container-highest/40 px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 transition focus:border-surface-tint focus:outline-none focus:ring-2 focus:ring-surface-tint/30"
          placeholder="Agenda notes, access tiers, or compliance requirements."
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" variant="primary" size="lg" className="min-w-[140px]">
          Publish event
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => {
            setValues(initial);
            setErrors({});
            clearImage();
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
