import { getOauthProviderCredentials } from "@/lib/auth/oauth-env";

type ProviderKind = "oauth" | "passwordless" | "credentials" | "guest";

export type AuthProviderCapability = {
  id: "google" | "facebook" | "apple" | "microsoft" | "resend" | "credentials" | "guest";
  kind: ProviderKind;
  label: string;
  enabled: boolean;
  reasonDisabled?: string;
};

type OauthProviderId = Extract<AuthProviderCapability["id"], "google" | "facebook" | "apple" | "microsoft">;

type OauthProviderDefinition = {
  id: OauthProviderId;
  label: string;
  staticDisabledReason?: string;
};

const OAUTH_PROVIDER_REGISTRY: OauthProviderDefinition[] = [
  {
    id: "google",
    label: "Continue with Google",
  },
  {
    id: "facebook",
    label: "Continue with Facebook",
  },
  {
    id: "apple",
    label: "Continue with Apple",
    staticDisabledReason: "not_implemented_yet",
  },
  {
    id: "microsoft",
    label: "Continue with Microsoft",
    staticDisabledReason: "not_implemented_yet",
  },
];

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlaceholder(value: string | undefined): boolean {
  if (!hasValue(value)) return false;
  const lowered = value!.trim().toLowerCase();
  return (
    lowered.includes("your_") ||
    lowered.includes("placeholder") ||
    lowered.includes("example")
  );
}

function getOauthCapability(params: {
  id: OauthProviderId;
  label: string;
  clientId?: string;
  clientSecret?: string;
  extraChecks?: Array<{ value: string | undefined; message: string }>;
}): AuthProviderCapability {
  if (!hasValue(params.clientId) || !hasValue(params.clientSecret)) {
    return {
      id: params.id,
      kind: "oauth",
      label: params.label,
      enabled: false,
      reasonDisabled: "missing_credentials",
    };
  }

  if (isPlaceholder(params.clientId) || isPlaceholder(params.clientSecret)) {
    return {
      id: params.id,
      kind: "oauth",
      label: params.label,
      enabled: false,
      reasonDisabled: "placeholder_credentials",
    };
  }

  for (const check of params.extraChecks ?? []) {
    if (!hasValue(check.value)) {
      return {
        id: params.id,
        kind: "oauth",
        label: params.label,
        enabled: false,
        reasonDisabled: check.message,
      };
    }
  }

  return {
    id: params.id,
    kind: "oauth",
    label: params.label,
    enabled: true,
  };
}

function buildOauthCapability(definition: OauthProviderDefinition): AuthProviderCapability {
  if (definition.staticDisabledReason) {
    return {
      id: definition.id,
      kind: "oauth",
      label: definition.label,
      enabled: false,
      reasonDisabled: definition.staticDisabledReason,
    };
  }

  if (!["google", "facebook"].includes(definition.id)) {
    return {
      id: definition.id,
      kind: "oauth",
      label: definition.label,
      enabled: false,
      reasonDisabled: "missing_credentials",
    };
  }

  const credentials = getOauthProviderCredentials(
    definition.id as "google" | "facebook",
  );

  return getOauthCapability({
    id: definition.id,
    label: definition.label,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
  });
}

export function getAuthProviderCapabilities(params: {
  hasDatabase: boolean;
  enablePasswordLogin: boolean;
  enableGuestFlow: boolean;
}): AuthProviderCapability[] {
  const magicLinkConfigured =
    hasValue(process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY) &&
    hasValue(process.env.EMAIL_FROM);

  const oauthCapabilities = OAUTH_PROVIDER_REGISTRY.map(buildOauthCapability);

  return [
    {
      id: "resend",
      kind: "passwordless",
      label: "Email me a magic link",
      enabled: params.hasDatabase && magicLinkConfigured,
      reasonDisabled: !params.hasDatabase
        ? "database_unavailable"
        : !magicLinkConfigured
          ? "missing_magic_link_credentials"
          : undefined,
    },
    {
      id: "credentials",
      kind: "credentials",
      label: "Sign in with email and password",
      enabled: params.enablePasswordLogin && params.hasDatabase,
      reasonDisabled: !params.enablePasswordLogin
        ? "password_login_disabled"
        : !params.hasDatabase
          ? "database_unavailable"
          : undefined,
    },
    ...oauthCapabilities,
    {
      id: "guest",
      kind: "guest",
      label: "Continue as guest",
      enabled: params.enableGuestFlow,
      reasonDisabled: params.enableGuestFlow ? undefined : "guest_flow_disabled",
    },
  ];
}

export function getEnabledCapabilityIds(capabilities: AuthProviderCapability[]): Set<string> {
  return new Set(capabilities.filter((capability) => capability.enabled).map((capability) => capability.id));
}
