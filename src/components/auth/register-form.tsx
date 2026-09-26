"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { registerSchema, RegisterInput } from "@/schemas/auth";
import { registerCustomerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { AlertCircle, Lock, Mail, Phone, UserRound } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);
    setServerError(null);

    try {
      const result = await registerCustomerAction(data);

      if (!result.success) {
        setServerError(result.error || "Unable to create your account.");
        return;
      }

      const signInResult = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl,
      });

      if (signInResult?.ok) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      setServerError(
        "Your account was created. Please sign in with your new credentials."
      );
      router.push(
        "/login?callbackUrl=" + encodeURIComponent(callbackUrl)
      );
    } catch {
      setServerError(
        "Unable to create your account right now. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Create your account
        </CardTitle>
        <CardDescription>
          Create a customer account to save addresses, wishlist items, and order history.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {serverError ? (
            <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Full name
            </label>
            <div className="relative">
              <UserRound className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                type="text"
                autoComplete="name"
                placeholder="Shivam Singh"
                className="pl-9"
                error={!!errors.name}
                {...register("name")}
              />
            </div>
            {errors.name ? (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className="pl-9"
                error={!!errors.email}
                {...register("email")}
              />
            </div>
            {errors.email ? (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Phone (optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                placeholder="9876543210"
                className="pl-9"
                error={!!errors.phone}
                {...register("phone")}
              />
            </div>
            {errors.phone ? (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="pl-9"
                error={!!errors.password}
                {...register("password")}
              />
            </div>
            {errors.password ? (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            ) : (
              <p className="text-xs text-neutral-500">
                Use at least 8 characters with one uppercase letter and one number.
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create account
          </Button>

          <p className="text-center text-xs text-neutral-500">
            Already have an account?{" "}
            <a
              href={
                "/login?callbackUrl=" + encodeURIComponent(callbackUrl)
              }
              className="font-semibold text-amber-700 hover:underline dark:text-amber-400"
            >
              Sign in
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
