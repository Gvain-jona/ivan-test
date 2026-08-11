/**
 * Today as `YYYY-MM-DD`, in the user's own timezone.
 *
 * `new Date().toISOString().slice(0, 10)` is the obvious version and it is
 * wrong: it converts to UTC first, so anyone east of UTC filing an order late
 * in the evening gets tomorrow's date, and anyone west gets yesterday's in the
 * early morning. For Kampala (UTC+3) that is every order taken after 9pm.
 *
 * `order_date` and `payment_date` are DATE columns — a calendar day, not an
 * instant — so the local day is the correct answer.
 */
export function todayISO(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
