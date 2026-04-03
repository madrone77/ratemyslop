export const dynamic = "force-dynamic";

import { Mail } from "lucide-react";

export default function ConfirmPage() {
  return (
    <div className="mx-auto max-w-sm px-4 sm:px-6 py-20 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
        <Mail className="h-7 w-7 text-orange-500" />
      </div>
      <h1 className="text-2xl font-bold">Check your email</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        We sent you a confirmation link. Click it to activate your account and
        start rating slop.
      </p>
      <p className="text-sm text-muted-foreground/60 mt-6">
        Didn&apos;t get it? Check your spam folder.
      </p>
    </div>
  );
}
