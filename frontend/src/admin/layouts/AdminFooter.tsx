export function AdminFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-orbit-bg border-t border-orbit-border px-6 py-2">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-orbit-text-secondary">
        <div className="mx-auto flex items-center gap-2">
          <p>
            © {currentYear} SmartFood Admin — All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
