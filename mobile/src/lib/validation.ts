// Reglas de validación compartidas por los formularios. Los mensajes van en español
// y explican qué falta, para que el usuario sepa si va bien mientras escribe.

export const PASSWORD_MIN = 8;
// Supabase Auth acepta hasta 72 bytes en la contraseña.
export const PASSWORD_MAX = 72;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

// Devuelve el mensaje del primer problema, o null si la contraseña es válida.
export function passwordProblem(password: string): string | null {
  if (password.length === 0) return null;
  if (password.length < PASSWORD_MIN) {
    return `Faltan ${PASSWORD_MIN - password.length} caracteres para llegar al mínimo de ${PASSWORD_MIN}.`;
  }
  if (password.length > PASSWORD_MAX) return `La contraseña no puede pasar de ${PASSWORD_MAX} caracteres.`;
  return null;
}

// Mensaje de la confirmación solo cuando ya escribieron algo en ambos campos.
export function confirmProblem(password: string, confirm: string): string | null {
  if (confirm.length === 0) return null;
  return password === confirm ? null : 'Las contraseñas no coinciden todavía.';
}
