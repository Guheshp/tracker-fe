"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "../authStore";

export default function AuthLayout({ children }) {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  return <>{children}</>;
}