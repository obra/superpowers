import { useCallback } from 'react';
import { NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import { PrCommentCard } from './pr-comment-card';
import {
  createDecoratorNode,
  type DecoratorNodeConfig,
  type GeneratedDecoratorNode,
} from './create-decorator-node';

/**
 * Normalized comment data stored in the node.
 * Uses string IDs (bigint converted) and consistent field names.
 */
export interface NormalizedComment {
  id: string;
  comment_type: 'general' | 'review';
  author: string;
  body: string;
  created_at: string;
  url?: string | null;
  // Review-specific (optional)
  path?: string;
  line?: number | null;
  diff_hunk?: string | null;
}

export type SerializedPrCommentNode = Spread<
  NormalizedComment,
  SerializedLexicalNode
>;

function PrCommentComponent({
  data,
  onDoubleClickEdit,
}: {
  data: NormalizedComment;
  nodeKey: NodeKey;
  onDoubleClickEdit: (event: React.MouseEvent) => void;
}): JSX.Element {
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      // Open URL in new tab if available
      if (data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      }
    },
    [data.url]
  );

  return (
    <PrCommentCard
      author={data.author}
      body={data.body}
      createdAt={data.created_at}
      url={data.url}
      commentType={data.comment_type}
      path={data.path}
      line={data.line}
      diffHunk={data.diff_hunk}
      variant="full"
      onClick={handleClick}
      onDoubleClick={onDoubleClickEdit}
    />
  );
}

const config: DecoratorNodeConfig<NormalizedComment> = {
  type: 'github-comment',
  serialization: {
    format: 'fenced',
    language: 'gh-comment',
    serialize: (data) => JSON.stringify(data, null, 2),
    deserialize: (content) => JSON.parse(content),
    validate: (data) =>
      !!(data.id && data.comment_type && data.author && data.body),
  },
  component: PrCommentComponent,
  exportDOM: (data) => {
    const span = document.createElement('span');
    span.setAttribute('data-pr-comment-id', data.id);
    span.textContent = `PR comment by @${data.author}: ${data.body}`;
    return span;
  },
};

const result = createDecoratorNode(config);

export const PrCommentNode = result.Node;
export type PrCommentNodeInstance = GeneratedDecoratorNode<NormalizedComment>;
export const $createPrCommentNode = result.createNode;
export const $isPrCommentNode = result.isNode;
export const [PR_COMMENT_EXPORT_TRANSFORMER, PR_COMMENT_TRANSFORMER] =
  result.transformers;
