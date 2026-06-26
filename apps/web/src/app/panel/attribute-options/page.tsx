"use client";

import { toast } from "@/lib/toast";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AttributeOptionModal, ConfirmDeleteModal } from "@/components/modals";
import {
  useAttributeOptions,
  useCreateAttribute,
  useDeleteAttribute,
  useAddAttributeValue,
  useDeleteAttributeValue,
} from "@/hooks/use-attribute-options";
import { useModal } from "@/hooks/use-modal";
import type { Attribute, AttributeValue } from "@/types";

export default function AttributeOptionsPage() {
  const { data, isLoading } = useAttributeOptions();
  const createAttribute = useCreateAttribute();
  const deleteAttribute = useDeleteAttribute();
  const addValue = useAddAttributeValue();
  const deleteValue = useDeleteAttributeValue();

  const createAttrModal = useModal();
  const addValueModal = useModal<Attribute>();
  const deleteAttrModal = useModal<Attribute>();
  const deleteValueModal = useModal<{ attributeId: string; value: AttributeValue }>();

  async function handleCreateAttribute(name: string) {
    try {
      await createAttribute.mutateAsync(name);
      toast.success("ویژگی ایجاد شد");
      createAttrModal.close();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "خطا در ایجاد");
    }
  }

  async function handleAddValue({ value, label }: { value: string; label?: string }) {
    if (!addValueModal.data) return;
    try {
      await addValue.mutateAsync({ attributeId: addValueModal.data.id, value, label });
      toast.success("مقدار اضافه شد");
      addValueModal.close();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "خطا در افزودن مقدار");
    }
  }

  async function handleDeleteAttribute() {
    if (!deleteAttrModal.data) return;
    try {
      await deleteAttribute.mutateAsync(deleteAttrModal.data.id);
      toast.success("ویژگی حذف شد");
      deleteAttrModal.close();
    } catch {
      toast.error("خطا در حذف");
    }
  }

  async function handleDeleteValue() {
    if (!deleteValueModal.data) return;
    try {
      await deleteValue.mutateAsync({
        attributeId: deleteValueModal.data.attributeId,
        valueId: deleteValueModal.data.value.id,
      });
      toast.success("مقدار حذف شد");
      deleteValueModal.close();
    } catch {
      toast.error("خطا در حذف");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">ویژگی‌های محصول</h2>
          <p className="text-sm text-muted-foreground mt-0.5">مدیریت ویژگی‌ها و مقادیر مجاز</p>
        </div>
        <Button onClick={() => createAttrModal.open()} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">ویژگی جدید</span>
          <span className="sm:hidden">جدید</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="text-center text-muted-foreground py-16 border rounded-lg bg-card">
          هیچ ویژگی‌ای ثبت نشده
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((attr) => (
            <Card key={attr.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{attr.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => addValueModal.open(attr)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteAttrModal.open(attr)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {attr.values.length === 0 ? (
                  <p className="text-xs text-muted-foreground">مقداری ثبت نشده</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {attr.values.map((v) => {
                      const isHex = /^#[0-9A-Fa-f]{6}$/.test(v.value);
                      return (
                      <div key={v.id} className="flex items-center gap-1 group">
                        <Badge variant="secondary" className="text-xs flex items-center gap-1.5">
                          {isHex && (
                            <span className="inline-block w-3 h-3 rounded-full border border-border/50 shrink-0" style={{ backgroundColor: v.value }} />
                          )}
                          {v.label ?? v.value}
                        </Badge>
                        <button
                          onClick={() => deleteValueModal.open({ attributeId: attr.id, value: v })}
                          className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create attribute */}
      <AttributeOptionModal
        mode="attribute"
        open={createAttrModal.isOpen}
        onClose={createAttrModal.close}
        onSubmit={handleCreateAttribute}
        isPending={createAttribute.isPending}
      />

      {/* Add value */}
      {addValueModal.data && (
        <AttributeOptionModal
          mode="value"
          open={addValueModal.isOpen}
          onClose={addValueModal.close}
          onSubmit={handleAddValue}
          isPending={addValue.isPending}
          attribute={addValueModal.data}
        />
      )}

      {/* Delete attribute */}
      <ConfirmDeleteModal
        open={deleteAttrModal.isOpen}
        onClose={deleteAttrModal.close}
        onConfirm={handleDeleteAttribute}
        isPending={deleteAttribute.isPending}
        title="حذف ویژگی"
        description={`ویژگی «${deleteAttrModal.data?.name}» و تمام مقادیرش حذف خواهند شد.`}
      />

      {/* Delete value */}
      <ConfirmDeleteModal
        open={deleteValueModal.isOpen}
        onClose={deleteValueModal.close}
        onConfirm={handleDeleteValue}
        isPending={deleteValue.isPending}
        title="حذف مقدار"
        description={`مقدار «${deleteValueModal.data?.value.label ?? deleteValueModal.data?.value.value}» حذف خواهد شد.`}
      />
    </div>
  );
}
