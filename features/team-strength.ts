export function formScore(form: string[]): number {
  if (!form.length) return 0.5;
  return form.reduce((acc, r) => acc + (r === "W" ? 3 : r === "D" ? 1 : 0), 0) / (form.length * 3);
}
