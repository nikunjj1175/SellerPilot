/** Default landing path after login by role. */
export function homePathForRole(role?: string | null) {
  return role === "ADMIN" ? "/admin" : "/dashboard/reports";
}
