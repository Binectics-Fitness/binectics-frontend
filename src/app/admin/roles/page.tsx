import type { Metadata } from "next";
import RolesClient from "./RolesClient";

export const metadata: Metadata = {
  title: "Team & roles",
  description: "Platform admins, their roles and what each role can do",
};

export default function AdminRolesPage() {
  return <RolesClient />;
}
