export type LinkedProviderPayload = {
  providers: string[];
  canLink: string[];
  hasPasswordCredential: boolean;
};

export type PreferenceState = {
  bookingStatusEmailsEnabled: boolean;
  productUpdatesEmailsEnabled: boolean;
  marketingEmailsEnabled: boolean;
};

export type PreferencePayload = {
  preferences: PreferenceState;
  lastLoginAt: string | null;
};

export function isLinkedProviderPayload(value: unknown): value is LinkedProviderPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as LinkedProviderPayload;
  return (
    Array.isArray(candidate.providers) &&
    Array.isArray(candidate.canLink) &&
    typeof candidate.hasPasswordCredential === "boolean"
  );
}

export function isPreferencePayload(value: unknown): value is PreferencePayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as PreferencePayload;
  const prefs = candidate.preferences;
  return (
    !!prefs &&
    typeof prefs === "object" &&
    typeof prefs.bookingStatusEmailsEnabled === "boolean" &&
    typeof prefs.productUpdatesEmailsEnabled === "boolean" &&
    typeof prefs.marketingEmailsEnabled === "boolean" &&
    (candidate.lastLoginAt === null || typeof candidate.lastLoginAt === "string")
  );
}

export function getConnectableProviders(params: {
  linkedProviders: string[];
  linkableProviders: string[];
}): string[] {
  const linked = new Set(params.linkedProviders);
  return params.linkableProviders.filter((provider) => !linked.has(provider));
}

export function withUpdatedPreference(
  current: PreferenceState,
  key: keyof PreferenceState,
  value: boolean,
): PreferenceState {
  return {
    ...current,
    [key]: value,
  };
}
