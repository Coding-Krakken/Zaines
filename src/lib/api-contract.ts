import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/security/logging";

export type ContractErrorBody = {
  errorCode: string;
  message: string;
  retryable: boolean;
  correlationId: string;
};

export function createCorrelationId(): string {
  return randomUUID();
}

export function createContractErrorResponse(params: {
  status: number;
  errorCode: string;
  message: string;
  retryable: boolean;
  correlationId?: string;
}): NextResponse<ContractErrorBody> {
  const correlationId = params.correlationId ?? createCorrelationId();

  return NextResponse.json(
    {
      errorCode: params.errorCode,
      message: params.message,
      retryable: params.retryable,
      correlationId,
    },
    { status: params.status },
  );
}

export function logContractFailure(params: {
  route: string;
  correlationId: string;
  errorCode: string;
  error: unknown;
}) {
  logSecurityEvent({
    route: params.route,
    event: params.errorCode,
    correlationId: params.correlationId,
    level: "error",
    error: params.error,
  });
}
