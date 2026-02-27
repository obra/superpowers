import type {
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  ArrayFieldTemplateProps,
  ArrayFieldItemTemplateProps,
} from '@rjsf/utils';
import { PlusIcon, XIcon } from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';
import { useTranslation } from 'react-i18next';
import { toPrettyCase } from '@/shared/lib/string';

// FieldTemplate - Two-column layout matching settings dialog styling
export const FieldTemplate = (props: FieldTemplateProps) => {
  const {
    children,
    rawErrors = [],
    rawHelp,
    rawDescription,
    label,
    required,
    schema,
  } = props;

  if (schema.type === 'object') {
    return children;
  }

  return (
    <div className="grid grid-cols-2 gap-4 py-4">
      {/* Left column: Label and description */}
      <div className="space-y-1">
        {label && (
          <div className="text-sm font-medium text-normal">
            {toPrettyCase(label)}
            {required && <span className="text-error ml-1">*</span>}
          </div>
        )}

        {rawDescription && (
          <p className="text-sm text-low leading-relaxed">{rawDescription}</p>
        )}

        {rawHelp && (
          <p className="text-sm text-low leading-relaxed">{rawHelp}</p>
        )}
      </div>

      {/* Right column: Field content */}
      <div className="space-y-2">
        {children}

        {rawErrors.length > 0 && (
          <div className="space-y-1">
            {rawErrors.map((error, index) => (
              <p key={index} className="text-sm text-error">
                {error}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ObjectFieldTemplate - Container for object fields
export const ObjectFieldTemplate = (props: ObjectFieldTemplateProps) => {
  const { properties } = props;

  return (
    <div className="divide-y divide-border">
      {properties.map((element) => (
        <div key={element.name}>{element.content}</div>
      ))}
    </div>
  );
};

// ArrayFieldTemplate - Array field with add button
export const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const { t } = useTranslation('common');
  const { canAdd, items, onAddClick, disabled, readonly } = props;

  if (!items || (items.length === 0 && !canAdd)) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>{items}</div>

      {canAdd && (
        <button
          type="button"
          onClick={onAddClick}
          disabled={disabled || readonly}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-base py-half rounded-sm text-sm font-medium',
            'bg-secondary border border-border text-normal hover:bg-secondary/80',
            'focus:outline-none focus:ring-1 focus:ring-brand',
            'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          )}
        >
          <PlusIcon className="size-icon-xs" weight="bold" />
          {t('buttons.addItem')}
        </button>
      )}
    </div>
  );
};

// ArrayFieldItemTemplate - Individual array item with remove button
export const ArrayFieldItemTemplate = (props: ArrayFieldItemTemplateProps) => {
  const { children, buttonsProps, disabled, readonly } = props;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">{children}</div>

      {buttonsProps.hasRemove && (
        <button
          type="button"
          onClick={buttonsProps.onRemoveItem}
          disabled={disabled || readonly || buttonsProps.disabled}
          className={cn(
            'h-8 w-8 p-0 flex items-center justify-center shrink-0 rounded-sm',
            'text-low hover:text-error hover:bg-error/10',
            'focus:outline-none focus:ring-1 focus:ring-brand',
            'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          )}
          title="Remove item"
        >
          <XIcon className="size-icon-xs" weight="bold" />
        </button>
      )}
    </div>
  );
};

// FormTemplate - Root form container
export const FormTemplate = ({ children }: React.PropsWithChildren) => {
  return <div className="w-full">{children}</div>;
};
