import { cn } from "@/lib/utils";
import { generateAvatarUri } from "@/lib/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GeneratedAvatarProps {
  seed: string;
  className?: string;
  variant: "botttsNeutral" | "initials";
}

export const GeneratedAvatar = ({
  seed,
  className,
  variant
}: GeneratedAvatarProps) => {
  const avatarUri = generateAvatarUri({ seed, variant });

  return (
    <Avatar className={cn(className)}>
      <AvatarImage src={avatarUri} alt="Avatar" />
      <AvatarFallback>{seed.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
};
