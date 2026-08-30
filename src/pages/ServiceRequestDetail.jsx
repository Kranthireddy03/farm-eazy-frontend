import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import AppPage from '../components/layout/AppPage'
import apiClient from '../services/apiClient'

const STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  WAITING_FOR_USER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  WAITING_FOR_INFO: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CLOSED: 'bg-muted text-foreground dark:bg-muted/30 dark:text-muted-foreground',
  ESCALATED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

const PRIORITY_COLORS = {
  LOW: 'text-muted-foreground',
  MEDIUM: 'text-yellow-500',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-red-500'
}

function ServiceRequestDetail() {
  const { requestNumber } = useParams()
  const navigate = useNavigate()
  const { isDark } = useTheme()
  
  const [request, setRequest] = useState(null)
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  useEffect(() => {
    fetchRequestDetails()
  }, [requestNumber])

  const fetchRequestDetails = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/service-requests/${requestNumber}`)
      setRequest(response.data)
      setComments(response.data.comments || [])
      setAttachments(response.data.attachments || [])
    } catch (err) {
      console.error('Failed to fetch request:', err)
      setError('Service request not found or you do not have access')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmittingComment(true)
    try {
      const response = await apiClient.post(`/service-requests/${requestNumber}/comments`, {
        content: newComment,
        isInternal: false
      })
      setComments([...comments, response.data])
      setNewComment('')
    } catch (err) {
      console.error('Failed to add comment:', err)
      alert('Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('description', file.name)

      const response = await apiClient.post(
        `/service-requests/${requestNumber}/attachments`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      setAttachments([...attachments, response.data])
    } catch (err) {
      console.error('Failed to upload file:', err)
      alert('Failed to upload file')
    } finally {
      setUploadingFile(false)
      e.target.value = ''
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className={`premium-shell min-h-screen flex items-center justify-center ${isDark ? 'bg-background' : 'bg-gradient-to-br from-primary/5 via-white to-cyan-50'}`}>
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Loading request details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`premium-shell min-h-screen flex items-center justify-center ${isDark ? 'bg-background' : 'bg-gradient-to-br from-primary/5 via-white to-cyan-50'}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>{error}</h2>
          <button
            onClick={() => navigate('/service-requests')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Back to Requests
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppPage title={`Request #${request.requestNumber}`} description={request.subject || 'Service request details'}>
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/service-requests')}
          className={`mb-6 flex items-center gap-2 ${isDark ? 'text-muted-foreground hover:text-white' : 'text-muted-foreground hover:text-foreground'} transition`}
        >
          ← Back to Service Requests
        </button>

        {/* Header Card */}
        <div className={`ops-panel interactive-card rounded-xl shadow-lg border p-6 mb-6 ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`font-mono text-lg font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
                  #{request.requestNumber}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[request.status]}`}>
                  {request.status?.replace(/_/g, ' ')}
                </span>
                <span className={`text-sm font-medium ${PRIORITY_COLORS[request.priority]}`}>
                  ● {request.priority}
                </span>
              </div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
                {request.subject}
              </h1>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Category</p>
              <p className={`font-semibold ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                {request.category?.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Created</p>
              <p className={`font-semibold ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                {formatDate(request.createdAt)}
              </p>
            </div>
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Last Updated</p>
              <p className={`font-semibold ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                {formatDate(request.updatedAt)}
              </p>
            </div>
            {request.assignedTo && (
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Assigned To</p>
                <p className={`font-semibold ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                  {request.assignedToName || request.assignedTo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className={`ops-panel interactive-card rounded-xl shadow-lg border p-6 mb-6 ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-foreground'}`}>
            Description
          </h2>
          <div className={`whitespace-pre-wrap ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
            {request.description}
          </div>

          {(request.relatedOrderId || request.relatedProductId) && (
            <div className="mt-4 pt-4 border-t border-border dark:border-border">
              <div className="flex gap-6 flex-wrap">
                {request.relatedOrderId && (
                  <div>
                    <span className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Related Order: </span>
                    <span className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
                      #{request.relatedOrderId}
                    </span>
                  </div>
                )}
                {request.relatedProductId && (
                  <div>
                    <span className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>Related Product: </span>
                    <span className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
                      #{request.relatedProductId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className={`ops-panel interactive-card rounded-xl shadow-lg border p-6 mb-6 ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>
              Attachments ({attachments.length})
            </h2>
            <label className={`px-4 py-2 rounded-lg cursor-pointer transition ${
              uploadingFile 
                ? 'bg-border cursor-not-allowed' 
                : 'bg-primary hover:bg-primary/90 text-white'
            }`}>
              {uploadingFile ? 'Uploading...' : '📎 Add File'}
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
            </label>
          </div>

          {attachments.length === 0 ? (
            <p className={isDark ? 'text-muted-foreground' : 'text-muted-foreground'}>No attachments yet</p>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-muted' : 'bg-muted/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {attachment.fileType?.includes('image') ? '🖼️' : 
                       attachment.fileType?.includes('pdf') ? '📄' : '📁'}
                    </span>
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>
                        {attachment.fileName || attachment.description}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                        {formatDate(attachment.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  {attachment.fileUrl && (
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className={`ops-panel interactive-card rounded-xl shadow-lg border p-6 ${isDark ? 'bg-muted border-border' : 'bg-background border-border'}`}>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-foreground'}`}>
            Comments ({comments.length})
          </h2>

          {/* Comment List */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {comments.length === 0 ? (
              <p className={isDark ? 'text-muted-foreground' : 'text-muted-foreground'}>No comments yet</p>
            ) : (
              comments.map((comment, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    comment.isFromSupport 
                      ? isDark ? 'bg-blue-900/20 border-l-4 border-blue-500' : 'bg-blue-50 border-l-4 border-blue-500'
                      : isDark ? 'bg-muted' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
                      {comment.isFromSupport ? '👨‍💼 Support Team' : '👤 You'}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className={`whitespace-pre-wrap ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="pt-4 border-t border-border dark:border-border">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your reply..."
              rows={3}
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                isDark ? 'bg-muted border-border text-white placeholder:text-muted-foreground' : 'bg-background border-border text-foreground placeholder:text-muted-foreground'
              }`}
            />
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingComment ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </form>
        </div>

        {/* Resolution Info */}
        {(request.status === 'RESOLVED' || request.status === 'CLOSED') && request.resolution && (
          <div className={`mt-6 ops-panel interactive-card rounded-xl shadow-lg border p-6 ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
            <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-green-400' : 'text-green-800'}`}>
              ✅ Resolution
            </h2>
            <p className={isDark ? 'text-green-300' : 'text-green-700'}>
              {request.resolution}
            </p>
            {request.resolvedAt && (
              <p className={`mt-2 text-sm ${isDark ? 'text-green-400/70' : 'text-green-600'}`}>
                Resolved on {formatDate(request.resolvedAt)}
              </p>
            )}
          </div>
        )}
      </div>
    </AppPage>
  )
}

export default ServiceRequestDetail
