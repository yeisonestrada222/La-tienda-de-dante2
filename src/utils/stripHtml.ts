/**
 * Utilidad para extraer texto plano de cadenas HTML.
 * Usa DOMParser en el navegador para manejar correctamente todas las entidades HTML.
 */
export function stripHtml(html: string): string {
  if (typeof document === 'undefined') {
    // SSR fallback: elimina tags y entidades de forma básica
    return html.replace(/<[^>]*>/gm, '').replace(/&[a-z#0-9]+;/gi, ' ').trim();
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() || '';
}
