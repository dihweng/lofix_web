export function parseReleaseMarker(body) {
  const text = body.toString().trim();
  if (text.startsWith('<')) {
    throw new Error('lofix.ng returned HTML instead of release.json. The prepared release marker is not being served; the site may still have an older build or a different deployment. release:verify only checks the site—it does not deploy.');
  }
  let marker;
  try { marker = JSON.parse(text); }
  catch { throw new Error('lofix.ng returned invalid release.json; cannot verify this deployment.'); }
  if (!marker || typeof marker.id !== 'string' || !marker.id) throw new Error('Published release.json has no release ID; cannot verify this deployment.');
  return marker;
}
