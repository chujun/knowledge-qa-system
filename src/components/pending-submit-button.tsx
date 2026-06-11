"use client";

import React from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function PendingSubmitButton({
  children,
  className,
  pendingLabel = "后台处理中"
}: {
  children: ReactNode;
  className: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={`${className} disabled:cursor-wait disabled:opacity-70`}
      disabled={pending}
      type="submit"
    >
      <span className="inline-flex items-center gap-2">
        {pending ? <span className="h-2 w-2 animate-pulse bg-paper" /> : null}
        {pending ? pendingLabel : children}
      </span>
    </button>
  );
}
