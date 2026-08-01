import { Link } from 'react-router-dom'
import AppPage from '../components/layout/AppPage'
import { useAuth } from '../context/AuthContext'
import { buildSupportPortalUrl, getSupportPortalBaseUrl, prepareSupportPortalHandoff } from '../utils/supportPortal'
import { useToast } from '../hooks/useToast'
import { PillButton } from '../components/ui/PremiumSurface'
import { PublicPageContainer } from '../components/public/PublicPagePrimitives'
import { FaqKnowledgeSection } from '../components/faq/FaqKnowledgeSection'
import { getApprovedFaqQuestions } from '../services/FaqQuestionService'

function Support() {
  const { showToast } = useToast()
  const { isAuthenticated } = useAuth()
  const supportDashboardBaseUrl = getSupportPortalBaseUrl()

  const openSupportDashboard = () => {
    const handoffReady = prepareSupportPortalHandoff({ mode: 'user', redirect: '/user/dashboard' })
    if (!handoffReady) {
      showToast('Please login first to open support dashboard', 'warning')
      return
    }
    const url = buildSupportPortalUrl({ portalPath: '/user/dashboard', mode: 'user', redirect: '/user/dashboard' })
    if (!url) {
      showToast('Please login first to open support dashboard', 'warning')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <PublicPageContainer>
      <AppPage
        title="Support"
        description="Browse common FAQs and admin-approved answers. Escalate when you need personal help."
        actions={(
          <>
            <PillButton to="/ask-question" active>Ask a question</PillButton>
            <PillButton to="/support/ticket">Raise a ticket</PillButton>
          </>
        )}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <FaqKnowledgeSection
              audience="user"
              loadApprovedFaqs={getApprovedFaqQuestions}
            />
          </section>

          <section className="space-y-5">
            {!isAuthenticated ? (
              <div className="ops-panel interactive-card rounded-2xl border p-6 border-border shadow-sm">
                <h2 className="text-xl font-bold text-foreground">Need personal support?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sign in to create and track support tickets.
                </p>
                <div className="mt-4 flex gap-3">
                  <Link to="/login" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold">
                    Login
                  </Link>
                  <Link to="/register" className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-foreground">
                    Register
                  </Link>
                </div>
                <Link to="/ask-question" className="mt-4 inline-block text-sm underline text-primary">
                  Ask a public question
                </Link>
              </div>
            ) : (
              <div className="ops-panel interactive-card rounded-2xl border p-6 border-border shadow-sm">
                <h2 className="text-xl font-bold text-foreground">Support portal for signed-in users</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  FAQ follow-ups and ticket management live in the dedicated Support Portal.
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={openSupportDashboard}
                    className="px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                  >
                    Open Support Portal
                  </button>
                  <a
                    href={supportDashboardBaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-3 rounded-lg border border-border text-sm font-semibold text-center text-foreground hover:bg-muted/30"
                  >
                    Open standalone support site
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>
      </AppPage>
    </PublicPageContainer>
  )
}

export default Support
