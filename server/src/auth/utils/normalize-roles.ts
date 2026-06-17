
export function normalizeRoles(roles: unknown): string[] {
  
  if (!roles) return ['user'];

  let roleArray: string[];

  if (Array.isArray(roles)) {
    roleArray = roles
      .map((r) => {
        if (typeof r === 'string') {
          if (r.includes(',')) {
            return r.split(',').map((item) => item.trim());
          }
          return r.trim();
        }
        return String(r);
      })
      .flat();
  } else if (typeof roles === 'string') {
    roleArray = roles.split(',').map((r) => r.trim());
  } else {
    roleArray = ['user'];
  }

  const result = [...new Set(roleArray.filter((r) => r))];
  return result;
}


