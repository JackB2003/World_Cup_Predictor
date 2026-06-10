"use client";

import { Check, X } from "lucide-react";

export function ResultIcon({ hit }: { hit: boolean }) {
  return (
    <span
      className={`w-[22px] h-[22px] rounded-[7px] grid place-items-center shrink-0 ${
        hit ? "bg-[rgba(var(--good-rgb),0.16)] text-[var(--good)]" : "bg-[rgba(var(--bad-rgb),0.16)] text-[var(--bad)]"
      }`}
    >
      {hit ? <Check size={13} /> : <X size={13} />}
    </span>
  );
}
