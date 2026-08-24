import Link from 'next/link';
import type { Post } from '@repo/content';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { slug, frontMatter, readingTime } = post;
  const { title, date, description, tags } = frontMatter;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Link href={`/blog/${slug}`} className="block py-4 group">
      <article className="space-y-2">
        <h3 className="text-lg font-medium text-foreground group-hover:underline decoration-1 underline-offset-2">
          {title}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <time dateTime={date}>{formatDate(date)}</time>
          <span>·</span>
          <span>{readingTime}</span>
          {tags && tags.length > 0 && (
            <>
              <span>·</span>
              <span className="font-medium">{tags[0]}</span>
            </>
          )}
        </div>
      </article>
    </Link>
  );
}
