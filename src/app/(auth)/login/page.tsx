import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { LoadingState } from "@/components/layout/loading-state";

export const metadata = {
  title: "Account Sign In",
  description: "Sign in to access your customer or administrative account.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading login..." />}>
      <LoginForm />
    </Suspense>
  );
}
