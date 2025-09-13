import { useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { DashboardHeader } from "@/components/DashboardHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calendar, User, Download, Loader2, AlertCircle } from "lucide-react"
import { useDocumentService } from "@/hooks/useDocumentService"
import { useActiveProject } from "@/hooks/useStorage"
import { useUserContext } from "@/contexts/UserContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const Documents = () => {
  const { activeProject } = useActiveProject()
  const { currentUser } = useUserContext()
  const { documents, loading, error, loadDocuments, deleteDocument } = useDocumentService()

  useEffect(() => {
    if (activeProject?.id) {
      loadDocuments(activeProject.id)
    }
  }, [activeProject, loadDocuments])

  const formatFileSize = (base64Content: string) => {
    const sizeInBytes = Math.round((base64Content.length * 3) / 4)
    if (sizeInBytes < 1024) return `${sizeInBytes} B`
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getProcessingStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Processed</Badge>
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>
      default:
        return <Badge variant="secondary">Not Processed</Badge>
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          <DashboardHeader />

          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-h1 font-bold text-foreground">Documents</h1>
              <p className="text-body text-muted-foreground mt-2">
                Browse and manage your uploaded documents
              </p>
            </div>

            {!activeProject ? (
              <Card className="shadow-subtle">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-5 w-5" />
                    <p>Please select a project to view documents</p>
                  </div>
                </CardContent>
              </Card>
            ) : loading ? (
              <Card className="shadow-subtle">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <p>Loading documents...</p>
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="shadow-subtle">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-5 w-5" />
                    <p>Error loading documents: {error}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-subtle">
                <CardHeader>
                  <CardTitle className="text-h3">
                    All Documents ({documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No documents uploaded yet</p>
                      <p className="text-sm mt-2">Upload documents from the Upload tab</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div key={doc.id} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="p-2 bg-primary/10 rounded">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div className="space-y-1">
                                <h3 className="font-medium text-foreground">{doc.fileName}</h3>
                                <p className="text-body-sm text-muted-foreground">
                                  {doc.rawText ? doc.rawText.substring(0, 100) + '...' : 'No preview available'}
                                </p>
                                <div className="flex items-center gap-4 text-small text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {doc.userId || 'Unknown'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(doc.createdAt)}
                                  </span>
                                  <span>{formatFileSize(doc.content)}</span>
                                  <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium">
                                    {doc.documentType}
                                  </span>
                                  {getProcessingStatusBadge('completed')}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const blob = new Blob([atob(doc.content)], { type: 'application/octet-stream' })
                                  const url = URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = doc.fileName
                                  a.click()
                                  URL.revokeObjectURL(url)
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default Documents