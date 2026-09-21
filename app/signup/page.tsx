import { Suspense } from "react";
import { AuthCard } from "@/components/AuthCard";

export default function SignupPage() {
  return (
    <Suspense>
      <AuthCard mode="signup" />
    </Suspense>
  );
}
