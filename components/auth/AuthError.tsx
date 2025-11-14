interface AuthErrorProps {
  message: string;
}

export function AuthError({ message }: AuthErrorProps) {
  if (!message) return null;

  return (
    <div className="rounded-md bg-red-50 border border-red-200 p-3">
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
}

