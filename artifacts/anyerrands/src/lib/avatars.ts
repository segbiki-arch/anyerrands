export function helperPhotoUrl(helperId: number, size = 200): string {
  const idx = ((helperId * 7) % 70) + 1;
  return `https://i.pravatar.cc/${size}?img=${idx}`;
}

export function requesterAvatarUrl(name: string, size = 64): string {
  const seed = encodeURIComponent(name.trim());
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=f5c400&textColor=0d0d0d&fontWeight=700&size=${size}`;
}
