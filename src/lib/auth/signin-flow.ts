export type PostRegisterSignInResult = {
  error?: string | null;
  url?: string | null;
} | null;

export type PostRegisterOutcome =
  | {
      kind: "redirect";
      targetUrl: string;
    }
  | {
      kind: "fallback_signin";
      mode: "sign_in";
      message: string;
    };

export function resolvePostRegisterOutcome(params: {
  signInResult: PostRegisterSignInResult;
  callbackUrl: string;
}): PostRegisterOutcome {
  if (!params.signInResult || params.signInResult.error) {
    return {
      kind: "fallback_signin",
      mode: "sign_in",
      message: "Account created. Please sign in with your new password.",
    };
  }

  return {
    kind: "redirect",
    targetUrl: params.signInResult.url || params.callbackUrl,
  };
}
