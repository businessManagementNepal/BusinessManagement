export const DELETE_LOCAL_DATA_CONFIRMATION = "DELETE";

export const isDeleteLocalDataConfirmationAccepted = (
  value: string,
): boolean =>
  value.trim().toUpperCase() === DELETE_LOCAL_DATA_CONFIRMATION;

export const isDeleteLocalDataActionDisabled = (params: {
  confirmation: string;
  isDeleting: boolean;
}): boolean =>
  params.isDeleting ||
  !isDeleteLocalDataConfirmationAccepted(params.confirmation);
