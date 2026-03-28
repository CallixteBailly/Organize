"use client";

import { useActionState, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Folders, Plus, Trash2 } from "lucide-react";
import {
  createCategoryAction,
  deleteCategoryAction,
  type CategoryActionState,
} from "@/server/actions/stock";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface Props {
  categories: Category[];
}

const initialState: CategoryActionState = { success: false };

export function CategoryManager({ categories }: Props) {
  const [state, formAction, isPending] = useActionState(createCategoryAction, initialState);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) toast.success("Categorie creee");
    if (state.error) toast.error(state.error);
  }, [state]);

  async function handleDelete(id: string) {
    setDeleting(id);
    const result = await deleteCategoryAction(id);
    setDeleting(null);
    if (result.success) toast.success("Categorie supprimee");
    else toast.error(result.error ?? "Erreur");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-4">
          <form action={formAction} className="flex gap-3">
            <Input name="name" placeholder="Nom de la categorie" required className="flex-1" />
            <Input name="color" type="color" defaultValue="#2563eb" className="h-12 w-14 p-1" />
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner className="h-4 w-4" /> : <><Plus className="h-4 w-4" /> Ajouter</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <EmptyState
          icon={Folders}
          title="Aucune categorie"
          description="Creez des categories pour organiser votre stock"
        />
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center gap-3 p-4">
                {cat.color && (
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                )}
                <span className="flex-1 font-medium">{cat.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(cat.id)}
                  disabled={deleting === cat.id}
                >
                  {deleting === cat.id ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
