import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $isTextNode, COMMAND_PRIORITY_LOW, KEY_DOWN_COMMAND, $nodesOfType, $isElementNode, TextNode, ElementNode } from 'lexical';
import { useEffect } from 'react';
import { $isPlaceholderNode, PlaceholderNode } from '../nodes/placeholder-node';

export function PlaceholderPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([PlaceholderNode])) {
      throw new Error('PlaceholderPlugin: PlaceholderNode not registered on editor');
    }

    // A more robust way to handle placeholder removal:
    // Listen for all updates and check if any paragraph with a placeholder has "meaningful" content
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const placeholders = $nodesOfType(PlaceholderNode);
        for (const node of placeholders) {
          const parent = node.getParent();
          if (!parent) continue;

          const children = parent.getChildren();
          let hasMeaningfulContent = false;

          for (const child of children) {
            if ($isTextNode(child) && !$isPlaceholderNode(child)) {
              const text = child.getTextContent();
              
              // A label usually looks like "Label: ". 
              // We consider it meaningful if:
              // 1. It doesn't look like a label (doesn't end with ": ")
              // 2. OR it has content AFTER the ": "
              // 3. OR it's not the first child
              
              const isFirstChild = child === children[0];
              const isLabel = isFirstChild && text.match(/^[^:]+:\s$/);
              
              if (!isLabel && text.length > 0) {
                hasMeaningfulContent = true;
                break;
              }
              
              // If it IS a label, check if it has been modified (e.g. extra spaces)
              if (isLabel && text.match(/:\s\s+$/)) {
                hasMeaningfulContent = true;
                break;
              }
            }
          }

          if (hasMeaningfulContent) {
            editor.update(() => {
              if (node.isAttached()) {
                node.remove();
              }
            });
          }
        }
      });
    });
  }, [editor]);

  useEffect(() => {
    // Handle the first keystroke more directly to ensure it feels snappy
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && selection.isCollapsed()) {
          // If the user is typing a printable character (including space)
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            const anchor = selection.anchor;
            const node = anchor.getNode();
            
            // Find the closest element (usually paragraph)
            let parent: TextNode | ElementNode | null = node;
            while (parent && !$isElementNode(parent)) {
              parent = parent.getParent();
            }
            
            if (parent) {
              const placeholder = parent.getChildren().find($isPlaceholderNode);
              if (placeholder) {
                editor.update(() => {
                  placeholder.remove();
                });
              }
            }
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}
