import {
  PosSaleWorkflowStatus,
  type PosSaleWorkflowStatusValue,
} from "../types/posSale.constant";

export const isPosSaleRetryableWorkflowStatus = (
  workflowStatus: PosSaleWorkflowStatusValue | string,
): boolean => {
  return (
    workflowStatus === PosSaleWorkflowStatus.PendingValidation ||
    workflowStatus === PosSaleWorkflowStatus.PendingPosting ||
    workflowStatus === PosSaleWorkflowStatus.Failed ||
    workflowStatus === PosSaleWorkflowStatus.PartiallyPosted
  );
};

export const isPosSaleCleanupAllowedWorkflowStatus = (
  workflowStatus: PosSaleWorkflowStatusValue | string,
): boolean => {
  return (
    workflowStatus === PosSaleWorkflowStatus.Failed ||
    workflowStatus === PosSaleWorkflowStatus.PartiallyPosted
  );
};

export const isPosSalePendingRecoveryWorkflowStatus = (
  workflowStatus: PosSaleWorkflowStatusValue | string,
): boolean => {
  return (
    workflowStatus === PosSaleWorkflowStatus.PendingValidation ||
    workflowStatus === PosSaleWorkflowStatus.PendingPosting
  );
};

export const getPosSaleRecoveryStatusLabel = (
  workflowStatus: PosSaleWorkflowStatusValue | string,
): string => {
  if (workflowStatus === PosSaleWorkflowStatus.PendingValidation) {
    return "PENDING VALIDATION";
  }

  if (workflowStatus === PosSaleWorkflowStatus.PendingPosting) {
    return "PENDING POSTING";
  }

  if (workflowStatus === PosSaleWorkflowStatus.Failed) {
    return "FAILED";
  }

  if (workflowStatus === PosSaleWorkflowStatus.PartiallyPosted) {
    return "PARTIAL SYNC";
  }

  if (workflowStatus === PosSaleWorkflowStatus.Posted) {
    return "POSTED";
  }

  return String(workflowStatus).replace(/_/g, " ").toUpperCase();
};
