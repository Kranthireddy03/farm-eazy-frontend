import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import FarmEazyLogo from '../common/FarmEazyLogo';

export function AuthPageLayout({ title, description, side, children }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] fe-premium-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {side && <div className="hidden lg:block space-y-6">{side}</div>}
        <Card className="ops-auth-card w-full border-0 shadow-none">
          <CardHeader>
            <Link to="/" className="inline-block mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl">
              <FarmEazyLogo size="lg" />
            </Link>
            <CardTitle className="ops-page-title mt-2">{title}</CardTitle>
            {description && <CardDescription className="text-sm mt-1">{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AuthSidePanel({ imageSrc, imageAlt, title, description }) {
  return (
    <>
      {imageSrc && (
        <div className="ops-panel overflow-hidden rounded-2xl shadow-lg border border-border/60">
          <img src={imageSrc} alt={imageAlt || ''} className="w-full object-cover" />
        </div>
      )}
      <div className="ops-panel p-6 rounded-2xl border border-border/60">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">FarmEazy Platform</p>
        <h2 className="mt-2 ops-page-title text-foreground text-xl font-bold">{title}</h2>
        {description && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>
    </>
  );
}
