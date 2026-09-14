export function PasswordResetSuccessStep({ onReturnToLogin }) {
  return <div className="space-y-5"><p className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-700">Your password has been changed. You can now sign in.</p><button type="button" onClick={onReturnToLogin} className="w-full rounded-xl bg-[#173f75] px-4 py-2.5 text-xl font-semibold text-white">Return to sign-in</button></div>
}
