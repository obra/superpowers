import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  GearIcon,
  GitBranchIcon,
  BuildingsIcon,
  CloudIcon,
  CpuIcon,
  PlugIcon,
  BroadcastIcon,
  CaretLeftIcon,
  XIcon,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { create, useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/shared/lib/modals';

import { cn } from '@/shared/lib/utils';
import { SettingsSection } from './settings/SettingsSection';
import type {
  SettingsSectionType,
  SettingsSectionInitialState,
} from './settings/SettingsSection';
import {
  SettingsDirtyProvider,
  useSettingsDirty,
} from './settings/SettingsDirtyContext';
import { ConfirmDialog } from '@vibe/ui/components/ConfirmDialog';

const SETTINGS_SECTIONS: {
  id: SettingsSectionType;
  icon: Icon;
}[] = [
  { id: 'general', icon: GearIcon },
  { id: 'repos', icon: GitBranchIcon },
  { id: 'organizations', icon: BuildingsIcon },
  { id: 'remote-projects', icon: CloudIcon },
  { id: 'agents', icon: CpuIcon },
  { id: 'mcp', icon: PlugIcon },
  { id: 'relay', icon: BroadcastIcon },
];

export interface SettingsDialogProps {
  initialSection?: SettingsSectionType;
  initialState?: SettingsSectionInitialState[SettingsSectionType];
  sections?: SettingsSectionType[];
}

interface SettingsDialogContentProps {
  initialSection?: SettingsSectionType;
  initialState?: SettingsSectionInitialState[SettingsSectionType];
  sections?: SettingsSectionType[];
  onClose: () => void;
}

function SettingsDialogContent({
  initialSection,
  initialState,
  sections,
  onClose,
}: SettingsDialogContentProps) {
  const { t } = useTranslation('settings');
  const { isDirty } = useSettingsDirty();
  const availableSections = useMemo(() => {
    if (!sections || sections.length === 0) {
      return SETTINGS_SECTIONS;
    }

    const allowed = new Set(sections);
    const filtered = SETTINGS_SECTIONS.filter((section) =>
      allowed.has(section.id)
    );
    return filtered.length > 0 ? filtered : SETTINGS_SECTIONS;
  }, [sections]);

  const resolvedInitialSection = useMemo<SettingsSectionType>(() => {
    if (
      initialSection &&
      availableSections.some((section) => section.id === initialSection)
    ) {
      return initialSection;
    }

    return availableSections[0]?.id ?? 'general';
  }, [availableSections, initialSection]);

  const [activeSection, setActiveSection] = useState<SettingsSectionType>(
    resolvedInitialSection
  );
  // On mobile, null means show the nav menu, a section means show that section
  const [mobileShowContent, setMobileShowContent] = useState<boolean>(
    initialSection === resolvedInitialSection
  );
  const isConfirmingRef = useRef(false);

  const handleCloseWithConfirmation = useCallback(async () => {
    if (isConfirmingRef.current) return;

    if (isDirty) {
      isConfirmingRef.current = true;
      try {
        const result = await ConfirmDialog.show({
          title: t('settings.unsavedChanges.title'),
          message: t('settings.unsavedChanges.message'),
          confirmText: t('settings.unsavedChanges.discard'),
          cancelText: t('settings.unsavedChanges.cancel'),
          variant: 'destructive',
        });
        if (result === 'confirmed') {
          onClose();
        }
      } finally {
        isConfirmingRef.current = false;
      }
    } else {
      onClose();
    }
  }, [isDirty, onClose, t]);

  const handleSectionSelect = (sectionId: SettingsSectionType) => {
    setActiveSection(sectionId);
    setMobileShowContent(true);
  };

  const handleMobileBack = () => {
    setMobileShowContent(false);
  };

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseWithConfirmation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCloseWithConfirmation]);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 animate-in fade-in-0 duration-200"
        onClick={handleCloseWithConfirmation}
      />
      {/* Dialog wrapper - handles positioning */}
      <div
        className={cn(
          'fixed z-[9999]',
          // Mobile: full screen
          'inset-0',
          // Desktop: centered with fixed size
          'md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2'
        )}
      >
        {/* Dialog content - handles animation */}
        <div
          className={cn(
            'h-full w-full flex overflow-hidden',
            'bg-panel/95 backdrop-blur-sm shadow-lg',
            'animate-in fade-in-0 slide-in-from-bottom-4 duration-200',
            // Mobile: full screen, no rounded corners
            'rounded-none border-0',
            // Desktop: fixed size with rounded corners
            'md:w-[900px] md:h-[700px] md:rounded-sm md:border md:border-border/50'
          )}
        >
          {/* Sidebar - hidden on mobile when showing content */}
          <div
            className={cn(
              'bg-secondary/80 border-r border-border flex flex-col',
              // Mobile: full width, hidden when showing content
              'w-full',
              mobileShowContent && 'hidden',
              // Desktop: fixed width sidebar, always visible
              'md:w-56 md:block'
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-high">
                {t('settings.layout.nav.title')}
              </h2>
              {/* Close button - mobile only */}
              <button
                onClick={handleCloseWithConfirmation}
                className="p-1 rounded-sm hover:bg-secondary text-low hover:text-normal md:hidden"
              >
                <XIcon className="size-icon-sm" weight="bold" />
              </button>
            </div>
            {/* Navigation */}
            <nav className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto">
              {availableSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionSelect(section.id)}
                    className={cn(
                      'flex items-center gap-3 text-left px-3 py-2 rounded-sm text-sm transition-colors',
                      isActive
                        ? 'bg-brand/10 text-brand font-medium'
                        : 'text-normal hover:bg-primary/10'
                    )}
                  >
                    <Icon className="size-icon-sm shrink-0" weight="bold" />
                    <span className="truncate">
                      {t(`settings.layout.nav.${section.id}`)}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
          {/* Content - hidden on mobile when showing nav */}
          <div
            className={cn(
              'flex-1 flex flex-col relative overflow-hidden',
              // Mobile: full width, hidden when showing nav
              !mobileShowContent && 'hidden',
              // Desktop: always visible
              'md:flex'
            )}
          >
            {/* Mobile header with back button */}
            <div className="flex items-center gap-2 p-3 border-b border-border md:hidden">
              <button
                onClick={handleMobileBack}
                className="p-1 rounded-sm hover:bg-secondary text-low hover:text-normal"
              >
                <CaretLeftIcon className="size-icon-sm" weight="bold" />
              </button>
              <span className="text-sm font-medium text-high">
                {t(`settings.layout.nav.${activeSection}`)}
              </span>
              <button
                onClick={handleCloseWithConfirmation}
                className="ml-auto p-1 rounded-sm hover:bg-secondary text-low hover:text-normal"
              >
                <XIcon className="size-icon-sm" weight="bold" />
              </button>
            </div>
            {/* Section content */}
            <div className="flex-1 overflow-y-auto">
              <SettingsSection
                type={activeSection}
                onClose={handleCloseWithConfirmation}
                initialState={initialState}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const SettingsDialogImpl = create<SettingsDialogProps>(
  ({ initialSection, initialState, sections }) => {
    const modal = useModal();
    const handleClose = useCallback(() => {
      modal.hide();
      modal.resolve();
      modal.remove();
    }, [modal]);

    return createPortal(
      <SettingsDirtyProvider>
        <SettingsDialogContent
          initialSection={initialSection}
          initialState={initialState}
          sections={sections}
          onClose={handleClose}
        />
      </SettingsDirtyProvider>,
      document.body
    );
  }
);

export const SettingsDialog = defineModal<SettingsDialogProps | void, void>(
  SettingsDialogImpl
);
