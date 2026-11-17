"use client";

import { apiErrorMessage } from "@/api/client";
import { trackerApi } from "@/api/composition";
import type { Category, CategoryInput } from "@/api/tracker";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { toast } from "@/components/base/toast/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";

type CreateCategoryProps = {
  category?: Category | null;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export default function CreateCategory({
  category = null,
  onCancel,
  onSuccess,
}: CreateCategoryProps) {
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const input: CategoryInput = {
      name: name.trim(),
      description: description.trim(),
    };
    if (
      !input.name ||
      input.name.length > 100 ||
      input.description.length > 500
    ) {
      setError(
        "Enter a name up to 100 characters and a description up to 500 characters.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (category) await trackerApi.updateCategory(category.id, input);
      else await trackerApi.createCategory(input);
      await cache.invalidateQueries({ queryKey: ["categories"] });
      toast.success(
        category
          ? "Category updated successfully."
          : "Category created successfully.",
      );
      onSuccess?.();
    } catch (cause) {
      const message = apiErrorMessage(cause, "Could not save category.");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="flex flex-col gap-6">
      <form
        onSubmit={saveCategory}
        className="flex flex-col gap-4"
        aria-busy={busy}
      >
        <Input
          label="Category name"
          value={name}
          onChange={setName}
          placeholder="Enter category name"
          minLength={1}
          maxLength={100}
          isRequired
          isDisabled={busy}
        />
        <Input
          label="Description (optional)"
          value={description}
          onChange={setDescription}
          placeholder="Enter category description"
          maxLength={500}
          isDisabled={busy}
        />
        {error && (
          <p
            role="alert"
            className="text-body-2-regular text-text-error-primary"
          >
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : category ? "Save changes" : "Create category"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
