export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/15">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>© {currentYear} 박준형</div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              GitHub
            </a>

            <a
              href="mailto:contact@example.com"
              className="hover:text-foreground transition-colors"
              aria-label="이메일"
            >
              Email
            </a>

            <a
              href="/feed.xml"
              className="hover:text-foreground transition-colors"
              aria-label="RSS"
            >
              RSS
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
