"use client";

import { useEffect, useRef, useState } from "react";
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
import type { Attribute } from "@/types";

const COLOR_PRESETS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#14B8A6", "#3B82F6", "#6366F1", "#A855F7",
  "#EC4899", "#000000", "#6B7280", "#FFFFFF",
  "#92400E", "#D97706", "#166534", "#1E40AF",
];

// Mode 1: create new attribute
interface CreateAttributeProps {
  mode: "attribute";
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  isPending?: boolean;
}

// Mode 2: add value to existing attribute
interface AddValueProps {
  mode: "value";
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { value: string; label?: string }) => Promise<void>;
  isPending?: boolean;
  attribute: Attribute;
}

type Props = CreateAttributeProps | AddValueProps;

export function AttributeOptionModal(props: Props) {
  const [input, setInput] = useState("");
  const [label, setLabel] = useState("");
  const colorInputRef = useRef<HTMLInputElement>(null);

  const isAttribute = props.mode === "attribute";
  const isColorAttr =
    props.mode === "value" &&
    (props as AddValueProps).attribute.name === "رنگ";

  useEffect(() => {
    if (props.open) {
      setInput(isColorAttr ? "#3B82F6" : "");
      setLabel("");
    }
  }, [props.open, isColorAttr]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isAttribute) {
      await (props as CreateAttributeProps).onSubmit(input.trim());
    } else {
      await (props as AddValueProps).onSubmit({
        value: input.trim(),
        label: label.trim() || undefined,
      });
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isAttribute
              ? "ویژگی جدید"
              : `افزودن مقدار به «${(props as AddValueProps).attribute.name}»`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isColorAttr ? (
            <div className="space-y-3">
              <Label>انتخاب رنگ</Label>

              {/* Preset swatches */}
              <div className="grid grid-cols-8 gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setInput(color)}
                    className="w-8 h-8 rounded-md border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: input === color ? "#3B82F6" : "transparent",
                      outline: input === color ? "2px solid #3B82F6" : "2px solid transparent",
                      outlineOffset: "2px",
                    }}
                    title={color}
                  />
                ))}
              </div>

              {/* Custom color picker */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg border cursor-pointer shrink-0 shadow-sm"
                  style={{ backgroundColor: input }}
                  onClick={() => colorInputRef.current?.click()}
                />
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">رنگ دلخواه</p>
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="sr-only"
                  />
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="#000000"
                    dir="ltr"
                    className="h-7 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Persian label */}
              <div className="space-y-1">
                <Label>نام فارسی <span className="text-muted-foreground font-normal">(اختیاری)</span></Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="مثلاً: آبی"
                  dir="rtl"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{isAttribute ? "نام ویژگی" : "مقدار"}</Label>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isAttribute ? "color" : "XL"}
                dir={isAttribute ? "ltr" : "rtl"}
                autoFocus
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={props.onClose} disabled={props.isPending}>
              انصراف
            </Button>
            <Button type="submit" disabled={props.isPending || !input.trim()}>
              {props.isPending ? "در حال ذخیره..." : "افزودن"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
