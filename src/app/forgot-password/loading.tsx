export default function ForgotPasswordLoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent" />
        <p className="mt-4 text-sm text-neutral-500">Loading...</p>
      </div>
    </div>
  );
}
