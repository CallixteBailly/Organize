"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, UserPlus, UserX } from "lucide-react";
import { deactivateUserAction } from "@/server/actions/users";
import { toast } from "sonner";
import { AddUserDialog } from "./add-user-dialog";

const roleLabels: Record<string, string> = {
  owner: "Proprietaire",
  manager: "Gerant",
  mechanic: "Mecanicien",
  secretary: "Secretaire",
};

const roleVariants: Record<string, "default" | "secondary" | "success" | "warning"> = {
  owner: "default",
  manager: "success",
  mechanic: "secondary",
  secretary: "warning",
};

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  phone: string | null;
}

interface UsersListProps {
  users: User[];
  currentUserId: string;
}

export function UsersList({ users, currentUserId }: UsersListProps) {
  const [showAdd, setShowAdd] = useState(false);

  async function handleDeactivate(userId: string) {
    const result = await deactivateUserAction(userId);
    if (result.success) {
      toast.success("Utilisateur desactive");
    } else {
      toast.error(result.error ?? "Erreur");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)}>
          <UserPlus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun membre"
          description="Ajoutez des membres a votre equipe"
        />
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="flex items-center gap-4">
              <CardContent className="flex flex-1 items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <Badge variant={roleVariants[user.role] ?? "secondary"}>
                      {roleLabels[user.role] ?? user.role}
                    </Badge>
                    {!user.isActive && <Badge variant="destructive">Inactif</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                {user.id !== currentUserId && user.isActive && user.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeactivate(user.id)}
                    aria-label="Desactiver"
                  >
                    <UserX className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAdd && <AddUserDialog onClose={() => setShowAdd(false)} />}
    </div>
  );
}
