type OauthProviderId = "google" | "facebook";

type ProviderCredentialAliases = {
  clientId: string[];
  clientSecret: string[];
};

type ProviderCredentials = {
  clientId?: string;
  clientSecret?: string;
  clientIdKey?: string;
  clientSecretKey?: string;
};

const PROVIDER_ALIASES: Record<OauthProviderId, ProviderCredentialAliases> = {
  google: {
    // Prefer AUTH_* keys for parity with Auth.js v5 naming, then legacy keys.
    clientId: ["AUTH_GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_ID"],
    clientSecret: [
      "AUTH_GOOGLE_CLIENT_SECRET",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_OAUTH_CLIENT_SECRET",
    ],
  },
  facebook: {
    clientId: ["AUTH_FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_ID"],
    clientSecret: ["AUTH_FACEBOOK_CLIENT_SECRET", "FACEBOOK_CLIENT_SECRET"],
  },
};

function firstDefinedValue(keys: string[]): { value?: string; key?: string } {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return { value, key };
    }
  }

  return {};
}

function getDefinedKeys(keys: string[]): string[] {
  return keys.filter((key) => {
    const value = process.env[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

function warnIfConflictingKeys(
  provider: OauthProviderId,
  kind: "clientId" | "clientSecret",
  keys: string[],
): void {
  const definedKeys = getDefinedKeys(keys);
  if (definedKeys.length <= 1) return;

  console.warn(
    `[auth] Multiple ${provider} ${kind} env keys are set (${definedKeys.join(
      ", ",
    )}). Using ${definedKeys[0]}.`,
  );
}

export function getOauthProviderCredentials(provider: OauthProviderId): ProviderCredentials {
  const aliases = PROVIDER_ALIASES[provider];

  warnIfConflictingKeys(provider, "clientId", aliases.clientId);
  warnIfConflictingKeys(provider, "clientSecret", aliases.clientSecret);

  const { value: clientId, key: clientIdKey } = firstDefinedValue(aliases.clientId);
  const { value: clientSecret, key: clientSecretKey } = firstDefinedValue(aliases.clientSecret);

  return {
    clientId,
    clientSecret,
    clientIdKey,
    clientSecretKey,
  };
}

function redactClientId(clientId: string | undefined): string | undefined {
  if (!clientId) return undefined;

  const trimmed = clientId.trim();
  if (trimmed.length <= 10) return trimmed;
  return `${trimmed.slice(0, 8)}...${trimmed.slice(-8)}`;
}

export function getOauthProviderDebugInfo(provider: OauthProviderId): {
  clientIdKey?: string;
  clientSecretKey?: string;
  redactedClientId?: string;
} {
  const credentials = getOauthProviderCredentials(provider);
  return {
    clientIdKey: credentials.clientIdKey,
    clientSecretKey: credentials.clientSecretKey,
    redactedClientId: redactClientId(credentials.clientId),
  };
}
