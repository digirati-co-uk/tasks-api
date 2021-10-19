export function castStringBool(str?: string | string[]): boolean {
  if (!str) {
    return false;
  }

  if (Array.isArray(str)) {
    str = str[0];
  }

  if (str.toLowerCase() === 'false') {
    return false;
  }

  return true;
}
