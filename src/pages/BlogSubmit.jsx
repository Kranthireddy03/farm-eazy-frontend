import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import { submitUserBlogPost } from '../services/BlogService';
import AppPage from '../components/layout/AppPage';
import { PageScaffold } from '../components/app/PageScaffold';
import { DetailPanel } from '../components/platform/DetailPanel';
import { InfoPanel } from '../components/platform/InfoPanel';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FePanel } from '../components/platform/FeOpsPrimitives';

const EMPTY_FORM = {
  title: '',
  excerpt: '',
  content: '',
  category: '',
  tagsInput: '',
  coverImageUrl: '',
  imageUrlsText: '',
  authorName: '',
};

const AUTHOR_TIPS = [
  'Use actionable titles that mention crop, region, or season.',
  'Start with a practical problem, then list clear steps.',
  'Prefer short paragraphs with measurable outcomes.',
];

export default function BlogSubmit() {
  const { toast, showToast, closeToast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const completion = Math.round(
    (Number(Boolean(form.title.trim())) +
      Number(Boolean(form.excerpt.trim())) +
      Number(Boolean(form.content.trim())) +
      Number(Boolean(form.category.trim())) +
      Number(Boolean(form.tagsInput.trim()))) /
      5 *
      100,
  );

  const onSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      category: form.category.trim(),
      tags: form.tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      coverImageUrl: form.coverImageUrl.trim(),
      imageUrls: form.imageUrlsText
        .split(/\n|,/)
        .map((url) => url.trim())
        .filter(Boolean),
      authorName: form.authorName.trim(),
    };

    if (!payload.title || !payload.excerpt || !payload.content) {
      showToast('Title, excerpt, and content are required.', 'error');
      return;
    }

    if (!payload.coverImageUrl && payload.imageUrls.length === 0) {
      showToast('Please add at least one image URL.', 'error');
      return;
    }

    try {
      setSaving(true);
      await submitUserBlogPost(payload);
      showToast('Your blog was submitted for admin review and approval.', 'success');
      setForm(EMPTY_FORM);
      setTimeout(() => navigate('/blog'), 1000);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Unable to submit blog right now.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppPage
      title="Write for FarmEazy"
      description="Share practical farming knowledge. Articles are reviewed before publishing."
      actions={
        <>
          <Link
            to="/blog/my-submissions"
            className="text-sm font-medium text-primary hover:underline"
          >
            My submissions
          </Link>
          <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Back to blog
          </Link>
        </>
      }
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        </div>
      )}

      <FePanel className="p-4 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Submission readiness</span>
          <span className="font-semibold text-primary tabular-nums">{completion}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full overflow-hidden bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
      </FePanel>

      <PageScaffold
        aside={
          <>
            <InfoPanel title="Author assistant" description="Tips for stronger submissions.">
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {AUTHOR_TIPS.map((tip) => (
                  <li key={tip} className="rounded-lg border border-border bg-muted/30 p-3">
                    {tip}
                  </li>
                ))}
              </ul>
            </InfoPanel>
            <InfoPanel title="Checklist" description="Before you submit">
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Title is clear and specific</li>
                <li>Summary explains value in 2–3 lines</li>
                <li>Content includes steps or best practices</li>
                <li>Tags are relevant and searchable</li>
              </ul>
            </InfoPanel>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-6">
          <DetailPanel title="Post details" description="Title, author, and taxonomy.">
            <div className="space-y-4">
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Title"
              />
              <Input
                value={form.authorName}
                onChange={(e) => setForm((prev) => ({ ...prev, authorName: e.target.value }))}
                placeholder="Author name (optional)"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Category"
                />
                <Input
                  value={form.tagsInput}
                  onChange={(e) => setForm((prev) => ({ ...prev, tagsInput: e.target.value }))}
                  placeholder="Tags, comma separated"
                />
              </div>
              <Input
                value={form.coverImageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                placeholder="Cover image URL"
              />
              <textarea
                rows={3}
                value={form.imageUrlsText}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrlsText: e.target.value }))}
                placeholder="Additional image URLs (one per line or comma separated)"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </DetailPanel>

          <DetailPanel title="Content" description="Summary and full article body.">
            <div className="space-y-4">
              <textarea
                rows={3}
                value={form.excerpt}
                onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Short summary"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <textarea
                rows={12}
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Write your full blog here"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y min-h-[280px]"
              />
            </div>
          </DetailPanel>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? 'Submitting…' : 'Submit for review'}
          </Button>
        </form>
      </PageScaffold>
    </AppPage>
  );
}
