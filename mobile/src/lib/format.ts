// Los importes llegan en centavos. Esta función solo se usa para mostrarlos.
export function money(cents: number): string {
  const [whole, decimals] = (Math.abs(cents) / 100).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${cents < 0 ? '-' : ''}S/ ${grouped}.${decimals}`;
}

// "AAAA-MM" del mes actual, que es el formato que espera la API.
export function currentPeriod(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Clave de idempotencia por intento de pago. Se crea una vez por toque del usuario,
// así un reintento de red no genera un segundo pago.
export function newIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
