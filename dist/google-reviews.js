import {savedPlaceId,rememberPlaceId,forgetPlaceId} from './google-place-ids.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const safeUrl = value => { try { const u = new URL(value); return u.protocol === 'https:' ? escape(u.href) : ''; } catch { return ''; } };
const link = (url, label) => safeUrl(url) ? `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>` : escape(label);

export function googleReviewMarkup(port) {
  if (!port || !Number.isFinite(port.lat) || !Number.isFinite(port.lon)) return '';
  return `<details class="google-reviews" data-google-port="${escape(port.id)}" data-lat="${port.lat}" data-lon="${port.lon}"><summary>Note Google</summary><div class="google-review-content" aria-live="polite"></div></details>`;
}

export function renderGoogleReviews(result) {
  const score = result.score == null ? 'Note non disponible' : `★ ${Number(result.score).toLocaleString('fr-CA', {maximumFractionDigits: 1})}/5`;
  return `<div class="google-attribution" translate="no">Google Maps</div><strong class="google-place-name">${escape(result.name)}</strong><p class="google-place-address">${escape(result.address)}</p><p class="google-place-score">${score}</p><p>${link(result.sourceUrl, 'Voir la fiche sur Google Maps')}</p>${result.attributions?.length ? `<p class="google-review-note">${result.attributions.map(a => link(a.url, a.name)).join(' · ')}</p>` : ''}`;
}

export function hydrateGoogleReviews(root) {
  root.querySelectorAll('details[data-google-port]').forEach(el => {
    el.addEventListener('toggle', async () => {
      if (!el.open || el.dataset.googleLoading === 'true' || el.dataset.googleLoaded === 'true') return;
      el.dataset.googleLoading = 'true';
      const content = el.querySelector('.google-review-content'); content.textContent = 'Chargement de la note Google…';
      const port={id:el.dataset.googlePort,lat:Number(el.dataset.lat),lon:Number(el.dataset.lon)};
      const placeId=savedPlaceId(port);
      try {
        const response = await fetch('/api/google-reviews', {method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({...port,...(placeId?{placeId}:{})}), signal: AbortSignal.timeout(25000)});
        const result = await response.json();
        if(placeId&&[400,404].includes(response.status))forgetPlaceId(port);
        if (!response.ok) throw new Error(result.error || 'Note Google indisponible.');
        rememberPlaceId(port,result.placeId);
        if (!el.isConnected) return;
        content.innerHTML = renderGoogleReviews(result); el.dataset.googleLoaded = 'true';
      } catch (error) {
        if (el.isConnected) { content.textContent = error instanceof SyntaxError ? 'Les notes Google nécessitent le serveur Cloudflare.' : error.message === 'Failed to fetch' ? 'Connexion à Google indisponible. Fermez puis rouvrez pour réessayer.' : error.message; }
      } finally { el.dataset.googleLoading = 'false'; }
    });
    // Previously consulted ports reopen their score using only the saved place ID.
    if(savedPlaceId({id:el.dataset.googlePort,lat:Number(el.dataset.lat),lon:Number(el.dataset.lon)}))el.open=true;
  });
}
