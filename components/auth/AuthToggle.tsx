interface AuthToggleProps {
  mode: "signin" | "signup";
  onToggle: () => void;
  disabled?: boolean;
}

export function AuthToggle({ mode, onToggle, disabled = false }: AuthToggleProps) {
  return (
    <div className="text-center text-sm">
      <span className="text-gray-600">
        {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
      </span>
      <button
        type="button"
        onClick={onToggle}
        className="text-pink-600 hover:text-pink-700 hover:underline font-medium transition-colors"
        disabled={disabled}
      >
        {mode === "signin" ? "Sign Up" : "Sign In"}
      </button>
    </div>
  );
}

