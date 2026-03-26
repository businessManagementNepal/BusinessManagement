export const Status = {
  Idle: "IDLE",
  Loading: "LOADING",
  Success: "SUCCESS",
  Failure: "FAILURE",
} as const;

export type StatusType = (typeof Status)[keyof typeof Status];

export type RemoteError =
  | { type: "connectivity"; message: string }
  | { type: "badPayload"; message: string }
  | { type: "unauthorized"; message: string }
  | { type: "validation"; message: string }
  | { type: "conflict"; message: string }
  | { type: "notFound"; message: string }
  | { type: "server"; message: string }
  | { type: "unknown"; message: string };
