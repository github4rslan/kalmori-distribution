export function getUserRole(user) {
  return user?.user_role || user?.role;
}
