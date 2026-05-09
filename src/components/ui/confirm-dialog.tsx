"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-zinc-200 bg-white p-6 shadow-xl",
          )}
        >
          <AlertDialogPrimitive.Title className="text-base font-semibold text-zinc-900">
            {title}
          </AlertDialogPrimitive.Title>
          {description ? (
            <AlertDialogPrimitive.Description className="mt-1.5 text-sm text-zinc-500">
              {description}
            </AlertDialogPrimitive.Description>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
              Cancel
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
              onClick={onConfirm}
            >
              {confirmLabel}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
