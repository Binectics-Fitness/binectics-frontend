import React from "react";
import type { Metadata } from "next";
import { UserDetailClient } from "./UserDetailClient";

export const metadata: Metadata = {
  title: "User detail",
  description: "Account view with suspension controls",
};

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = React.use(params);
  return <UserDetailClient userId={userId} />;
}
