import type { AxiosInstance } from "axios";

export type DirectoryUser = {
  id: string; name: string; email: string; username: string | null; avatar: string | null;
  status: "active" | "inactive"; emailVerifiedAt: string | null; createdAt: string;
  role: { id: string; name: string; key: string; type: "system" | "custom"; status: string };
};
export type UserDirectory = { success: true; data: DirectoryUser[]; pagination: { page: number; limit: number; total: number; pageCount: number } };
export const createAdminApi = ({ request }: { request: AxiosInstance["request"] }) => ({
  listUsers: async (params: { page: number; limit: number; search: string; status?: "active" | "inactive"; roleId?: string }, signal?: AbortSignal) =>
    (await request<UserDirectory>({ method: "GET", url: "/admin/users", params, signal })).data,
});
