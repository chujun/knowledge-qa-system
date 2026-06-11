"use client";

import React, { useActionState } from "react";
import type { ReactNode } from "react";

import { PendingSubmitButton } from "@/components/pending-submit-button";

export type GenerateQuestionsState = {
  status: "idle" | "success" | "failed";
  message: string | null;
};

export type GenerateQuestionsAction = (
  state: GenerateQuestionsState,
  formData: FormData
) => Promise<GenerateQuestionsState>;

const initialState: GenerateQuestionsState = {
  status: "idle",
  message: null
};

export function GenerateQuestionsForm({
  action,
  buttonClassName,
  buttonLabel = "生成题目",
  children,
  className,
  knowledgePointId
}: {
  action: GenerateQuestionsAction;
  buttonClassName: string;
  buttonLabel?: string;
  children?: ReactNode;
  className: string;
  knowledgePointId: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className={className}>
      <input name="knowledge_point_id" type="hidden" value={knowledgePointId} />
      {children}
      <PendingSubmitButton className={buttonClassName}>{buttonLabel}</PendingSubmitButton>
      {state.status !== "idle" ? (
        <p
          className={`mt-3 text-sm leading-6 ${
            state.status === "failed" ? "text-red-900" : "text-moss"
          }`}
          role={state.status === "failed" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
