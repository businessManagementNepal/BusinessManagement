export const PosSaleWorkflowStatus = {
  PendingValidation: "pending_validation",
  PendingPosting: "pending_posting",
  Posted: "posted",
  PartiallyPosted: "partially_posted",
  Failed: "failed",
} as const;

export type PosSaleWorkflowStatusValue =
  (typeof PosSaleWorkflowStatus)[keyof typeof PosSaleWorkflowStatus];
