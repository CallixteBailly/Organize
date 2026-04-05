"use server";

import { auth } from "@/lib/auth";
import {
  createStockItemSchema,
  updateStockItemSchema,
  createStockMovementSchema,
  createCategorySchema,
} from "@/server/validators/stock";
import {
  createStockItem,
  updateStockItem,
  deactivateStockItem,
  recordStockMovement,
  getStockItemById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/server/services/stock.service";
import { notifyStockLow } from "@/server/services/notification.service";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/server/services/activity-log.service";

export type StockActionState = {
  success: boolean;
  error?: string;
  itemId?: string;
};

export async function createStockItemAction(
  _prevState: StockActionState,
  formData: FormData,
): Promise<StockActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const raw = Object.fromEntries(formData);
  const parsed = createStockItemSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  try {
    const item = await createStockItem(session.user.garageId, parsed.data);
    await logActivity({
      garageId: session.user.garageId,
      userId: session.user.id,
      action: "create",
      entityType: "stock",
      entityId: item.id,
      description: `Ajout article stock : ${parsed.data.name}`,
    });
    revalidatePath("/stock");
    return { success: true, itemId: item.id };
  } catch {
    return { success: false, error: "Erreur lors de la creation de l'article" };
  }
}

export async function updateStockItemAction(
  _prevState: StockActionState,
  formData: FormData,
): Promise<StockActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const itemId = formData.get("itemId") as string;
  if (!itemId) return { success: false, error: "Article non specifie" };

  const raw = Object.fromEntries(formData);
  const parsed = updateStockItemSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "Donnees invalides" };
  }

  try {
    await updateStockItem(session.user.garageId, itemId, parsed.data);
    await logActivity({
      garageId: session.user.garageId,
      userId: session.user.id,
      action: "update",
      entityType: "stock",
      entityId: itemId,
      description: `Modification article stock`,
      metadata: { fields: Object.keys(parsed.data) },
    });
    revalidatePath(`/stock/${itemId}`);
    revalidatePath("/stock");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise a jour" };
  }
}

export async function deactivateStockItemAction(itemId: string): Promise<StockActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  try {
    await deactivateStockItem(session.user.garageId, itemId);
    await logActivity({
      garageId: session.user.garageId,
      userId: session.user.id,
      action: "delete",
      entityType: "stock",
      entityId: itemId,
      description: `Desactivation article stock`,
    });
    revalidatePath("/stock");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression" };
  }
}

export async function recordMovementAction(
  _prevState: StockActionState,
  formData: FormData,
): Promise<StockActionState> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Non authentifie" };

  const raw = Object.fromEntries(formData);
  const parsed = createStockMovementSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  try {
    await recordStockMovement(session.user.garageId, session.user.id, parsed.data);
    await logActivity({
      garageId: session.user.garageId,
      userId: session.user.id,
      action: "update",
      entityType: "stock",
      entityId: parsed.data.stockItemId,
      description: `Mouvement stock (${parsed.data.type}) : ${parsed.data.quantity} unites`,
      metadata: { type: parsed.data.type, quantity: parsed.data.quantity, reason: parsed.data.reason },
    });
    if (parsed.data.type === "exit") {
      getStockItemById(session.user.garageId, parsed.data.stockItemId)
        .then((item) => {
          if (item && item.quantity <= item.minQuantity) {
            notifyStockLow(session.user.garageId, {
              id: item.id,
              name: item.name,
              reference: item.reference,
              quantity: item.quantity,
              minQuantity: item.minQuantity,
            }).catch((err) => console.error("[stock] Erreur notification:", err));
          }
        })
        .catch((err) => console.error("[stock] Erreur check stock bas:", err));
    }
    revalidatePath(`/stock/${parsed.data.stockItemId}`);
    revalidatePath("/stock");
    revalidatePath("/stock/alerts");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement du mouvement" };
  }
}

export type CategoryActionState = {
  success: boolean;
  error?: string;
};

export async function createCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager"].includes(session.user.role)) {
    return { success: false, error: "Acces refuse" };
  }

  const raw = Object.fromEntries(formData);
  const parsed = createCategorySchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }

  try {
    await createCategory(session.user.garageId, parsed.data);
    await logActivity({
      garageId: session.user.garageId,
      userId: session.user.id,
      action: "create",
      entityType: "stock_category",
      description: `Creation categorie stock : ${parsed.data.name}`,
    });
    revalidatePath("/stock/categories");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la creation" };
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<CategoryActionState> {
  const session = await auth();
  if (!session?.user || !["owner", "manager"].includes(session.user.role)) {
    return { success: false, error: "Acces refuse" };
  }

  try {
    await deleteCategory(session.user.garageId, categoryId);
    await logActivity({
      garageId: session.user.garageId,
      userId: session.user.id,
      action: "delete",
      entityType: "stock_category",
      entityId: categoryId,
      description: `Suppression categorie stock`,
    });
    revalidatePath("/stock/categories");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression" };
  }
}
