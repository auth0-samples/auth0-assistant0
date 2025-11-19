import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";

export default function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      return (await apiClient.get("/api/user/profile")).data?.user;
    },
  });

  return {
    user,
    isLoading,
  };
}

export function getLoginUrl() {
  return `/api/auth/login?returnTo=${window.location}`;
}

export function getSignupUrl() {
  return `/api/auth/login?screen_hint=signup`;
}

export function getLogoutUrl() {
  return `/api/auth/logout?returnTo=${window.location.origin}`;
}
