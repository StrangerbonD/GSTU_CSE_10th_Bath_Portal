import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl p-8 text-center text-slate-500 shadow-sm border border-slate-200/90">Loading login form...</div>}>
      <LoginForm />
    </Suspense>
  );
}