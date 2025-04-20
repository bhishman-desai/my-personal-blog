import getFormattedDate from "@/lib/getFormattedDate";
import { getPostByName, getPostsMeta } from "@/lib/posts";
import Link from "next/link";
import { MdArrowBackIosNew } from "react-icons/md";
import { notFound } from "next/navigation";
import "highlight.js/styles/github-dark.css";
import TextToSpeech from "@/app/components/TextToSpeech";

export const revalidate = 86400;

type Props = {
  params: {
    postId: string;
  };
};

export async function generateStaticParams() {
  const posts = await getPostsMeta();

  if (!posts) return [];

  return posts.map((post) => ({
    postId: post.id,
  }));
}

export async function generateMetadata({ params: { postId } }: Props) {
  const post = await getPostByName(`${postId}.mdx`);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.meta.title,
  };
}

export default async function Post({ params: { postId } }: Props) {
  const post = await getPostByName(`${postId}.mdx`);

  if (!post) return notFound();

  const { meta, content } = post;

  const pubDate = getFormattedDate(meta.date);

  const tags = meta.tags.map((tag, i) => (
    <Link key={i} href={`/tags/${tag}`}>
      {tag}
    </Link>
  ));

  const extractText = (node: any): string => {
    if (typeof node === 'string') return node;
    if (!node) return '';
    
    if (Array.isArray(node)) {
      return node.map(extractText).join(' ');
    }

    if (typeof node === 'object') {
      if (node.props) {
        if (typeof node.props.children === 'string') {
          return node.props.children;
        }
        return extractText(node.props.children);
      }
    }
    
    return '';
  };

  const articleText = `${meta.title}. ${extractText(content)}`;

  return (
    <>
      <h2 className="text-3xl mt-4 mb-0">{meta.title}</h2>
      <p className="mt-0 text-sm">{pubDate}</p>
      <TextToSpeech text={articleText} />
      <article>{content}</article>
      <section>
        <h3>Related:</h3>
        <div className="flex flex-row gap-4">{tags}</div>
      </section>
      <p className="mb-10">
        <Link href="/">
          <MdArrowBackIosNew />
        </Link>
      </p>
    </>
  );
}
