import { NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './RadixTooltip';
import {
  createDecoratorNode,
  type DecoratorNodeConfig,
  type GeneratedDecoratorNode,
} from './create-decorator-node';

/**
 * Data model for a detected UI component.
 * Serialized as JSON inside a ```vk-component fenced code block.
 */
export interface ComponentInfoData {
  framework: string; // 'react', 'vue', 'svelte', 'astro', 'html'
  component: string; // Component name: 'Button', 'UserProfile'
  tagName?: string; // HTML tag: 'button', 'div', 'span'
  file?: string; // File path: 'src/components/Button.tsx'
  line?: number; // Line number
  column?: number; // Column number
  cssClass?: string; // CSS class: '.btn-primary'
  stack?: Array<{ name: string; file?: string }>; // Component hierarchy
  htmlPreview: string; // HTML snippet: '<button class="btn">Click</button>'
}

export type SerializedComponentInfoNode = Spread<
  ComponentInfoData,
  SerializedLexicalNode
>;

function toRelativePath(absolutePath: string): string {
  const worktreeMatch = absolutePath.match(/\/worktrees\/[^/]+\/[^/]+\/(.+)$/);
  if (worktreeMatch) return worktreeMatch[1];

  const srcMatch = absolutePath.match(/\/(src\/.+)$/);
  if (srcMatch) return srcMatch[1];

  if (absolutePath.startsWith('/') && absolutePath.split('/').length > 4) {
    return absolutePath.split('/').slice(-3).join('/');
  }

  return absolutePath;
}

function ComponentInfoComponent({
  data,
  onDoubleClickEdit,
}: {
  data: ComponentInfoData;
  nodeKey: NodeKey;
  onDoubleClickEdit: (event: React.MouseEvent) => void;
}): JSX.Element {
  const displayName = data.component || data.tagName || 'unknown';

  let file = data.file;
  let line = data.line;
  let column = data.column;

  if (!file && data.stack?.length) {
    const firstFile = data.stack[0]?.file;
    if (firstFile) {
      const match = firstFile.match(
        /^(.+\.(?:tsx|ts|jsx|js|vue|svelte)):(\d+):(\d+)$/
      );
      if (match) {
        file = match[1];
        line = parseInt(match[2], 10);
        column = parseInt(match[3], 10);
      } else {
        file = firstFile;
      }
    }
  }

  const displayPath = file ? toRelativePath(file) : null;
  const fileLine = displayPath
    ? line != null
      ? `${displayPath}:${line}`
      : displayPath
    : null;

  const fileName = file?.split('/').pop();
  const badgeLabel = fileName
    ? line != null
      ? column != null
        ? `${fileName}:${line}:${column}`
        : `${fileName}:${line}`
      : fileName
    : displayName;

  const stackBreadcrumb =
    data.stack && data.stack.length > 1
      ? data.stack.map((s) => `<${s.name}/>`).join(' \u2190 ')
      : null;

  return (
    <TooltipProvider delayDuration={350}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex items-center gap-half px-half bg-muted rounded-sm border border-border text-xs font-ibm-plex-mono text-muted-foreground cursor-default select-none hover:border-muted-foreground transition-colors"
            onDoubleClick={onDoubleClickEdit}
          >
            {badgeLabel}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[400px] px-plusfifty py-base"
          style={{ backgroundColor: 'hsl(var(--bg-panel))' }}
        >
          <div className="flex flex-col gap-half">
            <div className="flex items-center gap-base">
              <span className="text-sm text-foreground">{data.component}</span>
              <span className="text-xs text-muted-foreground bg-muted px-half rounded-sm">
                {data.framework}
              </span>
            </div>

            {fileLine && (
              <span className="text-xs font-ibm-plex-mono text-muted-foreground break-all leading-relaxed">
                {fileLine}
              </span>
            )}

            {data.cssClass && (
              <span className="text-xs font-ibm-plex-mono text-muted-foreground break-all">
                {data.cssClass}
              </span>
            )}

            {stackBreadcrumb && (
              <div className="border-t border-border pt-half">
                <span className="text-xs text-muted-foreground leading-relaxed break-words">
                  {stackBreadcrumb}
                </span>
              </div>
            )}

            {data.htmlPreview && (
              <div className="border-t border-border pt-half">
                <pre className="text-xs font-ibm-plex-mono text-muted-foreground whitespace-pre overflow-x-auto max-h-[120px] overflow-y-auto leading-relaxed">
                  {data.htmlPreview}
                </pre>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const config: DecoratorNodeConfig<ComponentInfoData> = {
  type: 'component-info',
  serialization: {
    format: 'fenced',
    language: 'vk-component',
    serialize: (data) => JSON.stringify(data),
    deserialize: (content) => JSON.parse(content),
    validate: (data) =>
      !!(data.framework && data.component && data.htmlPreview),
  },
  component: ComponentInfoComponent,
  domStyle: {
    display: 'inline-block',
    paddingLeft: '2px',
    paddingRight: '2px',
    verticalAlign: 'bottom',
  },
  keyboardSelectable: false,
  exportDOM: (data) => {
    const span = document.createElement('span');
    span.setAttribute('data-component-info', data.component);
    span.textContent = `<${data.component}/>`;
    return span;
  },
};

const result = createDecoratorNode(config);

export const ComponentInfoNode = result.Node;
export type ComponentInfoNodeInstance =
  GeneratedDecoratorNode<ComponentInfoData>;
export const $createComponentInfoNode = result.createNode;
export const $isComponentInfoNode = result.isNode;
export const [COMPONENT_INFO_EXPORT_TRANSFORMER, COMPONENT_INFO_TRANSFORMER] =
  result.transformers;
