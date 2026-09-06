"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@/lib/types";

export default function AuthSwitcher({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const changeUser = async (userId: string) => {
    setBusy(true);
    try {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <select
      className="auth-select"
      value={currentUserId}
      disabled={busy}
      onChange={(event) => changeUser(event.target.value)}
      aria-label="Choose demo user"
    >
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.display_name} - {user.role ?? "citizen"}
        </option>
      ))}
    </select>
  );
}
