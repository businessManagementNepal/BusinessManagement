export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export type PaginatedValue<T> = {
  data: T[];
  pageInfo: {
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};
export type PaginatedResult<T, E = Error> = Result<PaginatedValue<T>, E>;

export type PaginatedGetParams = {
  pageSize: number;
  offset: number;
};
