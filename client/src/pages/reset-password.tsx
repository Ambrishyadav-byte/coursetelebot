import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  // Set page title
  document.title = "Reset Password | Admin Panel";
  
  return (
    <div className="h-screen flex items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </div>
  );
}