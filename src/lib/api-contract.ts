import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

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
    { status: params.status }
  );
}

export function logContractFailure(params: {
  route: string;
  correlationId: string;
  errorCode: string;
  error: unknown;
}) {
  const message = params.error instanceof Error ? params.error.message : "Unknown error";

  console.error(`[${params.route}] ${params.errorCode}`, {
    correlationId: params.correlationId,
    message,
  });
}
