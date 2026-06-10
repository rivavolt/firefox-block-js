// Blocked domains come from Firefox's 3rdparty managed-storage policy, set inline from nixos-config (shared/js-blocked-domains.nix). They're synced into a persistent declarativeNetRequest dynamic rule that appends a script-src 'none' CSP header on matching documents (requestDomains covers the domain and its subdomains, like the old *://*.domain/* match patterns), so blocking applies in the network stack without waking this event page per request.
async function syncRules() {
  let domains = [];
  try {
    const managed = await browser.storage.managed.get("patterns");
    if (Array.isArray(managed.patterns)) domains = managed.patterns;
  } catch (e) {
    // no managed storage configured — nothing to block
  }

  const oldRules = await browser.declarativeNetRequest.getDynamicRules();
  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldRules.map((rule) => rule.id),
    addRules: domains.length
      ? [
          {
            id: 1,
            action: {
              type: "modifyHeaders",
              responseHeaders: [
                {
                  header: "Content-Security-Policy",
                  operation: "append",
                  value: "script-src 'none'",
                },
              ],
            },
            condition: {
              requestDomains: domains,
              resourceTypes: ["main_frame", "sub_frame"],
            },
          },
        ]
      : [],
  });
}

// Firefox reads policies at startup, so resyncing on startup (plus install/update) tracks nixos-config pattern edits; between syncs the dynamic rule persists and keeps blocking with the background suspended.
browser.runtime.onInstalled.addListener(syncRules);
browser.runtime.onStartup.addListener(syncRules);
