/**
 * Нормализует роли пользователя в массив строк.
 * Обрабатывает различные форматы: строка с запятыми, массив строк,
 * массив с строкой содержащей запятые и т.д.
 */
export function normalizeRoles(roles: unknown): string[] {
  console.log('[normalizeRoles] Input:', JSON.stringify(roles), 'Type:', typeof roles, 'IsArray:', Array.isArray(roles));
  
  if (!roles) return ['user'];

  let roleArray: string[];

  if (Array.isArray(roles)) {
    roleArray = roles
      .map((r) => {
        if (typeof r === 'string') {
          // Если элемент содержит запятую, разбиваем на массив
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

  // Убираем дубликаты и пустые значения
  const result = [...new Set(roleArray.filter((r) => r))];
  console.log('[normalizeRoles] Output:', JSON.stringify(result));
  return result;
}
