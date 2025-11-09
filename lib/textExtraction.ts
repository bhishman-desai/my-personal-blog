/**
 * Extract plain text from raw MDX source
 * This extracts text from markdown before it's compiled to React
 */
export function extractTextFromMDX(rawMDX: string): string {
  // Remove frontmatter (content between --- markers)
  let content = rawMDX.replace(/^---[\s\S]*?---\n/, '');
  
  // Remove markdown code blocks (```code```)
  content = content.replace(/```[\s\S]*?```/g, '');
  
  // Remove inline code (`code`)
  content = content.replace(/`[^`]+`/g, '');
  
  // Remove markdown links but keep the text [text](url) -> text
  content = content.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove markdown images ![alt](url) -> alt text
  content = content.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1');
  
  // Remove markdown headers (# ## ### etc) but keep the text
  content = content.replace(/^#{1,6}\s+(.+)$/gm, '$1');
  
  // Remove markdown bold/italic markers
  content = content.replace(/\*\*([^\*]+)\*\*/g, '$1');
  content = content.replace(/\*([^\*]+)\*/g, '$1');
  content = content.replace(/__([^_]+)__/g, '$1');
  content = content.replace(/_([^_]+)_/g, '$1');
  
  // Remove markdown list markers
  content = content.replace(/^[\s]*[-*+]\s+/gm, '');
  content = content.replace(/^[\s]*\d+\.\s+/gm, '');
  
  // Remove markdown blockquotes
  content = content.replace(/^>\s+/gm, '');
  
  // Remove HTML tags if any
  content = content.replace(/<[^>]+>/g, '');
  
  return content;
}

/**
 * Extract plain text from MDX content (React element tree)
 * This function recursively extracts text from React elements
 * @deprecated Use extractTextFromMDX for better results
 */
export function extractTextFromReactNode(node: any): string {
  if (typeof node === 'string') {
    return node.trim() + ' ';
  }
  
  if (typeof node === 'number') {
    return String(node) + ' ';
  }
  
  if (!node) {
    return '';
  }
  
  if (Array.isArray(node)) {
    return node.map(extractTextFromReactNode).filter(Boolean).join(' ');
  }
  
  if (typeof node === 'object') {
    // Skip code blocks and pre-formatted text for cleaner audio
    const nodeType = node.type;
    const className = node.props?.className || '';
    
    if (
      nodeType === 'pre' || 
      nodeType === 'code' || 
      (typeof className === 'string' && className.includes('hljs')) ||
      (typeof className === 'string' && className.includes('language-'))
    ) {
      return '';
    }
    
    // Skip script and style tags
    if (nodeType === 'script' || nodeType === 'style') {
      return '';
    }
    
    // Handle images - use alt text if available
    if (nodeType === 'img') {
      return node.props?.alt ? node.props.alt + ' ' : '';
    }
    
    // Handle links - extract text but not the URL
    if (nodeType === 'a' && node.props?.href) {
      // Just extract the children text, skip the href
      return extractTextFromReactNode(node.props.children);
    }
    
    // Recursively extract from children
    if (node.props) {
      if (node.props.children !== undefined && node.props.children !== null) {
        return extractTextFromReactNode(node.props.children);
      }
    }
    
    // Handle React elements without props.children
    // Sometimes children might be in different places
    if (node.children) {
      return extractTextFromReactNode(node.children);
    }
  }
  
  return '';
}

/**
 * Clean and format text for TTS
 */
export function cleanTextForTTS(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
}
