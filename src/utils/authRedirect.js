export function getHomePathByRole(role) {
  if (role === 'ADMIN') return '/inicio';
  if (role === 'PROFESOR') return '/inicio';
  return '/inicio';
}
