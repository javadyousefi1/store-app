"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  isPending?: boolean;
  initial?: Category;
}

export function CategoryModal({ open, onClose, onSubmit, isPending, initial }: Props) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName(initial?.name ?? "");
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(name);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>نام</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="موبایل"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              انصراف
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
