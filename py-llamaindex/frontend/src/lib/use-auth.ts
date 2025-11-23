import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";

export default function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      return (await apiClient.get("/api/auth/profile")).data?.user;
    },
  });

  return {
    user,
    isLoading,
  };
}

export function getLoginUrl() {
  return `${import.meta.env.VITE_API_HOST}/api/auth/login?returnTo=${window.location}`;
}

export function getSignupUrl() {
  return `${import.meta.env.VITE_API_HOST}/api/auth/login?screen_hint=signup`;
}

export function getLogoutUrl() {
  return `${import.meta.env.VITE_API_HOST}/api/auth/logout?returnTo=${window.location.origin}`;
}
