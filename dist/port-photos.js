const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
}

export function portPhotoMarkup(stop, cruise, catalog, photos) {
  let url = safeUrl(stop.image), source = cruise.sourceUrl, label = cruise.sourceName || cruise.company;
  if (!url) {
    for (const other of catalog) {
      const match = other.stops?.find(p => p.id === stop.id && safeUrl(p.image));
      if (match) { url = safeUrl(match.image); source = other.sourceUrl; label = other.sourceName || other.company; break; }
    }
  }
  if (!url) {
    const key = {barcelona:'barcelona',santorini:'greek',mykonos:'mykonos',tallinn:'baltic'}[stop.id];
    const photo = photos[key];
    if (photo) { url = safeUrl(photo.url); source = photo.source; label = 'Norwegian Cruise Line'; }
  }
  const sourceUrl = safeUrl(source);
  return `<figure class="stop-photo"><div class="stop-photo-frame">${url ? `<img src="${escape(url)}" alt="Vue de ${stop.name}" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ''}<span class="stop-photo-unavailable"${url ? ' hidden' : ''}>Photo non disponible pour cette escale</span></div>${url ? `<figcaption>${sourceUrl ? `<a href="${escape(sourceUrl)}" target="_blank" rel="noopener noreferrer">Photo : ${escape(label)}</a>` : `Photo : ${escape(label)}`}</figcaption>` : ''}</figure>`;
}

export function hydratePortPhotos(root) {
  root.querySelectorAll('.stop-photo img').forEach(img => {
    const failed = () => { img.hidden = true; img.nextElementSibling.hidden = false; img.closest('figure').querySelector('figcaption')?.remove(); };
    img.addEventListener('error', failed, {once:true});
    if (img.complete && !img.naturalWidth) failed();
  });
}
