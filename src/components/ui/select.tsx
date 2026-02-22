import * as React from "react";

import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-lime-700 focus:ring-2",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
