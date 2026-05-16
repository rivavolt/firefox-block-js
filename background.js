// Blocked domains come from Firefox's 3rdparty managed-storage policy,
// set inline from nixos-config (shared/js-blocked-domains.nix).
async function applyBlocking() {
  let domains = [];
  try {
    const managed = await browser.storage.managed.get("patterns");
    if (Array.isArray(managed.patterns)) domains = managed.patterns;
  } catch (e) {
    // no managed storage configured — nothing to block
  }

  const urls = domains.map((d) => `*://*.${d}/*`);
  if (!urls.length) return;

  browser.webRequest.onHeadersReceived.addListener(
    (details) => {
      const headers = details.responseHeaders || [];
      headers.push({
        name: "Content-Security-Policy",
        value: "script-src 'none'",
      });
      return { responseHeaders: headers };
    },
    { urls, types: ["main_frame", "sub_frame"] },
    ["blocking", "responseHeaders"]
  );
}

applyBlocking();
