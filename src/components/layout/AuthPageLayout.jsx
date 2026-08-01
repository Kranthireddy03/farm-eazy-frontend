import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

export function AuthPageLayout({ title, description, side, children }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {side && <div className="hidden lg:block space-y-6">{side}</div>}
        <Card className="w-full shadow-sm">
          <CardHeader>
            <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              FE
            </div>
            <CardTitle className="text-2xl mt-4">{title}</CardTitle>
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
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          <img src={imageSrc} alt={imageAlt || ''} className="w-full object-cover" />
        </div>
      )}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">FarmEazy</p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground leading-tight">{title}</h2>
        {description && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>
    </>
  );
}
