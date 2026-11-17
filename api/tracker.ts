import type { AxiosInstance } from "axios";

export type Role = {
  id: string;
  name: string;
  key: string;
  type: "system" | "custom";
  permissions: string[];
  deniedPermissions: string[];
  status: string;
};
export type CategoryInput = Pick<Category, "name" | "description">;

export type Category = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  bio: string | null;
  avatar: string | null;
  deliveryEmail: string | null;
  createdBy: string | null;
  emailVerifiedAt: string | null;
  status: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
};
export type RoleInput = {
  name: string;
  permissions: string[];
  deniedPermissions: string[];
};

export function createTrackerApi({
  request,
}: {
  request: AxiosInstance["request"];
}) {
  async function send<T>(
    method: string,
    url: string,
    data?: unknown,
  ): Promise<T> {
    return (await request<T>({ method, url, data })).data;
  }
  return {
    me: async () => (await send<{ data: User }>("GET", "/auth/me")).data,
    login: (input: { email: string; password: string }) =>
      send<{ user: User }>("POST", "/auth/login", input),
    register: (input: { name: string; email: string; password: string }) =>
      send<{ user: User; message: string }>("POST", "/auth/register", input),
    logout: () => send("POST", "/auth/logout"),
    verifyEmail: (input: { email: string; otp: string }) =>
      send("POST", "/auth/verify-email", input),
    resendEmail: (email: string) =>
      send("POST", "/auth/resend-email", { email }),
    forgotPassword: (email: string) =>
      send("POST", "/auth/password/forgot", { email }),
    resetPassword: (input: {
      email: string;
      otp: string;
      newPassword: string;
    }) => send("PATCH", "/auth/password/reset", input),
    updateProfile: async (input: {
      name: string;
      username: string | null;
      bio: string | null;
    }) => (await send<{ data: User }>("PATCH", "/account/me", input)).data,
    updateAvatar: async (avatar: string) =>
      (await send<{ data: User }>("PATCH", "/account/me/avatar", { avatar }))
        .data,
    removeAvatar: async () =>
      (await send<{ data: User }>("DELETE", "/account/me/avatar")).data,
    changePassword: (input: { currentPassword: string; newPassword: string }) =>
      send("PATCH", "/account/me/password", input),
    requestEmailChange: (input: {
      newEmail: string;
      currentPassword: string;
    }) => send("POST", "/account/me/email/change", input),
    confirmEmailChange: (otp: string) =>
      send("PATCH", "/account/me/email/change", { otp }),
    createUser: (input: {
      name: string;
      email: string;
      password: string;
      deliveryEmail?: string;
    }) =>
      send<{
        data: User;
        deliveryEmail: string | null;
        deliveryMethod: "email" | "manual";
        message: string;
      }>("POST", "/users", input),
    roles: async () => (await send<{ data: Role[] }>("GET", "/roles")).data,
    createRole: (input: RoleInput) => send("POST", "/roles", input),
    updateRole: (id: string, input: RoleInput) =>
      send("PATCH", `/roles/${encodeURIComponent(id)}`, input),
    archiveRole: (id: string) =>
      send("DELETE", `/roles/${encodeURIComponent(id)}`),
    assignRole: (userId: string, roleId: string) =>
      send("PATCH", `/users/${encodeURIComponent(userId)}/role`, { roleId }),
    setUserStatus: (userId: string, status: "active" | "inactive") =>
      send("PATCH", `/users/${encodeURIComponent(userId)}/status`, { status }),
    listCategories: async () =>
      (await send<{ data: Category[] }>("GET", "/categories")).data,

    deleteCategory: (id: string) =>
      send("DELETE", `/categories/${encodeURIComponent(id)}`),

    createCategory: (input: CategoryInput) =>
      send<{data:Category}>("POST", "/categories", input),
    updateCategory: (id: string, input: Partial<CategoryInput>) =>
      send<{data:Category}>("PATCH", `/categories/${encodeURIComponent(id)}`, input),
  };
}
export type TrackerApi = ReturnType<typeof createTrackerApi>;
