import { useAuth } from '@/shared/hooks/auth/useAuth';
import { OAuthDialog } from '@/shared/dialogs/global/OAuthDialog';
import { MigrateIntroduction } from '@vibe/ui/components/MigrateIntroduction';

interface MigrateIntroductionContainerProps {
  onContinue: () => void;
}

export function MigrateIntroductionContainer({
  onContinue,
}: MigrateIntroductionContainerProps) {
  const { isSignedIn, isLoaded } = useAuth();

  const handleAction = async () => {
    if (isSignedIn) {
      onContinue();
    } else {
      const profile = await OAuthDialog.show({});
      if (profile) {
        onContinue();
      }
    }
  };

  // Show loading while checking auth status
  if (!isLoaded) {
    return (
      <div className="max-w-2xl mx-auto py-double px-base">
        <p className="text-normal">Loading...</p>
      </div>
    );
  }

  return (
    <MigrateIntroduction isSignedIn={isSignedIn} onAction={handleAction} />
  );
}
