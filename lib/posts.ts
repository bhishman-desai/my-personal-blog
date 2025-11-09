import { compileMDX } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import Video from "@/app/components/Video";
import CustomImage from "@/app/components/CustomImage";

type FileTree = {
  tree: [
    {
      path: string;
    },
  ];
};

export const getPostByName = async (
  fileName: string,
): Promise<BlogPost | undefined> => {
  const res = await fetch(
    `https://raw.githubusercontent.com/bhishman-desai/blogposts/main/${fileName}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!res.ok) return undefined;

  const rawMDX: string = await res.text();

  if (rawMDX === "404: Not Found") return undefined;

  const { frontmatter, content } = await compileMDX<{
    title: string;
    date: string;
    tags: string[];
  }>({
    source: rawMDX,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        rehypePlugins: [
          // @ts-ignore
          rehypeHighlight,
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "wrap",
            },
          ],
        ],
      },
    },
    components: {
      Video,
      CustomImage,
    },
  });

  const id = fileName.replace(/\.mdx$/, "");

  return {
    meta: {
      id,
      title: frontmatter.title,
      date: frontmatter.date,
      tags: frontmatter.tags,
    },
    content,
    rawMDX, // Include raw MDX for text extraction
  };
};

export const getPostsMeta = async (): Promise<Meta[] | undefined> => {
  const res = await fetch(
    "https://api.github.com/repos/bhishman-desai/blogposts/git/trees/main?recursive=1",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!res.ok) return undefined;

  const repoFileTree: FileTree = await res.json();

  const filesArray: string[] = repoFileTree.tree
    .map((value) => value.path)
    .filter((value) => value.endsWith(".mdx"));

  const posts: Meta[] = [];

  for (const file of filesArray) {
    const post = await getPostByName(file);
    if (post) {
      const { meta } = post;
      posts.push(meta);
    }
  }

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
};
