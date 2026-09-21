import { Suspense } from "react";
import { AuthCard } from "@/components/AuthCard";

export default function SigninPage() {
  return (
    <Suspense>
      <AuthCard mode="signin" />
    </Suspense>
  );
}
