type BookCoverProps = {
  src: string;
  alt: string;
};

export function BookCover({ src, alt }: BookCoverProps) {
  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
}
