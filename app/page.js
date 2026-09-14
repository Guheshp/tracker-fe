"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "./authStore";
import AuthShimmer from "./components/AuthShimmer";

export default function Home() {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? "/dashboard" : "/login");
    }
  }, [user, isLoading, router]);

  return <AuthShimmer />;
}