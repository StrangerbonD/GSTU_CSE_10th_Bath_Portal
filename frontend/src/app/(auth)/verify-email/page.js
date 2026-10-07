import { Suspense } from "react";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-slate-500 font-medium">Loading verification form...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}