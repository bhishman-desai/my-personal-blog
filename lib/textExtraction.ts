/**
 * Extract plain text from MDX content
 * This function recursively extracts text from React elements
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

