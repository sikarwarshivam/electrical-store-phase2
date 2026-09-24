import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Access Denied",
  description: "You do not have administrative privileges to access this area.",
};

export default function UnauthorizedPage() {
  return (
    <Card className="w-full max-w-md border-amber-300 shadow-md">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Access Restricted</CardTitle>
        <CardDescription>
          Your account is authenticated, but does not possess the required <strong>ADMIN</strong> or <strong>SUPER_ADMIN</strong> role to view this section.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-xs text-neutral-500">
        If you are a store manager or staff member needing access, please contact the store administrator to upgrade your account permissions.
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Link href="/" className="w-full">
          <Button variant="default" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Storefront
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
