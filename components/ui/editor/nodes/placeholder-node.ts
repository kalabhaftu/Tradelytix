import {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  TextNode,
  DOMConversionMap,
  DOMConversionOutput,
} from 'lexical';

export type SerializedPlaceholderNode = SerializedTextNode;

export class PlaceholderNode extends TextNode {
  static getType(): string {
    return 'inline-placeholder';
  }

  static clone(node: PlaceholderNode): PlaceholderNode {
    return new PlaceholderNode(node.__text, node.__key);
  }

  static importJSON(serializedNode: SerializedPlaceholderNode): PlaceholderNode {
    const node = $createPlaceholderNode(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON(): SerializedPlaceholderNode {
    return {
      ...super.exportJSON(),
      type: 'inline-placeholder',
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add('inline-placeholder');
    dom.style.color = 'hsl(var(--muted-foreground))';
    dom.style.opacity = '0.5';
    dom.style.fontStyle = 'italic';
    dom.style.pointerEvents = 'none';
    dom.style.userSelect = 'none';
    return dom;
  }

  updateDOM(prevNode: any, dom: HTMLElement, config: EditorConfig): boolean {
    return super.updateDOM(prevNode, dom, config);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.classList.contains('inline-placeholder')) {
          return {
            conversion: convertPlaceholderElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  isTextEntity(): boolean {
    return true;
  }
}

function convertPlaceholderElement(domNode: HTMLElement): DOMConversionOutput {
  const text = domNode.textContent;
  if (text !== null) {
    const node = $createPlaceholderNode(text);
    return { node };
  }
  return { node: null };
}

export function $createPlaceholderNode(text: string): PlaceholderNode {
  return new PlaceholderNode(text).setMode('token');
}

export function $isPlaceholderNode(node: LexicalNode | null | undefined): node is PlaceholderNode {
  return node instanceof PlaceholderNode;
}
