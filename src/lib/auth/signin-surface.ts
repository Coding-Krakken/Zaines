type AuthCapability = {
  id: string;
  kind: "oauth" | "passwordless" | "credentials" | "guest";
  label: string;
  enabled: boolean;
};

export function deriveSignInSurface(params: {
  capabilities: AuthCapability[];
  providerIds: Set<string>;
}) {
  const enabledCapabilityIds = new Set(
    params.capabilities.filter((entry) => entry.enabled).map((entry) => entry.id),
  );

  const oauthProviders = params.capabilities.filter(
    (entry) => entry.kind === "oauth" && entry.enabled && params.providerIds.has(entry.id),
  );

  return {
    enabledCapabilityIds,
    oauthProviders,
    hasMagicLink: enabledCapabilityIds.has("resend") && params.providerIds.has("resend"),
    hasCredentials:
      enabledCapabilityIds.has("credentials") && params.providerIds.has("credentials"),
    hasGuest: enabledCapabilityIds.has("guest"),
  };
}
