import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

export function AuthPageLayout({ title, description, side, children }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] fe-premium-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {side && <div className="hidden lg:block space-y-6">{side}</div>}
        <Card className="ops-auth-card w-full border-0 shadow-none">
          <CardHeader>
            <div className="fe-logo-mark text-xs">FE</div>
            <CardTitle className="ops-page-title mt-4">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
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
        <div className="ops-panel overflow-hidden">
          <img src={imageSrc} alt={imageAlt || ''} className="w-full object-cover" />
        </div>
      )}
      <div className="ops-panel p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">FarmEazy</p>
        <h2 className="mt-2 ops-page-title text-foreground">{title}</h2>
        {description && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>
    </>
  );
}
