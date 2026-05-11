/** Demo events for listing / detail routes */
export const mockEvents = [
  {
    id: "evt-main-hall",
    title: "Main Hall Summit 2026",
    date: "2026-06-12T09:00:00",
    endDate: "2026-06-14T18:00:00",
    location: "Javits Center, New York, NY",
    image:
      "https://images.unsplash.com/photo-1540575467063-027aef7f9e88?w=1200&q=80",
    description:
      "Enterprise keynotes, breakout tracks, and RFID-backed access across all halls. Live occupancy and VIP lanes enabled.",
    capacity: 1200,
    registered: 842,
    status: "live",
  },
  {
    id: "evt-nebula-conf",
    title: "Nebula DevConf",
    date: "2026-07-03T08:30:00",
    endDate: "2026-07-05T17:00:00",
    location: "Moscone West, San Francisco, CA",
    image:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80",
    description:
      "Developer community conference with multi-track scanning nodes and automated certificate generation.",
    capacity: 3500,
    registered: 2180,
    status: "upcoming",
  },
  {
    id: "evt-atlas-gala",
    title: "Atlas Charity Gala",
    date: "2026-05-22T18:00:00",
    endDate: "2026-05-22T23:30:00",
    location: "Riverfront Hall, Austin, TX",
    image:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80",
    description:
      "Black-tie fundraiser with biometric check-in and premium pass routing for donors and partners.",
    capacity: 600,
    registered: 412,
    status: "upcoming",
  },
  {
    id: "evt-horizon-retreat",
    title: "Horizon Leadership Retreat",
    date: "2026-04-18T10:00:00",
    endDate: "2026-04-20T16:00:00",
    location: "Aspen Ridge Lodge, CO",
    image:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&q=80",
    description:
      "Closed executive sessions with on-site scanning kits and offline-capable attendance logging.",
    capacity: 120,
    registered: 118,
    status: "past",
  },
];

export function getEventById(id) {
  return mockEvents.find((e) => e.id === id) ?? null;
}
