/**
 * The admin sign-in page: the one /admin address that opens while signed
 * out. Every other /admin page needs a session (middleware) and a platform
 * admin (AdminClientShell).
 */
export function isAdminLoginPath(pathname: string | null | undefined): boolean {
  return pathname === "/admin" || pathname === "/admin/";
}
