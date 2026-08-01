import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { PageScaffold } from '../components/app/PageScaffold'
import { DetailPanel } from '../components/platform/DetailPanel'
import { InfoPanel } from '../components/platform/InfoPanel'
import apiClient from '../services/apiClient'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { FormField } from '../components/ui/form-field'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { DataTable } from '../components/ui/data-table'
import { Badge } from '../components/ui/badge'
import { EmptyState } from '../components/ui/empty-state'
import { PageSkeleton } from '../components/ui/Skeleton'
import { KpiCard } from '../components/ui/kpi-card'
import { Plus, LifeBuoy, Phone, Mail } from 'lucide-react'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const CATEGORIES = [
  { value: 'PAYMENT_ISSUE', label: 'Payment Issue' },
  { value: 'ORDER_ISSUE', label: 'Order Issue' },
  { value: 'DELIVERY_ISSUE', label: 'Delivery Issue' },
  { value: 'REFUND_ISSUE', label: 'Refund Issue' },
  { value: 'ACCOUNT_ISSUE', label: 'Account Issue' },
  { value: 'TECHNICAL_ISSUE', label: 'Technical Issue' },
  { value: 'SELLER_COMPLAINT', label: 'Seller Complaint' },
  { value: 'BUYER_COMPLAINT', label: 'Buyer Complaint' },
  { value: 'BANK_VERIFICATION', label: 'Bank Verification' },
  { value: 'OTHER', label: 'Other' },
]

const PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
]

const STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  WAITING_FOR_USER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  WAITING_FOR_INFO: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CLOSED: 'bg-muted text-muted-foreground',
  ESCALATED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const EMPTY_FORM = {
  category: '',
  priority: 'MEDIUM',
  subject: '',
  description: '',
  relatedOrderId: '',
  relatedProductId: '',
}

function ServiceRequests() {
  const { showToast } = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [formData, setFormData] = useState(EMPTY_FORM)

  useEffect(() => {
    fetchRequests()
  }, [page])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/service-requests?page=${page}&size=10&sort=createdAt,desc`)
      setRequests(response.data.content || [])
      setTotalPages(response.data.totalPages || 0)
    } catch (error) {
      console.error('Failed to fetch service requests:', error)
      showToast('Failed to load service requests', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject,
        description: formData.description,
        relatedOrderId: formData.relatedOrderId ? parseInt(formData.relatedOrderId, 10) : null,
        relatedProductId: formData.relatedProductId ? parseInt(formData.relatedProductId, 10) : null,
      }

      const response = await apiClient.post('/service-requests', payload)
      showToast(`Service request #${response.data.requestNumber} created`, 'success')
      setFormData(EMPTY_FORM)
      setShowForm(false)
      fetchRequests()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create service request', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const openCount = useMemo(
    () => requests.filter((r) => ['OPEN', 'IN_PROGRESS', 'ESCALATED'].includes(r.status)).length,
    [requests],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'requestNumber',
        header: 'Request #',
        cell: ({ row }) => <span className="font-mono font-medium">{row.original.requestNumber}</span>,
      },
      {
        accessorKey: 'subject',
        header: 'Subject',
        cell: ({ row }) => <span className="max-w-xs truncate block">{row.original.subject}</span>,
      },
      {
        id: 'category',
        header: 'Category',
        cell: ({ row }) =>
          CATEGORIES.find((c) => c.value === row.original.category)?.label || row.original.category,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge className={STATUS_COLORS[row.original.status] || STATUS_COLORS.OPEN}>
            {row.original.status?.replace(/_/g, ' ')}
          </Badge>
        ),
      },
      {
        id: 'created',
        header: 'Created',
        cell: ({ row }) => <span className="text-muted-foreground text-sm">{formatDate(row.original.createdAt)}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Link
            to={`/service-requests/${row.original.requestNumber}`}
            className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
          >
            View
          </Link>
        ),
      },
    ],
    [],
  )

  const paginationFooter = totalPages > 1 ? (
    <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground pt-2">
      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
        Previous
      </Button>
      <span>Page {page + 1} of {totalPages}</span>
      <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
        Next
      </Button>
    </div>
  ) : null

  return (
    <AppPage
      title="Service Requests"
      description="Raise and track your support tickets."
      actions={
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          {showForm ? 'Cancel' : 'New request'}
        </Button>
      }
    >
      <PageScaffold
        aside={
          <InfoPanel title="Need immediate help?" description="Reach our support team directly.">
            <div className="flex flex-col gap-2 mt-4">
              <a href="tel:+916301630368" className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Phone className="h-4 w-4" /> +91 63016 30368
              </a>
              <a href="mailto:support@farm-eazy.com" className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
                <Mail className="h-4 w-4" /> support@farm-eazy.com
              </a>
            </div>
          </InfoPanel>
        }
      >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard title="This page" value={requests.length} hint="Visible requests" icon={LifeBuoy} />
          <KpiCard title="Open / active" value={openCount} hint="Needs attention" icon={LifeBuoy} />
          <KpiCard title="Pages" value={totalPages || 1} hint="Server pagination" icon={LifeBuoy} />
        </div>

        {showForm && (
          <DetailPanel title="Create service request" description="Describe your issue with as much detail as possible.">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Category" id="category" required>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={selectClass}
                      required
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Priority" id="priority">
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className={selectClass}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <FormField label="Subject" id="subject" required>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    minLength={5}
                    maxLength={200}
                    placeholder="Brief description of your issue"
                  />
                </FormField>
                <FormField label="Description" id="description" required>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={5}
                    placeholder="Provide detailed information…"
                  />
                </FormField>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Related order ID" id="relatedOrderId" hint="Optional">
                    <Input
                      id="relatedOrderId"
                      type="number"
                      value={formData.relatedOrderId}
                      onChange={(e) => setFormData({ ...formData, relatedOrderId: e.target.value })}
                      placeholder="Order ID"
                    />
                  </FormField>
                  <FormField label="Related product ID" id="relatedProductId" hint="Optional">
                    <Input
                      id="relatedProductId"
                      type="number"
                      value={formData.relatedProductId}
                      onChange={(e) => setFormData({ ...formData, relatedProductId: e.target.value })}
                      placeholder="Product ID"
                    />
                  </FormField>
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit request'}
                </Button>
              </form>
          </DetailPanel>
        )}

        {loading ? (
          <PageSkeleton variant="table" />
        ) : requests.length === 0 && !showForm ? (
          <EmptyState
            title="No service requests yet"
            description="Create a ticket when you need help with orders, payments, or your account."
            action={<Button onClick={() => setShowForm(true)}>New request</Button>}
          />
        ) : (
          <DataTable
            columns={columns}
            data={requests}
            hidePagination
            footer={paginationFooter}
            emptyTitle="No requests on this page"
            mobileCardRender={(request) => (
              <Card key={request.id}>
                <CardContent className="p-4 space-y-2">
                  <p className="font-mono font-medium">{request.requestNumber}</p>
                  <p className="text-sm">{request.subject}</p>
                  <Badge className={STATUS_COLORS[request.status] || STATUS_COLORS.OPEN}>
                    {request.status?.replace(/_/g, ' ')}
                  </Badge>
                  <Link
                    to={`/service-requests/${request.requestNumber}`}
                    className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-accent"
                  >
                    View
                  </Link>
                </CardContent>
              </Card>
            )}
          />
        )}

      </PageScaffold>
    </AppPage>
  )
}

export default ServiceRequests
