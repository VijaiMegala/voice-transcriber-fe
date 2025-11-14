interface AuthHeaderProps {
  title: string;
  description: string;
}

export function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="text-center">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-800">
        {title}
      </h1>
      <p className="mt-2 text-xs sm:text-sm text-gray-600">
        {description}
      </p>
    </div>
  );
}

