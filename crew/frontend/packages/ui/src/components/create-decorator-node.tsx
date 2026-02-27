import {
  DecoratorNode,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  $createTextNode,
  $getNodeByKey,
  DOMConversionMap,
  DOMExportOutput,
  $createParagraphNode,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  TextMatchTransformer,
  MultilineElementTransformer,
  Transformer,
} from '@lexical/markdown';
import { useCallback } from 'react';

// ====== Types ======

export type InlineSerialization<T> = {
  format: 'inline';
  pattern: RegExp; // e.g., /!\[([^\]]*)\]\(([^)]+)\)/
  trigger: string; // e.g., ')'
  serialize: (data: T) => string;
  deserialize: (match: RegExpMatchArray) => T;
};

export type FencedSerialization<T> = {
  format: 'fenced';
  language: string; // e.g., 'gh-comment'
  serialize: (data: T) => string;
  deserialize: (content: string) => T;
  validate?: (data: T) => boolean;
};

export type SerializationConfig<T> =
  | InlineSerialization<T>
  | FencedSerialization<T>;

/** Interface for the generated node instance */
export interface GeneratedDecoratorNode<T> extends DecoratorNode<JSX.Element> {
  getData(): T;
}

/** Type for the generated node class constructor */
export type GeneratedDecoratorNodeClass<T> = {
  new (data: T, key?: NodeKey): GeneratedDecoratorNode<T>;
  getType(): string;
  clone(node: GeneratedDecoratorNode<T>): GeneratedDecoratorNode<T>;
  importJSON(
    json: Spread<{ data: T }, SerializedLexicalNode>
  ): GeneratedDecoratorNode<T>;
  importDOM(): DOMConversionMap | null;
  // Required by LexicalNode for registration
  transform(): ((node: LexicalNode) => void) | null;
};

export interface DecoratorNodeConfig<T> {
  type: string;
  serialization: SerializationConfig<T>;
  component: React.ComponentType<{
    data: T;
    nodeKey: NodeKey;
    onDoubleClickEdit: (event: React.MouseEvent) => void;
  }>;
  // Optional DOM import/export
  // importDOM receives the createNode function to avoid circular reference issues
  importDOM?: (createNode: (data: T) => LexicalNode) => DOMConversionMap | null;
  exportDOM?: (data: T) => HTMLElement;
  // Optional inline styles for the wrapper DOM element (for cursor spacing)
  domStyle?: Partial<CSSStyleDeclaration>;
  // If false, arrow keys skip over the node instead of selecting it (default: true)
  keyboardSelectable?: boolean;
}

export interface DecoratorNodeResult<T> {
  Node: GeneratedDecoratorNodeClass<T>;
  createNode: (data: T) => GeneratedDecoratorNode<T>;
  isNode: (
    node: LexicalNode | null | undefined
  ) => node is GeneratedDecoratorNode<T>;
  transformers: Transformer[]; // 1 for inline, 2 for fenced
}

// ====== Factory Function ======

export function createDecoratorNode<T>(
  config: DecoratorNodeConfig<T>
): DecoratorNodeResult<T> {
  const {
    type,
    serialization,
    component: UserComponent,
    importDOM: importDOMConfig,
    exportDOM,
    domStyle,
    keyboardSelectable = true,
  } = config;

  // Holder for createNode function - needs to be assigned after class definition
  // but used via closure in the static importDOM method
  const nodeFactoryRef: { current: ((data: T) => GeneratedNode) | null } = {
    current: null,
  };

  // Generated node class
  class GeneratedNode extends DecoratorNode<JSX.Element> {
    __data: T;

    static getType(): string {
      return type;
    }

    static clone(node: GeneratedNode): GeneratedNode {
      return new GeneratedNode(node.__data, node.__key);
    }

    constructor(data: T, key?: NodeKey) {
      super(key);
      this.__data = data;
    }

    createDOM(): HTMLElement {
      const el = document.createElement('span');
      if (domStyle) {
        Object.assign(el.style, domStyle);
      }
      return el;
    }

    updateDOM(): false {
      return false;
    }

    static importJSON(
      json: Spread<{ data: T }, SerializedLexicalNode>
    ): GeneratedNode {
      return new GeneratedNode(json.data);
    }

    exportJSON(): Spread<{ data: T }, SerializedLexicalNode> {
      return { type, version: 1, data: this.__data };
    }

    static importDOM(): DOMConversionMap | null {
      // nodeFactoryRef.current will be assigned by the time importDOM is called at runtime
      return importDOMConfig && nodeFactoryRef.current
        ? importDOMConfig(nodeFactoryRef.current)
        : null;
    }

    exportDOM(): DOMExportOutput {
      if (exportDOM) {
        return { element: exportDOM(this.__data) };
      }
      const span = document.createElement('span');
      span.textContent = `[${type}]`;
      return { element: span };
    }

    getData(): T {
      return this.__data;
    }

    decorate(): JSX.Element {
      return (
        <NodeComponent
          data={this.__data}
          nodeKey={this.__key}
          isNode={isNode}
          serialization={serialization}
          UserComponent={UserComponent}
        />
      );
    }

    isInline(): boolean {
      return true;
    }

    isKeyboardSelectable(): boolean {
      return keyboardSelectable;
    }
  }

  // Type guard
  function isNode(node: LexicalNode | null | undefined): node is GeneratedNode {
    return node instanceof GeneratedNode;
  }

  // Factory function
  function createNode(data: T): GeneratedNode {
    return new GeneratedNode(data);
  }

  // Assign to ref for use in importDOM
  nodeFactoryRef.current = createNode;

  // Wrapper component with double-click edit
  function NodeComponent({
    data,
    nodeKey,
    isNode: isNodeFn,
    serialization: serConfig,
    UserComponent: Component,
  }: {
    data: T;
    nodeKey: NodeKey;
    isNode: (node: LexicalNode | null | undefined) => node is GeneratedNode;
    serialization: SerializationConfig<T>;
    UserComponent: React.ComponentType<{
      data: T;
      nodeKey: NodeKey;
      onDoubleClickEdit: (event: React.MouseEvent) => void;
    }>;
  }) {
    const [editor] = useLexicalComposerContext();
    const handleDoubleClick = useCallback(
      (event: React.MouseEvent) => {
        if (!editor.isEditable()) return;

        event.preventDefault();
        event.stopPropagation();

        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if (isNodeFn(node)) {
            const markdownText =
              serConfig.format === 'fenced'
                ? '```' +
                  serConfig.language +
                  '\n' +
                  serConfig.serialize(node.getData()) +
                  '\n```'
                : serConfig.serialize(node.getData());
            const textNode = $createTextNode(markdownText);
            node.replace(textNode);
            textNode.select(markdownText.length, markdownText.length);
          }
        });
      },
      [editor, nodeKey, isNodeFn, serConfig]
    );

    return (
      <Component
        data={data}
        nodeKey={nodeKey}
        onDoubleClickEdit={handleDoubleClick}
      />
    );
  }

  // Generate transformers based on serialization format
  const transformers: Transformer[] =
    serialization.format === 'inline'
      ? [
          createInlineTransformer(
            GeneratedNode,
            isNode,
            serialization,
            createNode
          ),
        ]
      : createFencedTransformers(
          GeneratedNode,
          isNode,
          serialization,
          createNode
        );

  return {
    Node: GeneratedNode as GeneratedDecoratorNodeClass<T>,
    createNode,
    isNode,
    transformers,
  };
}

// ====== Transformer Generators ======

function createInlineTransformer<T>(
  NodeClass: unknown,
  isNode: (node: LexicalNode | null | undefined) => boolean,
  config: InlineSerialization<T>,
  createNode: (data: T) => LexicalNode
): TextMatchTransformer {
  return {
    dependencies: [NodeClass as typeof LexicalNode],
    export: (node) => {
      if (isNode(node)) {
        return config.serialize(
          (node as unknown as { getData(): T }).getData()
        );
      }
      return null;
    },
    importRegExp: config.pattern,
    regExp: new RegExp(config.pattern.source + '$'),
    replace: (textNode, match) => {
      const data = config.deserialize(match);
      textNode.replace(createNode(data));
    },
    trigger: config.trigger,
    type: 'text-match',
  };
}

function createFencedTransformers<T>(
  NodeClass: unknown,
  isNode: (node: LexicalNode | null | undefined) => boolean,
  config: FencedSerialization<T>,
  createNode: (data: T) => LexicalNode
): [TextMatchTransformer, MultilineElementTransformer] {
  // Export transformer (TextMatchTransformer for DecoratorNodes)
  const exportTransformer: TextMatchTransformer = {
    dependencies: [NodeClass as typeof LexicalNode],
    export: (node) => {
      if (!isNode(node)) return null;
      // Add newlines before and after to ensure the code block is on its own lines
      return (
        '\n```' +
        config.language +
        '\n' +
        config.serialize((node as unknown as { getData(): T }).getData()) +
        '\n```\n'
      );
    },
    importRegExp: /(?!)/, // Never match
    regExp: /(?!)$/, // Never match
    replace: () => {},
    trigger: '',
    type: 'text-match',
  };

  // Import transformer (MultilineElementTransformer)
  const importTransformer: MultilineElementTransformer = {
    type: 'multiline-element',
    dependencies: [NodeClass as typeof LexicalNode],
    regExpStart: new RegExp(`^\`\`\`${config.language}$`),
    regExpEnd: { optional: true, regExp: /^```$/ },
    replace: (
      rootNode,
      _children,
      _startMatch,
      endMatch,
      linesInBetween,
      isImport
    ) => {
      if (!isImport || !endMatch || !linesInBetween?.length) return false;
      try {
        const content = linesInBetween.join('\n');
        const data = config.deserialize(content);
        if (config.validate && !config.validate(data)) {
          console.error(
            `Invalid ${config.language} payload: validation failed`
          );
          return false;
        }
        const node = createNode(data);
        const paragraph = $createParagraphNode();
        paragraph.append(node);
        rootNode.append(paragraph);
      } catch (e) {
        console.error(`Failed to parse ${config.language}:`, e);
        return false;
      }
    },
  };

  return [exportTransformer, importTransformer];
}
