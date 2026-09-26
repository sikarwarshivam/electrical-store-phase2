import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";
import { LoadingState } from "@/components/layout/loading-state";

export const metadata = {
  title: "Create Customer Account",
  description: "Create a customer account for faster checkout and order history.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading registration..." />}>
      <RegisterForm />
    </Suspense>
  );
}
