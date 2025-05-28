// Utility functions for handling avatar URLs safely

export interface Avatar {
  public_id?: string;
  url: string;
}

/**
 * Safely extracts URL from avatar object or returns the string directly
 */
export function getAvatarUrl(avatar: string | Avatar | undefined): string | undefined {
  if (!avatar) return undefined;
  
  if (typeof avatar === 'string') {
    return avatar;
  }
  
  if (typeof avatar === 'object' && 'url' in avatar) {
    return avatar.url;
  }
  
  return undefined;
}

/**
 * Returns a safe avatar URL with fallback to default
 */
export function getSafeAvatarUrl(avatar: string | Avatar | undefined, fallback: string = '/default-avatar.png'): string {
  return getAvatarUrl(avatar) || fallback;
}

/**
 * Type guard to check if avatar has URL property
 */
export function isAvatarObject(avatar: string | Avatar | undefined): avatar is Avatar {
  return typeof avatar === 'object' && avatar !== null && 'url' in avatar;
}
