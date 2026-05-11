import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, MapPin, Trash2, Users } from "lucide-react";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeRange(startIso, endIso) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const t = { hour: "2-digit", minute: "2-digit" };
  return `${s.toLocaleTimeString(undefined, t)} – ${e.toLocaleTimeString(undefined, t)}`;
}

const statusStyles = {
  live: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30",
  upcoming: "bg-surface-tint/15 text-surface-tint ring-1 ring-surface-tint/25",
  past: "bg-white/5 text-on-surface-variant ring-1 ring-white/10",
};

export function EventCard({ event, onRemove }) {
  const { id, title, date, endDate, location, image, capacity, registered, status } = event;
  const isDataImage = typeof image === "string" && image.startsWith("data:");

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-surface-container-low/30 glass-panel transition duration-300 hover:-translate-y-1 hover:border-surface-tint/25 hover:shadow-[0_0_24px_rgba(81,153,245,0.12)]">
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 text-on-surface-variant backdrop-blur-md transition hover:border-error/40 hover:bg-error/10 hover:text-error"
          aria-label={`Remove ${title}`}
        >
          <Trash2 className="size-4" />
        </button>
      ) : null}
      <Link href={`/events/${id}`} className="relative aspect-[16/10] w-full overflow-hidden">
        {isDataImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URLs from uploads
          <img src={image} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
          />
        )}
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-widest ${statusStyles[status] ?? statusStyles.upcoming}`}
        >
          {status}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <Link href={`/events/${id}`} className="block pr-2">
          <h2 className="font-heading text-xl font-semibold text-on-background transition group-hover:text-surface-tint">
            {title}
          </h2>
        </Link>
        <div className="mt-4 space-y-2 text-sm text-on-surface-variant">
          <p className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0 text-surface-tint/80" aria-hidden />
            <time dateTime={date}>{formatDate(date)}</time>
          </p>
          <p className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-surface-tint/80" aria-hidden />
            <span>{formatTimeRange(date, endDate)}</span>
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-surface-tint/80" aria-hidden />
            <span>{location}</span>
          </p>
          <p className="flex items-center gap-2">
            <Users className="size-4 shrink-0 text-surface-tint/80" aria-hidden />
            <span>
              {registered.toLocaleString()} / {capacity.toLocaleString()} registered
            </span>
          </p>
        </div>
        <div className="mt-6">
          <Link
            href={`/events/${id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-tint/30 px-4 py-2 font-heading text-xs font-semibold uppercase tracking-widest text-surface-tint transition hover:bg-surface-tint/10"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
