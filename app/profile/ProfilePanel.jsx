"use client";

import { useState } from "react";
import { Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export function ProfilePanel() {
  const [name, setName] = useState("Alex Rivera");
  const [email, setEmail] = useState("alex.rivera@eventflow.io");
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="glass-panel space-y-6 rounded-3xl border border-white/10 p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex size-20 items-center justify-center rounded-2xl border border-surface-tint/30 bg-surface-tint/10 font-heading text-2xl font-bold text-surface-tint">
          AR
        </div>
        <div>
          <h2 className="font-heading text-xl text-on-background">{name}</h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-on-surface-variant">
            <Mail className="size-4 text-surface-tint" aria-hidden />
            {email}
          </p>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200 ring-1 ring-emerald-400/25">
            <Shield className="size-3.5" aria-hidden />
            Verified operator
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Work email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      {saved ? (
        <p className="text-sm text-emerald-300" role="status">
          Changes saved locally for this demo.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="primary"
          onClick={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 3200);
          }}
        >
          Save profile
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          Security keys
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Security keys">
        <p className="text-sm leading-relaxed">
          Rotating keys invalidates active scanner nodes until they re-pair. In production this flow is backed by your
          identity provider.
        </p>
      </Modal>
    </div>
  );
}
