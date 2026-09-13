import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const LABELS = ["Weak", "Fair", "Good", "Strong", "Excellent"];
const COLORS = ["bg-destructive", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-500"];

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  showStrength = false,
  autoComplete = "current-password",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  showStrength?: boolean;
  autoComplete?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const score = showStrength ? scorePassword(value) : 0;

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required={required}
          minLength={showStrength ? 8 : undefined}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="mt-2">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < score ? COLORS[score] : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {LABELS[score]} · use 8+ characters with a mix of letters, numbers &amp; symbols
          </p>
        </div>
      )}
    </div>
  );
}
