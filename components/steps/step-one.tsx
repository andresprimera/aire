import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StepOneProps {
  email: string;
  onChange: (email: string) => void;
}

export function StepOne({ email, onChange }: StepOneProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <h3 className="font-medium text-lg">User Email</h3>
        <p className="text-muted-foreground text-sm">
          Enter the email address for the new user.
        </p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            placeholder="m@example.com"
            type="email"
            value={email}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
