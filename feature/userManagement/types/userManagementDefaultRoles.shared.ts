export type UserManagementDefaultRoleTemplate = {
  slug: string;
  name: string;
  permissionCodes: readonly string[];
};

export const USER_MANAGEMENT_DEFAULT_ROLE_REMOTE_ID_PREFIX = "default-role";

export const USER_MANAGEMENT_DEFAULT_ROLE_TEMPLATES: readonly UserManagementDefaultRoleTemplate[] =
  [
    {
      slug: "manager",
      name: "Manager",
      permissionCodes: [
        "profile.view",
        "profile.edit",
        "ledger.view",
        "ledger.manage",
        "pos.view",
        "pos.checkout",
        "orders.view",
        "orders.manage",
        "products.view",
        "products.manage",
        "inventory.view",
        "inventory.manage",
        "money_accounts.view",
        "money_accounts.manage",
        "contacts.view",
        "contacts.manage",
        "billing.view",
        "billing.manage",
        "reports.view",
        "reports.export",
        "tax_calculator.view",
        "notes.view",
        "emi.view",
        "emi.manage",
        "transactions.view",
        "transactions.manage",
        "budget.view",
        "budget.manage",
        "user_management.view",
        "user_management.assign_role",
        "user_management.manage_staff",
      ],
    },
    {
      slug: "counter",
      name: "Counter",
      permissionCodes: [
        "profile.view",
        "ledger.view",
        "pos.view",
        "pos.checkout",
        "orders.view",
        "orders.manage",
        "products.view",
        "inventory.view",
        "contacts.view",
        "billing.view",
        "billing.manage",
        "reports.view",
        "notes.view",
        "transactions.view",
        "transactions.manage",
      ],
    },
    {
      slug: "accountant",
      name: "Accountant",
      permissionCodes: [
        "profile.view",
        "ledger.view",
        "ledger.manage",
        "money_accounts.view",
        "money_accounts.manage",
        "orders.view",
        "contacts.view",
        "billing.view",
        "billing.manage",
        "reports.view",
        "reports.export",
        "tax_calculator.view",
        "notes.view",
        "transactions.view",
        "transactions.manage",
        "budget.view",
        "budget.manage",
        "emi.view",
      ],
    },
    {
      slug: "sales",
      name: "Sales",
      permissionCodes: [
        "profile.view",
        "ledger.view",
        "pos.view",
        "pos.checkout",
        "orders.view",
        "orders.manage",
        "products.view",
        "inventory.view",
        "contacts.view",
        "contacts.manage",
        "billing.view",
        "billing.manage",
        "reports.view",
        "notes.view",
        "transactions.view",
      ],
    },
  ] as const;

const DEFAULT_ROLE_NAMES = new Set(
  USER_MANAGEMENT_DEFAULT_ROLE_TEMPLATES.map((template) =>
    template.name.trim().toLowerCase(),
  ),
);

export const buildDefaultRoleRemoteId = (
  accountRemoteId: string,
  roleSlug: string,
): string => {
  return `${USER_MANAGEMENT_DEFAULT_ROLE_REMOTE_ID_PREFIX}-${accountRemoteId}-${roleSlug}`;
};

export const isDefaultBusinessRole = (params: {
  accountRemoteId: string | null;
  roleRemoteId: string;
  roleName: string;
}): boolean => {
  const normalizedRoleName = params.roleName.trim().toLowerCase();
  const hasDefaultRoleName = DEFAULT_ROLE_NAMES.has(normalizedRoleName);

  if (!params.accountRemoteId) {
    return hasDefaultRoleName;
  }

  const expectedPrefix = `${USER_MANAGEMENT_DEFAULT_ROLE_REMOTE_ID_PREFIX}-${params.accountRemoteId}-`;
  return params.roleRemoteId.startsWith(expectedPrefix) || hasDefaultRoleName;
};
