type Meta = {
  id: string;
  title: string;
  date: string;
  tags: string[];
};

type BlogPost = {
  meta: Meta;
  content:  ReactElement<any, string | JSXElementConstructor<any>>;
  rawMDX?: string; // Raw MDX source for text extraction
};
