# 🔘 Buttons Breakdown - Construct AI

**Detailed analysis of all buttons in the system.**

## 📋 Overview

This document contains detailed information about each button found in the Construct AI system.

## 📊 Statistics

- **Total Buttons**: 959
- **Categories**: 8
- **Total Modals Referenced**: 11
- **Generated**: 2026-03-17T09:15:28.815Z

## 🔘 Button Details

### 1. setActiveView('dashboard')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeView === 'dashboard'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📊 Dashboard

**Category**: view

**File**: `client/src/pages/WorkflowDemo.jsx`

**Pattern**: Regular button element

**Page Type**: WorkflowDemo.jsx

---

### 2. setActiveView('buttons')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeView === 'buttons'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🔘 Individual Buttons

**Category**: view

**File**: `client/src/pages/WorkflowDemo.jsx`

**Pattern**: Regular button element

**Page Type**: WorkflowDemo.jsx

---

### 3. setActiveView('visualizer')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeView === 'visualizer'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📈 Visualizer

**Category**: view

**File**: `client/src/pages/WorkflowDemo.jsx`

**Pattern**: Regular button element

**Page Type**: WorkflowDemo.jsx

---

### 4. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/66-Administration/components/modals/66-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 66-Administration

---

### 5. Cancel

**Category**: cancel

**File**: `client/src/pages/66-Administration/components/modals/66-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 66-Administration

---

### 6. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/192-Construction/components/modals/192-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 192-Construction

---

### 7. Cancel

**Category**: cancel

**File**: `client/src/pages/192-Construction/components/modals/192-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 192-Construction

---

### 8. Close

**Category**: cancel

**File**: `client/src/pages/03000-landscaping/components/modals/03000-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 03000-landscaping

---

### 9. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/03000-landscaping/components/modals/03000-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 03000-landscaping

---

### 10. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/03000-landscaping/components/modals/03000-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 03000-landscaping

---

### 11. Close

**Category**: cancel

**File**: `client/src/pages/02500-security/components/modals/02500-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02500-security

---

### 12. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/02500-security/components/modals/02500-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02500-security

---

### 13. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/02500-security/components/modals/02500-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02500-security

---

### 14. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/02400-safety/components/modals/02400-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 15. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/02400-safety/components/modals/02400-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 16. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/02400-safety/components/modals/02400-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 17. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/02400-safety/components/modals/02400-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 18. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/02400-safety/components/modals/02400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 19. Close

**Category**: cancel

**File**: `client/src/pages/02400-safety/components/modals/02400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 20. onViewDetails(result, true)}
                  >
                    View

**Category**: view

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 21. onAcceptEvaluation(result)}
                  >
                    Approve

**Category**: other

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 22. onRejectEvaluation(result)}
                  >
                    Reject

**Category**: other

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 23. setCurrentPage(1)}
            disabled={currentPage === 1}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              backgroundColor: currentPage === 1 ? "#f8f9fa" : "white",
              color: currentPage === 1 ? "#999" : "#007bff",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontSize: "12px",
            }}
          >
            « First

**Category**: navigation

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 24. setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              backgroundColor: currentPage === 1 ? "#f8f9fa" : "white",
              color: currentPage === 1 ? "#999" : "#007bff",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontSize: "12px",
            }}
          >
            ‹ Prev

**Category**: navigation

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 25. setCurrentPage(pageNum)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  backgroundColor:
                    currentPage === pageNum ? "#007bff" : "white",
                  color: currentPage === pageNum ? "white" : "#007bff",
                  cursor: "pointer",
                  fontSize: "12px",
                  minWidth: "36px",
                }}
              >
                {pageNum}

**Category**: navigation

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 26. setCurrentPage(prev => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              backgroundColor: currentPage === totalPages ? "#f8f9fa" : "white",
              color: currentPage === totalPages ? "#999" : "#007bff",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              fontSize: "12px",
            }}
          >
            Next ›

**Category**: navigation

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 27. setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              backgroundColor: currentPage === totalPages ? "#f8f9fa" : "white",
              color: currentPage === totalPages ? "#999" : "#007bff",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              fontSize: "12px",
            }}
          >
            Last »

**Category**: navigation

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 28. onEvaluationDetails && onEvaluationDetails(result)}
                        title="View detailed evaluation"
                      >
                        👁️ Review

**Category**: view

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResults.jsx`

**Tooltip**: `View detailed evaluation`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 29. {
                          navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                        }}
                        title="Export evaluation data"
                      >
                        📋 Export

**Category**: navigation

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResults.jsx`

**Tooltip**: `Export evaluation data`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 30. openDocumentUploadModal(activeTab)}
        >
          Upload Documents

**Category**: view

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/ContractorVettingTabContent.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 31. analyzeSection(activeTab)}
      >
        {getAnalyzeButtonText(activeTab)}

**Category**: other

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/ContractorVettingTabContent.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 32. setShowEvaluationDetailsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                ×

**Category**: navigation

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/ContractorVettingModals.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 33. setShowFullDetailsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                ×

**Category**: navigation

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/ContractorVettingModals.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 34. window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page

**Category**: navigation

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/02400-contractor-vetting-page.lazy.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 35. this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry

**Category**: navigation

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/02400-contractor-vetting-page.lazy.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 36. Close

**Category**: cancel

**File**: `client/src/pages/02250-quality-control/components/modals/02250-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02250-quality-control

---

### 37. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/02250-quality-control/components/modals/02250-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02250-quality-control

---

### 38. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/02250-quality-control/components/modals/02250-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02250-quality-control

---

### 39. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/02250-quality-control/components/modals/02250-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02250-quality-control

---

### 40. Cancel

**Category**: cancel

**File**: `client/src/pages/02250-quality-control/components/modals/02250-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02250-quality-control

---

### 41. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/02200-quality-assurance/components/modals/02200-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02200-quality-assurance

---

### 42. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/02200-quality-assurance/components/modals/02200-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02200-quality-assurance

---

### 43. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/02200-quality-assurance/components/modals/02200-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02200-quality-assurance

---

### 44. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/02200-quality-assurance/components/modals/02200-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02200-quality-assurance

---

### 45. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/02200-quality-assurance/components/modals/02200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-quality-assurance

---

### 46. Close

**Category**: cancel

**File**: `client/src/pages/02200-quality-assurance/components/modals/02200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-quality-assurance

---

### 47. workflowStateManager?.pauseWorkflow?.()}
          disabled={currentState?.status !== 'active'}
        >
          ⏸️ Pause

**Category**: other

**File**: `client/src/pages/02200-agent-monitoring/components/WorkflowVisualizerTab.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 48. workflowStateManager?.resumeWorkflow?.()}
          disabled={currentState?.status !== 'paused'}
        >
          ▶️ Resume

**Category**: other

**File**: `client/src/pages/02200-agent-monitoring/components/WorkflowVisualizerTab.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 49. workflowStateManager?.resetWorkflow?.()}
        >
          🔄 Reset

**Category**: other

**File**: `client/src/pages/02200-agent-monitoring/components/WorkflowVisualizerTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 50. {
              try {
                performanceMonitor?.recordTaskStart?.(`test_task_${Date.now()}`, 'performance_test');
                setTimeout(() => {
                  performanceMonitor?.recordTaskComplete?.(`test_task_${Date.now()}`, true, { testResult: 'success' });
                }, 1000);
              } catch (error) {
                console.error('[PerformanceTab] Error recording success:', error);
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Record Success

**Category**: navigation

**File**: `client/src/pages/02200-agent-monitoring/components/PerformanceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 51. {
              try {
                performanceMonitor?.recordTaskStart?.(`test_task_${Date.now()}`, 'performance_test');
                setTimeout(() => {
                  performanceMonitor?.recordTaskComplete?.(`test_task_${Date.now()}`, false, { error: 'Test failure' });
                }, 500);
              } catch (error) {
                console.error('[PerformanceTab] Error recording failure:', error);
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Record Failure

**Category**: navigation

**File**: `client/src/pages/02200-agent-monitoring/components/PerformanceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 52. {
              try {
                performanceMonitor?.recordAgentHealth?.('healthy');
              } catch (error) {
                console.error('[PerformanceTab] Error setting health:', error);
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Set Healthy

**Category**: navigation

**File**: `client/src/pages/02200-agent-monitoring/components/PerformanceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 53. {
            const taskId = hitl.createHITLTask('test_agent', 'approval_required', { test: true }, 'normal');
            alert(`Created test HITL task: ${taskId}`);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Create Test Task

**Category**: navigation

**File**: `client/src/pages/02200-agent-monitoring/components/HITLTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 54. handleAssignToMe(task.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Assign to Me

**Category**: navigation

**File**: `client/src/pages/02200-agent-monitoring/components/HITLTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 55. setSelectedTask(task)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Review

**Category**: navigation

**File**: `client/src/pages/02200-agent-monitoring/components/HITLTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 56. setSelectedTask(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel

**Category**: navigation

**File**: `client/src/pages/02200-agent-monitoring/components/HITLTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 57. handleResolve(selectedTask.id, 'rejected')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Reject

**Category**: navigation

**File**: `client/src/pages/02200-agent-monitoring/components/HITLTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 58. handleResolve(selectedTask.id, 'approved')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Approve

**Category**: navigation

**File**: `client/src/pages/02200-agent-monitoring/components/HITLTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 59. Close

**Category**: cancel

**File**: `client/src/pages/02100-public-relations/components/modals/02100-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02100-public-relations

---

### 60. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/02100-public-relations/components/modals/02100-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02100-public-relations

---

### 61. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/02100-public-relations/components/modals/02100-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02100-public-relations

---

### 62. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/02076-quality-assurance-sub/components/modals/02076-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance-sub

---

### 63. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/02076-quality-assurance-sub/components/modals/02076-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance-sub

---

### 64. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/02076-quality-assurance-sub/components/modals/02076-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance-sub

---

### 65. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/02076-quality-assurance-sub/components/modals/02076-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance-sub

---

### 66. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/02076-quality-assurance-sub/components/modals/02076-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance-sub

---

### 67. Close

**Category**: cancel

**File**: `client/src/pages/02076-quality-assurance-sub/components/modals/02076-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance-sub

---

### 68. Close

**Category**: cancel

**File**: `client/src/pages/02076-quality-assurance/components/modals/02076-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance

---

### 69. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/02076-quality-assurance/components/modals/02076-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance

---

### 70. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/02076-quality-assurance/components/modals/02076-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance

---

### 71. Cancel

**Category**: cancel

**File**: `client/src/pages/02076-quality-assurance/components/modals/02076-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance

---

### 72. Cancel

**Category**: cancel

**File**: `client/src/pages/02076-quality-assurance/components/modals/02076-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance

---

### 73. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 74. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 75. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 76. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 77. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 78. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 79. Close

**Category**: cancel

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 80. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 81. Cancel

**Category**: cancel

**File**: `client/src/pages/02075-inspection/components/modals/02075-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 82. removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕

**Category**: navigation

**File**: `client/src/pages/02075-inspection/components/modals/02075-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 83. Cancel

**Category**: cancel

**File**: `client/src/pages/02075-inspection/components/modals/02075-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 84. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/02075-inspection/components/modals/02075-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 85. Cancel

**Category**: cancel

**File**: `client/src/pages/02075-inspection/components/modals/02075-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 86. Retry

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/SchemaDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 87. Refresh Data

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/SchemaDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 88. Close

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/SchemaDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 89. Close

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/SchemaDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 90. e.target.style.backgroundColor = '#b91c1c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
            >
              Retry

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 91. setCurrentView('alerts')}
                  style={{
                    fontSize: '14px',
                    color: '#2563eb',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  View All Alerts →

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 92. setCurrentView('alerts')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🚨 View Security Alerts

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 93. setCurrentView('history')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📅 Audit History

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 94. setCurrentView('tables')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🗄️ Table Security Status

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 95. 🔄 Refresh Dashboard

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 96. Clear Selection

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 97. 📋 Copy

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 98. 📄 JSON

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 99. 📊 CSV

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 100. setFilterLevel(filter.key)}
                    style={{
                      padding: '16px 1px',
                      fontSize: '14px',
                      fontWeight: '500',
                      borderBottom: '2px solid transparent',
                      color: filterLevel === filter.key ? '#2563eb' : '#6b7280',
                      borderBottomColor: filterLevel === filter.key ? '#2563eb' : 'transparent',
                      marginRight: '32px'
                    }}
                  >
                    {filter.label}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 101. Select All

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 102. Select None

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 103. Clear Selection

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 104. 📋 Copy

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 105. 📄 JSON

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 106. 📊 CSV

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 107. setCurrentView('overview')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                ← Back to Overview

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 108. setTableFilter(filter.key)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: tableFilter === filter.key ? filter.color : '#f3f4f6',
                  color: tableFilter === filter.key ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {filter.label}

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 109. Select All ({totalDisplayed})

**Category**: view

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 110. Select None

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 111. setCurrentView('tables')}
                style={{
                  padding: '8px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  marginRight: '16px',
                  cursor: 'pointer'
                }}
              >
                ←

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 112. openPolicyModal(policy.policyname)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                      >
                        View

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 113. setIsSearchMode(!isSearchMode)}
              style={{
                padding: '8px 16px',
                backgroundColor: isSearchMode ? '#3b82f6' : '#f3f4f6',
                color: isSearchMode ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🔍 Search Alerts

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 114. setAdvancedSearchOpen(!advancedSearchOpen)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: advancedSearchOpen ? '#3b82f6' : '#f3f4f6',
                  color: advancedSearchOpen ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {advancedSearchOpen ? 'Hide Filters' : 'Show Filters'}

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 115. {
                  setSearchQuery('');
                  setSearchResults([]);
                  setSearchFilters({
                    searchIn: 'all',
                    alertLevel: 'all',
                    tableSecurity: 'all',
                    dateRange: 'all',
                    caseSensitive: false,
                    exactMatch: false,
                    excludePattern: ''
                  });
                  setIsSearchMode(false);
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ✕ Clear All

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 116. ✕

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 117. Close

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 118. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 119. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 120. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 121. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 122. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 123. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 124. Close

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 125. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 126. Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/modals/02050-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 127. removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/modals/02050-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 128. Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/modals/02050-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 129. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/modals/02050-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 130. Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/modals/02050-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 131. {
                setSearchTerm("");
                setActiveFilters({ category: '', severity: '', status: '', sector: '' });
              }}
              style={{
                width: '100%',
                backgroundColor: 'white',
                color: '#000000',
                border: '2px solid #ffa500',
                padding: '0.375rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: '0.2rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                lineHeight: '1.5',
                height: '31px',
                display: 'inline-block',
                textAlign: 'center',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#fff8f2';
                e.target.style.borderColor = '#ffb733';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#ffa500';
              }}
            >
              Clear Filters

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 132. {
              e.target.style.backgroundColor = '#fff8f2';
              e.target.style.borderColor = '#ffb733';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#ffa500';
            }}
          >
            Cancel

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 133. {
              e.target.style.backgroundColor = '#ffb733';
              e.target.style.borderColor = '#ffb733';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#ffa500';
              e.target.style.borderColor = '#ffa500';
            }}
          >
            Create Error Tracking

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 134. ×

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 135. setEditMode(false)} style={{ background: '#f8f9fa', color: '#000000', border: '2px solid #ddd' }}>Cancel

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 136. Save Changes

**Category**: edit

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 137. ×

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 138. setEditMode(true)} className="orange-button">Edit

**Category**: edit

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 139. ×

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 140. Generate Suggestions

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 02050-information-technology

---

### 141. Attach Files

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 02050-information-technology

---

### 142. removeFile(index)}
                            >
                              Remove

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 02050-information-technology

---

### 143. Add

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 02050-information-technology

---

### 144. removeUrl(index)}
                            >
                              Remove

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 02050-information-technology

---

### 145. Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 02050-information-technology

---

### 146. Apply Enhancements

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Disabled**: Yes

**Pattern**: Button with text and onClick

**Page Type**: 02050-information-technology

---

### 147. Generate Suggestions

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 148. Attach Files

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 149. removeFile(index)}
                            >
                              Remove

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 150. Add

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 151. removeUrl(index)}
                            >
                              Remove

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 152. Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 153. Apply Enhancements

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 154. setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={ariaLabel}
        className={`btn ${type === 'primary' ? 'btn-primary' : 'btn-secondary'} ${className}`}
      >
        {children}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/VoiceCallManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 155. setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={tooltip}
        title={tooltip}
        className={`btn btn-sm ${type === 'delete' ? 'btn-danger' : 'btn-info'}`}
      >
        {icon}

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/DevSettings/VoiceCallManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 156. onChange(current - 1, pageSize)} disabled={current === 1}>
              Previous

**Category**: edit

**File**: `client/src/pages/02050-information-technology/components/DevSettings/VoiceCallManagement.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 157. onChange(pageNum, pageSize)}>{pageNum}

**Category**: edit

**File**: `client/src/pages/02050-information-technology/components/DevSettings/VoiceCallManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 158. onChange(current + 1, pageSize)} disabled={current === pages}>
              Next

**Category**: edit

**File**: `client/src/pages/02050-information-technology/components/DevSettings/VoiceCallManagement.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 159. setModalVisible(false)} className="btn-close" aria-label="Close">

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/DevSettings/VoiceCallManagement.jsx`

**Accessibility**: `aria-label: Close`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 160. setShowForm(!showForm)}
          className="btn btn-primary"
          disabled={loading}
        >
          {showForm ? 'Cancel' : '+ Add New API Configuration'}

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/DevSettings/SimpleExternalApiSettings.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 161. Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/DevSettings/SimpleExternalApiSettings.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 162. handleEdit(config)}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Edit

**Category**: edit

**File**: `client/src/pages/02050-information-technology/components/DevSettings/SimpleExternalApiSettings.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 163. handleDelete(config.id)}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    Delete

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/DevSettings/SimpleExternalApiSettings.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 164. + Create New Prompt

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 165. handleSort('name')}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              textAlign: 'left',
                              width: '100%'
                            }}
                            title="Sort by name"
                          >
                            Name & Key {getSortIcon('name')}

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Tooltip**: `Sort by name`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 166. handleSort('type')}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              textAlign: 'left',
                              width: '100%'
                            }}
                            title="Sort by type"
                          >
                            Type & Role {getSortIcon('type')}

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Tooltip**: `Sort by type`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 167. handleSort('category')}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              textAlign: 'left',
                              width: '100%'
                            }}
                            title="Sort by category"
                          >
                            Category {getSortIcon('category')}

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Tooltip**: `Sort by category`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 168. handleSort('tags')}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              textAlign: 'left',
                              width: '100%'
                            }}
                            title="Sort by tags count"
                          >
                            🏷️ Tags {getSortIcon('tags')}

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Tooltip**: `Sort by tags count`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 169. handleSort('date_added')}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              textAlign: 'left',
                              width: '100%'
                            }}
                            title="Sort by date added"
                          >
                            📅 Date Added {getSortIcon('date_added')}

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Tooltip**: `Sort by date added`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 170. handleSort('is_active')}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              textAlign: 'left',
                              width: '100%'
                            }}
                            title="Sort by status"
                          >
                            Status {getSortIcon('is_active')}

**Category**: navigation

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Tooltip**: `Sort by status`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 171. handleEdit(prompt)}
                              title="Edit"
                            >
                              ✏️

**Category**: edit

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Tooltip**: `Edit`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 172. handleEnhance(prompt)}
                              title="Enhance"
                            >
                              ✨

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Tooltip**: `Enhance`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 173. handleDelete(prompt.id)}
                              title="Delete"
                            >
                              🗑️

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Tooltip**: `Delete`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 174. setShowModal(false)}
              >
                ×

**Category**: view

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 175. setShowModal(false)}>
                Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 176. 🧹 Clear Filters

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 177. setShowForm(!showForm)}
          className="btn btn-primary"
          disabled={loading}
        >
          {showForm ? 'Cancel' : '+ Add New API Configuration'}

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 178. Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 179. handleTestApi(config)}
                    className="btn btn-outline"
                    disabled={testingApi === config.id || loading}
                  >
                    {testingApi === config.id ? 'Testing...' : 'Test Connection'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 180. handleEdit(config)}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Edit

**Category**: edit

**File**: `client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 181. handleDelete(config.id)}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    Delete

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 182. setAuditModalVisible(false)}>
            Close

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/DevSettings/DocumentationManager.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 02050-information-technology

---

### 183. setAuditModalVisible(false)}>
            Close

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/DevSettings/DocumentationManager.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 184. setActiveTab(key)}
          >
            {label}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 185. runTest(testKey, category)}
                          disabled={simulationStatus.isRunning}
                        >
                          {isRunning ? 'Running...' : 'Run Test'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 186. runTest(key, 'logic')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Run Test'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 187. runTest(key, 'runtime')}
                        disabled={runningTests.has(key)}
                      >
                        {runningTests.has(key) ? 'Running...' : 'Run Test'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 188. runTest(key, 'workflow')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Run Simulation'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 189. runTest(key, 'runtime')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Start Runtime Test'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 190. runTest(key, 'scale')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Run Test'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 191. runTest(testKey, category)}
                          disabled={simulationStatus.isRunning}
                        >
                          {isRunning ? 'Running...' : 'Run Test'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 02050-information-technology

---

### 192. runTest(key, 'runtime')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Start Runtime Test'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 02050-information-technology

---

### 193. handleStateChange("templates")}
              >
                Templates

**Category**: edit

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 194. handleStateChange("create")}
              >
                Create New

**Category**: edit

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 195. handleStateChange("projects")}
              >
                Project Integration

**Category**: edit

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 196. handleStateChange("collaboration")}
              >
                Cross-Discipline

**Category**: edit

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 197. handleStateChange("analytics")}
              >
                Analytics

**Category**: edit

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 198. Clear Filters

**Category**: delete

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 199. openModal("EngineeringTemplateCreateModal", {
                    triggerPage: PAGE_ID,
                    onSuccess: fetchTemplates
                  })}
                >
                  New Engineering Template

**Category**: view

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Opens Modal**: `EngineeringTemplateCreateModal`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 200. openModal("EngineeringTemplateImportModal", {
                    triggerPage: PAGE_ID,
                    onSuccess: fetchTemplates
                  })}
                >
                  Import from CAD/Drawings

**Category**: view

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Opens Modal**: `EngineeringTemplateImportModal`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 201. openModal("ProjectTemplateMappingModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Map Templates to Projects

**Category**: view

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Opens Modal**: `ProjectTemplateMappingModal`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 202. openModal("ProjectTemplateSyncModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Sync Project Templates

**Category**: view

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Opens Modal**: `ProjectTemplateSyncModal`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 203. openModal("CrossDisciplineReviewModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Cross-Discipline Review

**Category**: view

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Opens Modal**: `CrossDisciplineReviewModal`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 204. openModal("TemplateSharingModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Share Templates

**Category**: view

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Opens Modal**: `TemplateSharingModal`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 205. openModal("EngineeringTemplateStatsModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Template Usage Analytics

**Category**: view

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Opens Modal**: `EngineeringTemplateStatsModal`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 206. openModal("ComplianceReportModal", {
                    discipline: 'engineering',
                    triggerPage: PAGE_ID
                  })}
                >
                  Engineering Compliance Report

**Category**: view

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Opens Modal**: `ComplianceReportModal`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 207. setShowViewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×

**Category**: navigation

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 208. setShowViewModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6',
                  backgroundColor: '#fff',
                  color: '#6c757d',
                  cursor: 'pointer'
                }}
              >
                Close

**Category**: navigation

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 209. {
                  setShowViewModal(false);
                  handleUseTemplate(selectedTemplate);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #FFA500',
                  backgroundColor: '#FFA500',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Use Template

**Category**: navigation

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 210. setShowDeleteModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×

**Category**: navigation

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 211. setShowDeleteModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6',
                  backgroundColor: '#fff',
                  color: '#6c757d',
                  cursor: 'pointer'
                }}
              >
                Cancel

**Category**: navigation

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 212. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 213. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 214. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 215. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 216. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 217. Close

**Category**: cancel

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 218. Cancel

**Category**: cancel

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 219. {isImporting ? "Importing..." : "Import from URL"}

**Category**: other

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 220. removeFile(file.id)}
                style={{
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove

**Category**: navigation

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 221. Cancel

**Category**: cancel

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 222. {isUploading ? "Uploading..." : "Upload Files"}

**Category**: other

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 223. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 224. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 225. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 226. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 227. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 228. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 229. Close

**Category**: cancel

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 230. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 231. Cancel

**Category**: cancel

**File**: `client/src/pages/02000-project-controls/components/modals/02000-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 232. removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕

**Category**: navigation

**File**: `client/src/pages/02000-project-controls/components/modals/02000-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 233. Cancel

**Category**: cancel

**File**: `client/src/pages/02000-project-controls/components/modals/02000-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 234. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/02000-project-controls/components/modals/02000-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 235. Cancel

**Category**: cancel

**File**: `client/src/pages/02000-project-controls/components/modals/02000-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 236. navigate('/01900-procurement')}>
            Back to Procurement

**Category**: navigation

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 237. navigate('/01900-procurement')}>
            Back to Procurement

**Category**: navigation

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 238. navigate('/01900-procurement')}
          >
            ← Back to Procurement

**Category**: navigation

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 239. window.open(order.main_document_url, '_blank')}
            >
              📄 View Final Document

**Category**: view

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 240. window.open(order.approval_cover_url, '_blank')}
            >
              📋 View Cover Sheet

**Category**: view

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 241. setActiveTab('overview')}
        >
          Overview

**Category**: view

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 242. setActiveTab('contributions')}
        >
          Contributions

**Category**: other

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 243. setActiveTab('documents')}
        >
          Documents

**Category**: other

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 244. setActiveTab('approvals')}
        >
          Approvals

**Category**: other

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 245. window.open(order.main_document_url, '_blank')}
                        >
                          📄 View PDF

**Category**: view

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 246. window.open(order.approval_cover_url, '_blank')}
                        >
                          📋 View PDF

**Category**: view

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 247. onRemoveSection(section.id)}
              style={{
                backgroundColor: "white",
                color: "black",
                border: "2px solid #dc3545",
                borderRadius: "4px",
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: "12px",
                flexShrink: 0
              }}
              title="Remove from variation"
            >
              ×

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/VariationCanvas.jsx`

**Tooltip**: `Remove from variation`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 248. ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/TemplateTypeManager.jsx`

**Tooltip**: `Close`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 249. {loading ? 'Creating...' : 'Create'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/TemplateTypeManager.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 250. Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/TemplateTypeManager.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 251. {loading ? 'Updating...' : 'Update'}

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/TemplateTypeManager.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 252. Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/TemplateTypeManager.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 253. startEdit(type)}
                      disabled={loading}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "white",
                        color: "black",
                        border: "2px solid #fd7e14",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "11px",
                        opacity: loading ? 0.5 : 1
                      }}
                      title="Edit template type"
                    >
                      Edit

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/TemplateTypeManager.jsx`

**Disabled**: Yes

**Tooltip**: `Edit template type`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 254. handleDelete(type.id || type.code, type.name)}
                      disabled={loading}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "white",
                        color: "black",
                        border: "2px solid #dc3545",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "11px",
                        opacity: loading ? 0.5 : 1
                      }}
                      title="Delete template type"
                    >
                      Delete

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/TemplateTypeManager.jsx`

**Disabled**: Yes

**Tooltip**: `Delete template type`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 255. Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/SectionLibrary.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 256. setSearchTerm('')}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#6c757d",
                cursor: "pointer",
                fontSize: "16px",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Clear search"
            >
              ×

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/SectionLibrary.jsx`

**Tooltip**: `Clear search`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 257. toggle(app.id)}
                style={{
                  padding: '5px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  border: '1px solid #dee2e6',
                  backgroundColor: statuses[app.id] === 'completed' ? '#d4edda' : '#fff',
                  color: statuses[app.id] === 'completed' ? '#155724' : '#495057',
                  fontWeight: 500
                }}
              >
                {statuses[app.id] === 'completed' ? '✅ Done' : 'Mark Done'}

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/ProcurementWorkflowOrchestrator.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 258. Skip (Not Guinea)

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ProcurementWorkflowOrchestrator.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 259. onOrderSelect?.(order)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          View Details

**Category**: view

**File**: `client/src/pages/01900-procurement/components/ProcurementAccordion.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 260. Retry

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 261. Preview

**Category**: view

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 262. Reset to Defaults

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 263. {saving ? 'Saving...' : 'Save Standards'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 264. setActiveTab('fonts')}
        >
          Fonts

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 265. setActiveTab('spacing')}
        >
          Spacing

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 266. setActiveTab('page')}
        >
          Page Layout

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 267. setActiveTab('numbering')}
        >
          Numbering

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 268. setActiveTab('colors')}
        >
          Colors

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 269. setPreviewHTML('')}>×

**Category**: view

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 270. {
            // Find and close the modal
            const modal = document.querySelector('.modal-overlay.active');
            if (modal) {
              document.body.removeChild(modal);
            } else {
              window.history.back();
            }
          })}
        >
          Close

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/DocumentAssemblyDashboard.jsx`

**Opens Modal**: `.modal-overlay.active`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 271. {assemblyInProgress ? "Assembling..." : "Start Document Assembly"}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/DocumentAssemblyDashboard.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 272. Test Workflow

**Category**: other

**File**: `client/src/pages/01900-procurement/components/CreateOrderModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 273. Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/CreateOrderModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 274. {loading ? "Creating..." : "Create Order"}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/CreateOrderModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 275. setSelectedContribution(null)}
              >
                ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ContributionTracker.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 276. setSelectedContribution(null)}
              >
                Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/ContributionTracker.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 277. {saving ? 'Saving...' : 'Save Contribution'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ContributionTracker.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 278. Refresh Status

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ContributionTracker.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 279. {generating ? 'Generating...' : 'Generate Final Documents'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ContributionTracker.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 280. ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Accessibility**: `aria-label: Close`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 281. Export Changes

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 282. Close

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 283. Undo

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Tooltip**: `Undo this change`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 284. Export Changes

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 285. Close

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 286. Undo

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Tooltip**: `Undo this change`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 287. Save

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ActionPanel.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 288. {
                  setShowNameInput(false);
                  setVariationName("");
                  setVariationTemplateType("");
                }}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "2px solid #6c757d",
                  backgroundColor: "white",
                  color: "black",
                  cursor: "pointer",
                  fontSize: "11px"
                }}
              >
                Cancel

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/ActionPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 289. setShowVariationManager(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6c757d",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "0",
                  lineHeight: "1"
                }}
                title="Close"
              >
                ×

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/ActionPanel.jsx`

**Tooltip**: `Close`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 290. {
                        onLoadVariation(variation);
                        setShowVariationManager(false);
                      }}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "white",
                        color: "black",
                        border: "2px solid #4A89DC",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px"
                      }}
                      title="Load variation"
                    >
                      Load

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/ActionPanel.jsx`

**Tooltip**: `Load variation`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 291. {
                        onDuplicateVariation(variation);
                        setShowVariationManager(false);
                      }}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "white",
                        color: "black",
                        border: "2px solid #28a745",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px"
                      }}
                      title="Duplicate variation"
                    >
                      Copy

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/ActionPanel.jsx`

**Tooltip**: `Duplicate variation`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 292. {
                        if (confirm(`Are you sure you want to delete "${variation.name}"? This action cannot be undone.`)) {
                          onDeleteVariation(variation.id, variation.name);
                        }
                      }}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "white",
                        color: "black",
                        border: "2px solid #dc3545",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px"
                      }}
                      title="Delete variation"
                    >
                      Delete

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/ActionPanel.jsx`

**Tooltip**: `Delete variation`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 293. ← Return to Chat

**Category**: other

**File**: `client/src/pages/01900-procurement/components/shared/OrderPreview.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 294. ✏️ Edit Data

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/shared/OrderPreview.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 295. {isProcessing ? '⏳ Creating Order...' : '📤 Create Order'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/shared/OrderPreview.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 296. ✏️ Edit Data

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/shared/OrderPreview.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 297. {isProcessing ? '⏳ Creating Order...' : '📤 Create Order'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/shared/OrderPreview.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 298. ← Go Back

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/shared/OrderHandoff.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 299. ← Go Back

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/shared/OrderHandoff.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 300. {isProcessing ? '⏳ Creating Order...' : '✅ Confirm & Create Order'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/shared/OrderHandoff.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 301. ← Go Back

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/shared/OrderHandoff.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 302. {isProcessing ? '⏳ Creating Order...' : '✅ Confirm & Create Order'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/shared/OrderHandoff.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 303. None of the above apply - Skip

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Accessibility**: `aria-label: Skip this category`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 304. ← Back

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Accessibility**: `aria-label: Go back to previous card`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 305. Next →

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Accessibility**: `aria-label: Proceed to next card`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 306. None of the above apply - Skip

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Accessibility**: `aria-label: Skip this category`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 307. ← Back

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Accessibility**: `aria-label: Go back to previous card`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 308. Next →

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Accessibility**: `aria-label: Proceed to next card`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 309. {
                  e.stopPropagation();
                  handleRegionClick(region);
                }}
              >
                Select {region.name}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RegionSelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 310. {
                  e.stopPropagation();
                  handleRegionClick(region);
                }}
              >
                Select {region.name}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RegionSelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 311. ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Accessibility**: `aria-label: Close`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 312. setActiveTab('search')}
          >
            Search Orders

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 313. setActiveTab('recent')}
          >
            Recent Orders

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 314. Clear

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 315. ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Accessibility**: `aria-label: Close`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 316. {loading ? 'Loading...' : 'Load Order for Editing'}

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 317. Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 318. Clear

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 319. {loading ? 'Loading...' : 'Load Order for Editing'}

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 320. Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 321. onHide()}
          >
            Close

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/OrderDetailsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 322. {
              handleEditOrder(selectedOrder);
              onHide();
            }}
          >
            Edit Order

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/modals/OrderDetailsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 323. setSearchTerm('')}
              aria-label="Clear search"
            >
              ×

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/ItemSelectionCard.jsx`

**Accessibility**: `aria-label: Clear search`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 324. {
                  e.stopPropagation();
                  handleItemClick(item);
                }}
              >
                Select {item.name.split(' ')[0]}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/ItemSelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 325. setSearchTerm('')}
          >
            Clear search

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/ItemSelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 326. {
                  e.stopPropagation();
                  handleItemClick(item);
                }}
              >
                Select {item.name.split(' ')[0]}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/ItemSelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 327. setSearchTerm('')}
          >
            Clear search

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/ItemSelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 328. setSearchTerm('')}
              aria-label="Clear search"
            >
              ×

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/GroupSelectionCard.jsx`

**Accessibility**: `aria-label: Clear search`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 329. {
                  e.stopPropagation();
                  handleGroupClick(group);
                }}
              >
                Select {group.name}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/GroupSelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 330. setSearchTerm('')}
          >
            Clear search

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/GroupSelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 331. {
                  e.stopPropagation();
                  handleGroupClick(group);
                }}
              >
                Select {group.name}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/GroupSelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 332. setSearchTerm('')}
          >
            Clear search

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/GroupSelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 333. onHide()}
          >
            Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/EditOrderModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 334. {isLoading ? 'Updating...' : 'Update Order'}

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/modals/EditOrderModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 335. onHide()}
          >
            Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/DeleteConfirmationModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 336. {
              e.target.style.backgroundColor = '#b91c1c';
              e.target.style.borderColor = '#b91c1c';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.borderColor = '#dc2626';
            }}
          >
            Delete Order

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/modals/DeleteConfirmationModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 337. onHide()}
              >
                Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/CreateOrderModal.refactored.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 338. {showSequencePreview ? 'Hide Preview' : 'Show Preview'}

**Category**: view

**File**: `client/src/pages/01900-procurement/components/modals/CreateOrderModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 339. onHide()}
              >
                Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/CreateOrderModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 340. setSearchTerm('')}
              aria-label="Clear search"
            >
              ×

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/CountrySelectionCard.jsx`

**Accessibility**: `aria-label: Clear search`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 341. {
                  e.stopPropagation();
                  handleCountryClick(country);
                }}
              >
                Select {country.name}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/CountrySelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 342. setSearchTerm('')}
          >
            Clear search

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/CountrySelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 343. {
                  e.stopPropagation();
                  handleCountryClick(country);
                }}
              >
                Select {country.name}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/CountrySelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 344. setSearchTerm('')}
          >
            Clear search

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/CountrySelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 345. setSearchTerm('')}
              aria-label="Clear search"
            >
              ×

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/CategorySelectionCard.jsx`

**Accessibility**: `aria-label: Clear search`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 346. {
                  e.stopPropagation();
                  handleCategoryClick(category);
                }}
              >
                Select {category.name.split(',')[0]}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/CategorySelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 347. setSearchTerm('')}
          >
            Clear search

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/CategorySelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 348. {
                  e.stopPropagation();
                  handleCategoryClick(category);
                }}
              >
                Select {category.name.split(',')[0]}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/CategorySelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 349. setSearchTerm('')}
          >
            Clear search

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/CategorySelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 350. e.target.style.background = '#e9ecef'}
          onMouseOut={(e) => e.target.style.background = 'none'}
        >
          ✕

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/modals/CategoryIntelligencePanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 351. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/01900-procurement/components/modals/01900-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 352. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/01900-procurement/components/modals/01900-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 353. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/01900-procurement/components/modals/01900-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 354. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/01900-procurement/components/modals/01900-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 355. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/01900-procurement/components/modals/01900-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 356. Close

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/01900-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 357. {cloudFiles.every((f) => f.selected) ? "Deselect All" : "Select All"}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/01900-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 358. removeTag(tag)}
                        className="01900-tag-chip-remove"
                        aria-label={`Remove tag ${tag}`}
                        title="Remove tag"
                      >
                        ×

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/01900-UpsertCloudModal.jsx`

**Tooltip**: `Remove tag`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 359. addTag(tagInput)}
                  disabled={!tagInput.trim()}
                  className="01900-btn 01900-btn-primary 01900-tag-add-btn 01900-btn-small"
                >
                  + Add Tag

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/01900-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 360. Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/01900-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 361. {loading ? "⏳ Processing..." : "🔗 Cloud Upsert"}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/01900-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 362. {showSequencePreview ? 'Hide Preview' : 'Show Preview'}

**Category**: view

**File**: `client/src/pages/01900-procurement/components/modals/phases/TemplateSelectionPhase.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 363. handleCardComplete(activeCardId)}
            disabled={disabled || isProcessing}
          >
            {isProcessing ? 'Saving...' : 'Complete Card'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/components/RequirementsCardSystem.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 364. setActiveCardId(null)}
            disabled={disabled || isProcessing}
          >
            Skip for Now

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/components/RequirementsCardSystem.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 365. handleCardComplete(activeCardId)}
            disabled={disabled || isProcessing}
          >
            {isProcessing ? 'Saving...' : 'Complete Card'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/components/RequirementsCardSystem.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 366. setActiveCardId(null)}
            disabled={disabled || isProcessing}
          >
            Skip for Now

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/components/RequirementsCardSystem.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 367. onSupplierAssign && onSupplierAssign(null)}
              title="Clear supplier"
            >
              ×

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Tooltip**: `Clear supplier`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 368. setShowSupplierPanel(false)}
            >
              ×

**Category**: view

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 369. 📊 Extract

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Disabled**: Yes

**Tooltip**: `Extract data from current conversation`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 370. ✅ Validate

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Disabled**: Yes

**Tooltip**: `Validate extracted data`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 371. {isProcessing ? '⏳' : '📤'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Disabled**: Yes

**Tooltip**: `Send message`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 372. onSupplierAssign && onSupplierAssign(null)}
              title="Clear supplier"
            >
              ×

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Tooltip**: `Clear supplier`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 373. 📊 Extract

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Disabled**: Yes

**Tooltip**: `Extract data from current conversation`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 374. ✅ Validate

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Disabled**: Yes

**Tooltip**: `Validate extracted data`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 375. {isProcessing ? '⏳' : '📤'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Disabled**: Yes

**Tooltip**: `Send message`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 376. window.dispatchEvent(new CustomEvent('switch-to-chat-tab'))}
          >
            ← Return to Chat

**Category**: other

**File**: `client/src/pages/01900-procurement/components/documents/SOWViewer.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 377. window.print()}>
            🖨️ Print

**Category**: other

**File**: `client/src/pages/01900-procurement/components/documents/SOWViewer.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 378. window.dispatchEvent(new CustomEvent('switch-to-chat-tab'))}
          >
            ← Return to Chat

**Category**: other

**File**: `client/src/pages/01900-procurement/components/documents/SOWViewer.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 379. window.print()}>
            🖨️ Print

**Category**: other

**File**: `client/src/pages/01900-procurement/components/documents/SOWViewer.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 380. Try Again

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/ModalErrorBoundary.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 381. window.location.reload()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Reload Page

**Category**: navigation

**File**: `client/src/pages/01850-other-parties/components/ModalErrorBoundary.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 382. {saving ? "Saving..." : "💾 Save Weights"}

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/AgentWeightsConfig.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 383. 🔄 Reset to Defaults

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/AgentWeightsConfig.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 384. 🔄 Refresh

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/AgentWeightsConfig.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 385. {
              e.target.style.backgroundColor = contractsTheme.secondary;
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = "white";
            }}
          >
            Previous

**Category**: navigation

**File**: `client/src/pages/01850-other-parties/components/modals/ContractorVettingModalFooter.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 386. Close

**Category**: cancel

**File**: `client/src/pages/01850-other-parties/components/modals/ContractorVettingModalFooter.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 387. Next

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/modals/ContractorVettingModalFooter.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 388. {swarmRunning ? "Processing..." : "Complete Vetting"}

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/modals/ContractorVettingModalFooter.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 389. Complete

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/modals/ContractorVettingModalFooter.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 390. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/01850-other-parties/components/modals/01850-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 391. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/01850-other-parties/components/modals/01850-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 392. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/01850-other-parties/components/modals/01850-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 393. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/01850-other-parties/components/modals/01850-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 394. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/01850-other-parties/components/modals/01850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 395. Close

**Category**: cancel

**File**: `client/src/pages/01850-other-parties/components/modals/01850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 396. {
                    // Remove document functionality would be passed as prop
                    console.log("Remove document:", doc.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: contractsTheme.danger,
                    cursor: "pointer",
                    fontSize: "16px",
                    padding: "4px",
                  }}
                  title="Remove document"
                >
                  ×

**Category**: navigation

**File**: `client/src/pages/01850-other-parties/components/modals/steps/DocumentUploadStep.jsx`

**Tooltip**: `Remove document`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 397. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 398. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 399. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 400. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 401. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 402. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 403. Close

**Category**: cancel

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 404. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 405. Cancel

**Category**: cancel

**File**: `client/src/pages/01800-operations/components/modals/01800-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 406. removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕

**Category**: navigation

**File**: `client/src/pages/01800-operations/components/modals/01800-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 407. Cancel

**Category**: cancel

**File**: `client/src/pages/01800-operations/components/modals/01800-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 408. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/01750-legal/components/modals/01750-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01750-legal

---

### 409. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/01750-legal/components/modals/01750-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01750-legal

---

### 410. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/01750-legal/components/modals/01750-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01750-legal

---

### 411. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/01750-legal/components/modals/01750-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01750-legal

---

### 412. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/01750-legal/components/modals/01750-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01750-legal

---

### 413. Close

**Category**: cancel

**File**: `client/src/pages/01750-legal/components/modals/01750-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01750-legal

---

### 414. {
              e.stopPropagation();
              onRefresh();
            }}
          >
            🔄 Refresh

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsOrderSelector.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 01700-logistics

---

### 415. {
              e.stopPropagation();
              onRefresh();
            }}
          >
            🔄 Refresh

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsOrderSelector.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 416. ➕ Create

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Tooltip**: `Create New Logistics Document`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 417. ×

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Tooltip**: `Close Modal`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 418. handleTabChange(tab.id)}
              >
                {tab.id === 'dashboard' && 'Dashboard'}
                {tab.id === 'cdc' && 'CDC'}
                {tab.id === 'documents' && 'Documents'}
                {tab.id === 'tracking' && 'Tracking'}
                {tab.id === 'compliance' && 'Compliance'}
                {tab.id === 'chat' && 'Chat'}

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 419. Change Order

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 420. {
                      // Open tracking interface
                      openModal('LogisticsTrackingModal', {
                        modalTitle: 'Shipment Tracking',
                        triggerPage: '01700-logistics'
                      });
                    }}
                  >
                    Open Tracking Dashboard

**Category**: view

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Opens Modal**: `LogisticsTrackingModal`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 421. Close

**Category**: cancel

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 422. ×

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 423. Cancel

**Category**: cancel

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 424. Save Changes

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 425. ➕ Create

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Tooltip**: `Create New Logistics Document`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 426. ×

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Tooltip**: `Close Modal`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 427. Change Order

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 428. {
                      // Open tracking interface
                      openModal('LogisticsTrackingModal', {
                        modalTitle: 'Shipment Tracking',
                        triggerPage: '01700-logistics'
                      });
                    }}
                  >
                    Open Tracking Dashboard

**Category**: view

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Opens Modal**: `LogisticsTrackingModal`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 429. Close

**Category**: cancel

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 430. ×

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 431. Cancel

**Category**: cancel

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 432. Save Changes

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 433. ×

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Tooltip**: `Close Chat`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 434. {isProcessing ? '⏳' : '📤'}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Disabled**: Yes

**Tooltip**: `Send Message`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 435. setCurrentMessage('Validate current data')}
              disabled={isProcessing}
            >
              🔍 Validate Data

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 436. setCurrentMessage('Make supplier required')}
              disabled={isProcessing}
            >
              ✅ Make Supplier Required

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 437. setCurrentMessage('Help with document generation')}
              disabled={isProcessing}
            >
              📄 Document Help

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 438. ×

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Tooltip**: `Close Chat`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 439. {isProcessing ? '⏳' : '📤'}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Disabled**: Yes

**Tooltip**: `Send Message`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 440. setCurrentMessage('Validate current data')}
              disabled={isProcessing}
            >
              🔍 Validate Data

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 441. setCurrentMessage('Make supplier required')}
              disabled={isProcessing}
            >
              ✅ Make Supplier Required

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 442. setCurrentMessage('Help with document generation')}
              disabled={isProcessing}
            >
              📄 Document Help

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 443. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 444. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 445. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 446. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 447. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 448. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 449. Close

**Category**: cancel

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 450. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 451. Cancel

**Category**: cancel

**File**: `client/src/pages/01700-logistics/components/modals/01700-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 452. removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕

**Category**: navigation

**File**: `client/src/pages/01700-logistics/components/modals/01700-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 453. Cancel

**Category**: cancel

**File**: `client/src/pages/01700-logistics/components/modals/01700-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 454. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/01700-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 455. Cancel

**Category**: cancel

**File**: `client/src/pages/01700-logistics/components/modals/01700-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 456. handleCardAction(card.id, 'view-details')}
          >
            View details

**Category**: actions

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 457. handleCardAction(card.id, 'manage-documents')}
          >
            Go to Documents

**Category**: actions

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 458. handleCardAction(card.id, 'view-compliance')}
          >
            Open Compliance

**Category**: actions

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 459. handleCardAction(card.id, 'create-cdc')}
          >
            Open CDC

**Category**: actions

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 460. {
              if (tab.id !== 'dashboard') {
                await openLogisticsModal(tab.id, { procurementOrderId });
              }
            }}
          >
            {tab.name}

**Category**: view

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 461. Retry

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 462. openLogisticsModal('documents', { procurementOrderId })}>Documents

**Category**: view

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 463. openLogisticsModal('tracking', { procurementOrderId })}>Tracking

**Category**: view

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 464. openLogisticsModal('compliance', { procurementOrderId })}>Compliance

**Category**: view

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 465. openLogisticsModal('documents', { procurementOrderId })}>Documents

**Category**: view

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 466. openLogisticsModal('tracking', { procurementOrderId })}>Tracking

**Category**: view

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 467. openLogisticsModal('compliance', { procurementOrderId })}>Compliance

**Category**: view

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 468. Retry

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 469. handleCategoryChange('all')}
          >
            All Categories ({complianceData.totalRequirements})

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 470. handleCategoryChange(key)}
            >
              {category.name} ({category.requirements.length})

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 471. handleDocumentUpload(requirement.id)}
                        >
                          📎 Upload Document

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 472. handleStatusUpdate(requirement.id, 'completed')}
                        >
                          ✅ Mark Complete

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 473. handleStatusUpdate(requirement.id, 'pending')}
                        >
                          🔄 Reopen

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 474. 🔄 Refresh Status

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 475. openLogisticsModal('dashboard', { procurementOrderId })}
        >
          📊 Back to Dashboard

**Category**: navigation

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 476. handleCategoryChange('all')}
          >
            All Categories ({complianceData.totalRequirements})

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 477. handleCategoryChange(key)}
            >
              {category.name} ({category.requirements.length})

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 478. handleDocumentUpload(requirement.id)}
                        >
                          📎 Upload Document

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 479. handleStatusUpdate(requirement.id, 'completed')}
                        >
                          ✅ Mark Complete

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 480. handleStatusUpdate(requirement.id, 'pending')}
                        >
                          🔄 Reopen

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 481. 🔄 Refresh Status

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 482. openLogisticsModal('dashboard', { procurementOrderId })}
        >
          📊 Back to Dashboard

**Category**: navigation

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 483. Retry

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/CDCTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 484. handleAttachDocument(doc.id)}
                  >
                    Attach

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/CDCTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 485. {isSubmitting ? 'Submitting...' : 'Submit CDC Declaration'}

**Category**: submit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/CDCTab.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 486. openLogisticsModal('dashboard', { procurementOrderId })}
        >
          Back to Dashboard

**Category**: navigation

**File**: `client/src/pages/01700-logistics/components/modals/tabs/CDCTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 487. handleAttachDocument(doc.id)}
                  >
                    Attach

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/CDCTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 488. {isSubmitting ? 'Submitting...' : 'Submit CDC Declaration'}

**Category**: submit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/CDCTab.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 489. openLogisticsModal('dashboard', { procurementOrderId })}
        >
          Back to Dashboard

**Category**: navigation

**File**: `client/src/pages/01700-logistics/components/modals/tabs/CDCTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 490. {isValidating ? 'Validating...' : 'Validate Data'}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/components/LogisticsDocumentGenerator.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 491. 0}
          >
            {isProcessing ? 'Generating...' : `Generate ${selectedDocumentType ? availableDocuments.find(d => d.value === selectedDocumentType)?.label : 'Document'}`}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/components/LogisticsDocumentGenerator.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 492. 0}
          >
            {isProcessing ? 'Generating...' : `Generate All Required (${availableDocuments.filter(d => d.required).length})`}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/components/LogisticsDocumentGenerator.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 493. {isValidating ? 'Validating...' : 'Validate Data'}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/components/LogisticsDocumentGenerator.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 494. 0}
          >
            {isProcessing ? 'Generating...' : `Generate ${selectedDocumentType ? availableDocuments.find(d => d.value === selectedDocumentType)?.label : 'Document'}`}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/components/LogisticsDocumentGenerator.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 495. 0}
          >
            {isProcessing ? 'Generating...' : `Generate All Required (${availableDocuments.filter(d => d.required).length})`}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/components/LogisticsDocumentGenerator.jsx`

**Disabled**: Yes

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 496. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 497. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 498. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 499. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 500. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 501. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 502. Close

**Category**: cancel

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 503. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 504. Cancel

**Category**: cancel

**File**: `client/src/pages/01500-human-resources/components/modals/01500-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 505. removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕

**Category**: navigation

**File**: `client/src/pages/01500-human-resources/components/modals/01500-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 506. Cancel

**Category**: cancel

**File**: `client/src/pages/01500-human-resources/components/modals/01500-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 507. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/01400-health/components/modals/01400-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01400-health

---

### 508. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/01400-health/components/modals/01400-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01400-health

---

### 509. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/01400-health/components/modals/01400-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01400-health

---

### 510. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/01400-health/components/modals/01400-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01400-health

---

### 511. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/01400-health/components/modals/01400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01400-health

---

### 512. Close

**Category**: cancel

**File**: `client/src/pages/01400-health/components/modals/01400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01400-health

---

### 513. ×

**Category**: other

**File**: `client/src/pages/01300-hitl-review/components/hitl-review-modal.jsx`

**Accessibility**: `aria-label: Close`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 514. setError(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#721c24",
                    cursor: "pointer",
                    padding: "0.25rem",
                    fontSize: "1.25rem",
                    lineHeight: 1,
                  }}
                  aria-label="Close error"
                >
                  ×

**Category**: navigation

**File**: `client/src/pages/01300-hitl-review/components/hitl-review-modal.jsx`

**Accessibility**: `aria-label: Close error`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 515. setShowWorkflowDiagram(false)}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.25rem",
              cursor: "pointer",
              padding: "0 0.25rem",
              color: "#6c757d",
            }}
            title="Close workflow diagram"
          >
            ×

**Category**: navigation

**File**: `client/src/pages/01300-hitl-review/components/WorkflowDiagram.jsx`

**Tooltip**: `Close workflow diagram`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 516. {isRestoreMode ? '✕ Cancel' : '↩️ Restore'}

**Category**: cancel

**File**: `client/src/pages/01300-hitl-review/components/RestorePointsPanel.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 517. {
                          e.stopPropagation();
                          handleRollback(checkpoint.id);
                        }}
                        disabled={!checkpoint.canRollback}
                        title={checkpoint.canRollback ? 'Restore to this point' : 'Cannot rollback'}
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.7rem',
                          border: '1px solid #007bff',
                          backgroundColor: checkpoint.canRollback ? '#007bff' : '#e9ecef',
                          color: checkpoint.canRollback ? 'white' : '#6c757d',
                          borderRadius: '3px',
                          cursor: checkpoint.canRollback ? 'pointer' : 'not-allowed'
                        }}
                      >
                        ↩️

**Category**: navigation

**File**: `client/src/pages/01300-hitl-review/components/RestorePointsPanel.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 518. {
                          e.stopPropagation();
                          onDeleteCheckpoint(checkpoint.id);
                        }}
                        title="Delete checkpoint"
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.7rem',
                          border: '1px solid #dc3545',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        ×

**Category**: navigation

**File**: `client/src/pages/01300-hitl-review/components/RestorePointsPanel.jsx`

**Tooltip**: `Delete checkpoint`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 519. setShowConfirmClear(true)}
              disabled={restorePoints.length === 0}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                border: '1px solid #6c757d',
                backgroundColor: 'transparent',
                color: '#6c757d',
                borderRadius: '4px',
                cursor: restorePoints.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Clear All

**Category**: navigation

**File**: `client/src/pages/01300-hitl-review/components/RestorePointsPanel.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 520. selectedCheckpointId && onRollback(selectedCheckpointId)}
              disabled={!selectedCheckpointId}
              style={{
                padding: '6px 16px',
                fontSize: '0.8rem',
                border: 'none',
                backgroundColor: selectedCheckpointId ? '#28a745' : '#e9ecef',
                color: selectedCheckpointId ? 'white' : '#6c757d',
                borderRadius: '4px',
                cursor: selectedCheckpointId ? 'pointer' : 'not-allowed',
                fontWeight: 600
              }}
            >
              Restore Selected

**Category**: navigation

**File**: `client/src/pages/01300-hitl-review/components/RestorePointsPanel.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 521. setShowConfirmClear(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.875rem',
                  border: '1px solid #6c757d',
                  backgroundColor: 'transparent',
                  color: '#6c757d',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel

**Category**: navigation

**File**: `client/src/pages/01300-hitl-review/components/RestorePointsPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 522. {
                  onClearAll();
                  setShowConfirmClear(false);
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.875rem',
                  border: 'none',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete All

**Category**: navigation

**File**: `client/src/pages/01300-hitl-review/components/RestorePointsPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 523. ×

**Category**: other

**File**: `client/src/pages/01300-hitl-review/components/AgentWorkflowReview.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 524. Show Diagram

**Category**: view

**File**: `client/src/pages/01300-hitl-review/components/AgentWorkflowReview.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 525. onClick(workflow)}
        style={{
          padding: '0.5rem 1rem',
          border: '2px solid #007bff',
          backgroundColor: 'white',
          color: 'black',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: '500'
        }}
      >
        View Tasks

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/TasksWorkflowsContent.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 526. handleWorkflowClick(workflow)}
          style={{
            padding: '0.5rem 1rem',
            border: '2px solid #007bff',
            backgroundColor: 'white',
            color: 'black',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}
        >
          View Tasks

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/TaskCards.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 527. removeToast(toast.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: 'inherit'
                  }}
                >
                  ×

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/NEW-FormCreationPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 528. setShowTemplateModal(true)}
            >
              🤖 AI Generate

**Category**: view

**File**: `client/src/pages/01300-governance/components/NEW-FormCreationPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 529. handleCreateForm()}
            >
              ➕ New Form

**Category**: other

**File**: `client/src/pages/01300-governance/components/NEW-FormCreationPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 530. setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                style={{
                  ...styles.button,
                  padding: '8px',
                  fontSize: '12px',
                  backgroundColor: viewMode === 'grid' ? '#007bff' : '#6c757d'
                }}
              >
                {viewMode === 'grid' ? '⊞' : '⊟'}

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/NEW-FormCreationPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 531. refreshData()}
                disabled={loading}
                style={{
                  ...styles.button,
                  padding: '8px',
                  fontSize: '12px'
                }}
              >
                🔄

**Category**: other

**File**: `client/src/pages/01300-governance/components/NEW-FormCreationPage.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 532. setShowTemplateModal(false)}
                style={styles.button}
              >
                Close

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/NEW-FormCreationPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 533. window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Page

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/NEW-FormCreationPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 534. {
                      // Navigate to the appropriate page based on workflow type
                      if (workflow.type === "procurement_order") {
                        navigate("/purchase-orders");
                      } else {
                        // For other workflow types, filter the tasks view to show related tasks
                        setActiveTab("tasks");
                        setSearchFilters(prev => ({
                          ...prev,
                          discipline: "all", // Could be made more specific based on workflow type
                        }));
                      }
                    }}
                    style={{
                      padding: "0.5rem 1rem",
                      border: "2px solid #007bff",
                      backgroundColor: "white",
                      color: "black",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                    }}
                  >
                    View Tasks

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/MyTasksDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 535. {
                              e.stopPropagation();
                              deleteTemplate(preset.id);
                            }}
                          >
                            Delete

**Category**: delete

**File**: `client/src/pages/01300-governance/components/FormStylingPromptModal.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 01300-governance

---

### 536. Remove

**Category**: delete

**File**: `client/src/pages/01300-governance/components/FormStylingPromptModal.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 01300-governance

---

### 537. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/FormStylingPromptModal.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 01300-governance

---

### 538. {
                              e.stopPropagation();
                              deleteTemplate(preset.id);
                            }}
                          >
                            Delete

**Category**: delete

**File**: `client/src/pages/01300-governance/components/FormStylingPromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 539. Remove

**Category**: delete

**File**: `client/src/pages/01300-governance/components/FormStylingPromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 540. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/FormStylingPromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 541. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/DocumentUploadTemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 542. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/DocumentUploadTemplateModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 543. {isProcessing ? "Creating Template..." : "Create Template"}

**Category**: other

**File**: `client/src/pages/01300-governance/components/DocumentUploadTemplateModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 544. setShowNewRequest(!showNewRequest)}
        >
          {showNewRequest ? 'Cancel Request' : '+ New Sharing Request'}

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 01300-governance

---

### 545. Submit Governance Request

**Category**: submit

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Disabled**: Yes

**Pattern**: Button with text and onClick

**Page Type**: 01300-governance

---

### 546. handleApprovalAction(request.id, 'approve', '')}
                            >
                              ✅ Approve

**Category**: actions

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 01300-governance

---

### 547. {
                                const comments = prompt('Denial reason:');
                                if (comments) handleApprovalAction(request.id, 'deny', comments);
                              }}
                            >
                              ❌ Deny

**Category**: actions

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 01300-governance

---

### 548. setShowNewRequest(!showNewRequest)}
        >
          {showNewRequest ? 'Cancel Request' : '+ New Sharing Request'}

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 549. Submit Governance Request

**Category**: submit

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 550. handleApprovalAction(request.id, 'approve', '')}
                            >
                              ✅ Approve

**Category**: actions

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 551. {
                                const comments = prompt('Denial reason:');
                                if (comments) handleApprovalAction(request.id, 'deny', comments);
                              }}
                            >
                              ❌ Deny

**Category**: actions

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 552. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/TemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 553. {
                if (editFormData.name) {
                  onEditModeToggle(true);
                  onHide();
                }
              }}
              disabled={!editFormData.name}
            >
              Advanced Editor

**Category**: edit

**File**: `client/src/pages/01300-governance/components/ui-renderers/TemplateModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 554. setIsOpen(!isOpen)}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#6c757d';
          e.target.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'white';
          e.target.style.color = '#6c757d';
        }}
        title="More actions"
        aria-label={`More actions for ${form.name}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        ⋯

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormsTableRenderer.jsx`

**Tooltip**: `More actions`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 555. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormEditModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 556. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormEditModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 557. Save Form

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormEditModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 558. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormDetailModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 559. Close

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormDetailModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 560. setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Close"
            >
              ×

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationToastContainer.jsx`

**Accessibility**: `aria-label: Close`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 561. {
                  setSearchTerm("");
                  setFormTypeFilter("all");
                  setStatusFilter("all");
                }}
              >
                🔄 Clear Filters

**Category**: delete

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationSearchAndFilters.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 562. handleCreateProcurementTemplate(template)}
                >
                  Create Template

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationProcurementTemplatesSection.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 563. setShowProcurementTemplates(false)}
          >
            Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationProcurementTemplatesSection.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 564. setShowTemplateModal(false)}
                >
                  ×

**Category**: view

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationModals.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 565. {
                    if (editFormData.name) {
                      setIsEditMode(true);
                      setShowTemplateModal(false);
                    }
                  }}
                  disabled={!editFormData.name}
                >
                  Advanced Editor

**Category**: edit

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationModals.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 566. setShowPreviewModal(false)}
              >
                ×

**Category**: view

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationModals.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 567. setShowPreviewModal(false)}
              >
                Close Preview

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationModals.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 568. {
                  setShowContentVerificationModal(false);
                  setPendingFormData(null);
                  addToast({
                    title: "Verification Cancelled",
                    message: "Document processing verification was cancelled",
                    variant: "info",
                  });
                }}
              >
                ×

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationModals.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 569. setError(null)}
                aria-label="Close error"
              >
                ×

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationMainContent.jsx`

**Accessibility**: `aria-label: Close error`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 570. setError(null)}
        aria-label="Close"
      >
        ×

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationErrorDisplay.jsx`

**Accessibility**: `aria-label: Close`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 571. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/BulkDisciplineCopyModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 572. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/BulkDisciplineCopyModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 573. 🔄 Copy to Discipline Templates

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/BulkDisciplineCopyModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 574. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/BulkApprovalModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 575. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/BulkApprovalModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 576. {
              onBulkApprove();
              onHide();
            }}
          >
            Publish All

**Category**: submit

**File**: `client/src/pages/01300-governance/components/ui-renderers/BulkApprovalModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 577. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 578. setShowEnhanceModal(true)}
                      disabled={!customPrompt.trim()}
                      title="Enhance your prompt with AI suggestions, templates, and resources"
                    >
                      ✨ Enhance

**Category**: view

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Disabled**: Yes

**Tooltip**: `Enhance your prompt with AI suggestions, templates, and resources`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 579. setCustomPrompt(example)}
                      >
                        {example.length > 30 ? example.substring(0, 30) + '...' : example}

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 580. {currentStep === 'discipline' ? 'Cancel' : '← Back'}

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 581. 🤖 Generate Template

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 582. downloadHtmlTemplate(generatedTemplate)}
                  >
                    📥 Download HTML

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 583. openHtmlInNewTab(generatedTemplate)}
                  >
                    🌐 Open in Browser

**Category**: view

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 584. 💾 Save Template

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 585. {
              e.target.style.backgroundColor = "#fff8f2";
              e.target.style.borderColor = "#ffb733";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.borderColor = "#ffa500";
            }}
          >
            Clear Filters

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/templates/components/TemplateFilters.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 586. Close Preview

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplatePreviewRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 587. window.open('', '_blank').document.write(preview?.html || '')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#4A89DC',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Open in New Tab

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplatePreviewRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 588. navigator.clipboard.writeText(preview?.html || '')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Copy HTML

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplatePreviewRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 589. Close

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplatePreviewRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 590. {
              const blob = new Blob([preview.html], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${template.name.replace(/\s+/g, '_')}_preview.html`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            style={{
              padding: '8px 16px',
              border: '1px solid #28a745',
              backgroundColor: '#28a745',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Download HTML

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplatePreviewRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 591. setError(null)}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#721c24',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateManagementMainContent.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 592. {
                    e.stopPropagation();
                    onTemplatePreview(template);
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    border: '1px solid #4A89DC',
                    backgroundColor: 'white',
                    color: '#4A89DC',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#4A89DC';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#4A89DC';
                  }}
                >
                  👁️ Preview

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateManagementMainContent.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 593. {
                    e.stopPropagation();
                    onTemplateEdit(template);
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    border: '1px solid #28a745',
                    backgroundColor: 'white',
                    color: '#28a745',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#28a745';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#28a745';
                  }}
                >
                  ✏️ Edit

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateManagementMainContent.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 594. {
                    e.stopPropagation();
                    onTemplateDelete(template);
                  }}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #dc3545',
                    backgroundColor: 'white',
                    color: '#dc3545',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#dc3545';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#dc3545';
                  }}
                >
                  🗑️

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateManagementMainContent.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 595. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateEditorRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 596. Save Template

**Category**: other

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateEditorRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 597. + Add Section

**Category**: other

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateEditorRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 598. setActiveSection(index)}
                  style={{
                    padding: '8px 16px',
                    border: activeSection === index ? '2px solid #4A89DC' : '1px solid #dee2e6',
                    backgroundColor: activeSection === index ? '#e7f3ff' : 'white',
                    color: activeSection === index ? '#4A89DC' : '#000000',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {section.title}

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateEditorRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 599. deleteSection(activeSection)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    Delete Section

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateEditorRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 600. addQuestion(activeSection)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      + Add Question

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateEditorRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 601. deleteQuestion(activeSection, qIndex)}
                          style={{
                            padding: '2px 6px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          ×

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateEditorRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 602. Close

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 603. {
              e.target.style.backgroundColor = "#fff8f2";
              e.target.style.borderColor = "#ffb733";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.borderColor = "#ffa500";
            }}
          >
            Cancel

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/modals/TemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 604. {
              e.target.style.backgroundColor = "#fff8f2";
              e.target.style.borderColor = "#ffb733";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.borderColor = "#ffa500";
            }}
          >
            {selectedTemplate ? "Update Template" : "Create Template"}

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/modals/TemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 605. {
                e.target.style.backgroundColor = "#fff8f2";
                e.target.style.borderColor = "#ffb733";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "white";
                e.target.style.borderColor = "#ffa500";
              }}
            >
              Cancel

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/modals/BulkTemplateCopyModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 606. {
                  e.target.style.backgroundColor = "#fff8f2";
                  e.target.style.borderColor = "#ffb733";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "white";
                  e.target.style.borderColor = "#ffa500";
                }}
              >
                Cancel

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/modals/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 607. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 608. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 609. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 610. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 611. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 612. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 613. Close

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 614. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 615. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/modals/01300-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 616. removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/modals/01300-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 617. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/modals/01300-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 618. {
                      e.stopPropagation();
                      onFormView?.(form);
                    }}
                  >
                    👁️

**Category**: view

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormList.jsx`

**Tooltip**: `View form details`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 619. {
                      e.stopPropagation();
                      onFormEdit?.(form);
                    }}
                  >
                    ✏️

**Category**: edit

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormList.jsx`

**Tooltip**: `Edit form`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 620. {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${form.name}"? This action cannot be undone.`)) {
                        onFormDelete?.(form);
                      }
                    }}
                  >
                    🗑️

**Category**: actions

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormList.jsx`

**Tooltip**: `Delete form`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 621. 🔄 Clear Filters

**Category**: delete

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormFilteringSection.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 622. !saving && onHide?.()}
            disabled={saving}
            aria-label="Close modal"
          >
            ×

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormEditorModal.jsx`

**Opens Modal**: `Close modal`

**Accessibility**: `aria-label: Close modal`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 623. !saving && onCancel?.()}
              disabled={saving}
            >
              Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormEditorModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 624. {
                e.stopPropagation();
                onView?.(form);
              }}
            >
              👁️ View

**Category**: view

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormCard.jsx`

**Tooltip**: `View form details`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 625. {
                  e.stopPropagation();
                  onEdit?.(form);
                }}
              >
                ✏️ Edit

**Category**: edit

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormCard.jsx`

**Tooltip**: `Edit form`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 626. {
                  e.stopPropagation();
                  if (window.confirm(`Delete "${form.name}"? This action cannot be undone.`)) {
                    onDelete?.(form);
                  }
                }}
              >
                🗑️ Delete

**Category**: actions

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormCard.jsx`

**Tooltip**: `Delete form`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 627. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/TemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 628. {
                if (editFormData.name) {
                  onEditModeToggle(true);
                  onHide();
                }
              }}
              disabled={!editFormData.name}
            >
              Advanced Editor

**Category**: edit

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/TemplateModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 629. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/HoldPointNotificationModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 630. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/HoldPointNotificationModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 631. Generate HTML Template

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/HoldPointNotificationModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 632. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormsTableRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 633. {
              e.target.style.backgroundColor = '#fff8f2';
              e.target.style.borderColor = '#ffb733';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#ffa500';
            }}
          >
            Cancel

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormsTableRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 634. {
              e.target.style.backgroundColor = '#fff8f2';
              e.target.style.borderColor = '#ffb733';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#ffa500';
            }}
          >
            👁️ Preview Form

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormsTableRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 635. {
                if (!isPublishing) {
                  e.target.style.backgroundColor = '#fff8f2';
                  e.target.style.borderColor = '#ffb733';
                }
              }}
              onMouseLeave={(e) => {
                if (!isPublishing) {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#ffa500';
                }
              }}
            >
              {isPublishing ? "🚀 Publishing..." : "🚀 Publish Form"}

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormsTableRenderer.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 636. setIsOpen(!isOpen)}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#6c757d';
          e.target.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'white';
          e.target.style.color = '#6c757d';
        }}
        title="More actions"
        aria-label={`More actions for ${form.name}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        ⋯

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormsTableRenderer.jsx`

**Tooltip**: `More actions`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 637. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormEditModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 638. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormEditModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 639. Save Form

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormEditModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 640. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormDetailModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 641. Close

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormDetailModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 642. setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Close"
            >
              ×

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormCreationToastContainer.jsx`

**Accessibility**: `aria-label: Close`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 643. {
                  setSearchTerm("");
                  setFormTypeFilter("all");
                  setStatusFilter("all");
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#fff8f2';
                  e.target.style.borderColor = '#ffb733';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#ffa500';
                }}
              >
                Clear Filters

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormCreationSearchAndFilters.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 644. handleCreateProcurementTemplate(template)}
                >
                  Create Template

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormCreationProcurementTemplatesSection.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 645. setShowProcurementTemplates(false)}
          >
            Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormCreationProcurementTemplatesSection.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 646. setError(null)}
                aria-label="Close error"
              >
                ×

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormCreationMainContent.jsx`

**Accessibility**: `aria-label: Close error`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 647. setError(null)}
        aria-label="Close"
      >
        ×

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormCreationErrorDisplay.jsx`

**Accessibility**: `aria-label: Close`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 648. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 649. applyBulkAction('mark_all_editable')}
              >
                Mark All Editable

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 650. applyBulkAction('mark_all_readonly')}
              >
                Mark All Read-only

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 651. applyBulkAction('enable_ai_suggestions')}
              >
                Enable AI Suggestions

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 652. applyBulkAction('disable_ai_suggestions')}
              >
                Disable AI Suggestions

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 653. applyBulkAction('mark_all_required')}
              >
                Mark All Required

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 654. applyBulkAction('clear_requirements')}
              >
                Clear All Requirements

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 655. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 656. Proceed to Template Creation

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 657. applyBulkAction('mark_all_editable')}
            >
              Mark All Editable

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 658. applyBulkAction('mark_all_readonly')}
            >
              Mark All Read-only

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 659. applyBulkAction('enable_ai_suggestions')}
            >
              Enable AI Suggestions

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 660. applyBulkAction('disable_ai_suggestions')}
            >
              Disable AI Suggestions

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 661. applyBulkAction('mark_all_required')}
            >
              Mark All Required

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 662. applyBulkAction('clear_requirements')}
            >
              Clear All Requirements

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 663. setActiveTab('original')}
          style={{
            flex: 1,
            padding: '12px 20px',
            border: 'none',
            backgroundColor: activeTab === 'original' ? '#007bff' : 'transparent',
            color: activeTab === 'original' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'original' ? '600' : '400',
            borderRadius: activeTab === 'original' ? '4px 4px 0 0' : '0'
          }}
        >
          📄 Original Document ({originalContent.length} characters)

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 664. setActiveTab('processed')}
          style={{
            flex: 1,
            padding: '12px 20px',
            border: 'none',
            backgroundColor: activeTab === 'processed' ? '#007bff' : 'transparent',
            color: activeTab === 'processed' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'processed' ? '600' : '400',
            borderRadius: activeTab === 'processed' ? '4px 4px 0 0' : '0'
          }}
        >
          📋 Processed Fields ({processedFields.length} fields)

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 665. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 666. {
            // Pass field configurations and updated form name to the continue callback
            const formWithConfigurations = {
              ...form,
              name: formName, // Include the editable form name
              fieldConfigurations: fieldConfigurations
            };
            onContinue(formWithConfigurations);
          }}
          disabled={!formName.trim()}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: formName.trim() ? '#28a745' : '#6c757d',
            color: 'white',
            borderRadius: '4px',
            cursor: formName.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            opacity: formName.trim() ? 1 : 0.6
          }}
        >
          ✅ Continue & Save Form

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 667. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/BulkDisciplineCopyModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 668. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/BulkDisciplineCopyModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 669. 🔄 Copy to Discipline Templates

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/BulkDisciplineCopyModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 670. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/BulkApprovalModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 671. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/BulkApprovalModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 672. {
              onBulkApprove();
              onHide();
            }}
          >
            Publish All

**Category**: submit

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/BulkApprovalModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 673. !saving && onHide?.()}
            disabled={saving}
          >
            ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/AdvancedFormConfigurationModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 674. {
                if (configurationStep === 'fields') setConfigurationStep('basic');
                if (configurationStep === 'comparison') setConfigurationStep('fields');
              }}
              disabled={saving}
            >
              ← Back

**Category**: navigation

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/AdvancedFormConfigurationModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 675. {'Next: Configure Fields →'}

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/AdvancedFormConfigurationModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 676. {'Next: Review & Save →'}

**Category**: view

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/AdvancedFormConfigurationModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 677. {saving ? '⏳ Saving...' : '💾 Save Form Configuration'}

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/AdvancedFormConfigurationModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 678. {
                      e.stopPropagation();
                      onFormView?.(form);
                    }}
                  >
                    👁️

**Category**: view

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormList.jsx`

**Tooltip**: `View form details`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 679. {
                      e.stopPropagation();
                      onFormEdit?.(form);
                    }}
                  >
                    ✏️

**Category**: edit

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormList.jsx`

**Tooltip**: `Edit form`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 680. {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${form.name}"? This action cannot be undone.`)) {
                        onFormDelete?.(form);
                      }
                    }}
                  >
                    🗑️

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormList.jsx`

**Tooltip**: `Delete form`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 681. 🔄 Clear Filters

**Category**: delete

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormFilteringSection.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 682. !saving && onHide?.()}
            disabled={saving}
            aria-label="Close modal"
          >
            ×

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormEditorModal.jsx`

**Opens Modal**: `Close modal`

**Accessibility**: `aria-label: Close modal`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 683. !saving && onCancel?.()}
              disabled={saving}
            >
              Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormEditorModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 684. {
                e.stopPropagation();
                onView?.(form);
              }}
            >
              👁️ View

**Category**: view

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormCard.jsx`

**Tooltip**: `View form details`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 685. {
                  e.stopPropagation();
                  onEdit?.(form);
                }}
              >
                ✏️ Edit

**Category**: edit

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormCard.jsx`

**Tooltip**: `Edit form`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 686. {
                  e.stopPropagation();
                  if (window.confirm(`Delete "${form.name}"? This action cannot be undone.`)) {
                    onDelete?.(form);
                  }
                }}
              >
                🗑️ Delete

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormCard.jsx`

**Tooltip**: `Delete form`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 687. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 688. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 689. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 690. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 691. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 692. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 693. Close

**Category**: cancel

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 694. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 695. Cancel

**Category**: cancel

**File**: `client/src/pages/01200-finance/components/modals/01200-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 696. removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕

**Category**: navigation

**File**: `client/src/pages/01200-finance/components/modals/01200-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 697. Cancel

**Category**: cancel

**File**: `client/src/pages/01200-finance/components/modals/01200-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 698. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 699. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 700. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 701. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 702. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 703. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 704. Close

**Category**: cancel

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 705. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 706. Cancel

**Category**: cancel

**File**: `client/src/pages/01100-ethics/components/modals/01100-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 707. removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕

**Category**: navigation

**File**: `client/src/pages/01100-ethics/components/modals/01100-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 708. Cancel

**Category**: cancel

**File**: `client/src/pages/01100-ethics/components/modals/01100-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 709. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 710. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 711. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 712. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 713. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 714. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 715. Close

**Category**: cancel

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 716. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 717. Cancel

**Category**: cancel

**File**: `client/src/pages/01000-environmental/components/modals/01000-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 718. removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕

**Category**: navigation

**File**: `client/src/pages/01000-environmental/components/modals/01000-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 719. Cancel

**Category**: cancel

**File**: `client/src/pages/01000-environmental/components/modals/01000-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 720. Close

**Category**: cancel

**File**: `client/src/pages/00900-document-control/components/modals/00900-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00900-document-control

---

### 721. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00900-document-control/components/modals/00900-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00900-document-control

---

### 722. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00900-document-control/components/modals/00900-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00900-document-control

---

### 723. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00900-document-control/components/modals/00900-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00900-document-control

---

### 724. Cancel

**Category**: cancel

**File**: `client/src/pages/00900-document-control/components/modals/00900-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00900-document-control

---

### 725. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00895-director-project/components/modals/00895-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00895-director-project

---

### 726. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00895-director-project/components/modals/00895-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00895-director-project

---

### 727. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00895-director-project/components/modals/00895-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00895-director-project

---

### 728. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00895-director-project/components/modals/00895-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00895-director-project

---

### 729. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/00895-director-project/components/modals/00895-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00895-director-project

---

### 730. Close

**Category**: cancel

**File**: `client/src/pages/00895-director-project/components/modals/00895-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00895-director-project

---

### 731. Close

**Category**: cancel

**File**: `client/src/pages/00890-director-projects/components/modals/00890-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00890-director-projects

---

### 732. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00890-director-projects/components/modals/00890-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00890-director-projects

---

### 733. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00890-director-projects/components/modals/00890-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00890-director-projects

---

### 734. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00890-director-projects/components/modals/00890-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00890-director-projects

---

### 735. Cancel

**Category**: cancel

**File**: `client/src/pages/00890-director-projects/components/modals/00890-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00890-director-projects

---

### 736. Close

**Category**: cancel

**File**: `client/src/pages/00889-director-finance/components/modals/00889-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00889-director-finance

---

### 737. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00889-director-finance/components/modals/00889-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00889-director-finance

---

### 738. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00889-director-finance/components/modals/00889-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00889-director-finance

---

### 739. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00889-director-finance/components/modals/00889-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00889-director-finance

---

### 740. Cancel

**Category**: cancel

**File**: `client/src/pages/00889-director-finance/components/modals/00889-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00889-director-finance

---

### 741. Close

**Category**: cancel

**File**: `client/src/pages/00888-director-procurement/components/modals/00888-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00888-director-procurement

---

### 742. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00888-director-procurement/components/modals/00888-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00888-director-procurement

---

### 743. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00888-director-procurement/components/modals/00888-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00888-director-procurement

---

### 744. Close

**Category**: cancel

**File**: `client/src/pages/00886-director-logistics/components/modals/00886-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00886-director-logistics

---

### 745. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00886-director-logistics/components/modals/00886-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00886-director-logistics

---

### 746. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00886-director-logistics/components/modals/00886-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00886-director-logistics

---

### 747. Close

**Category**: cancel

**File**: `client/src/pages/00885-director-hse/components/modals/00885-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00885-director-hse

---

### 748. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00885-director-hse/components/modals/00885-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00885-director-hse

---

### 749. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00885-director-hse/components/modals/00885-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00885-director-hse

---

### 750. Close

**Category**: cancel

**File**: `client/src/pages/00884-director-engineering/components/modals/00884-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00884-director-engineering

---

### 751. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00884-director-engineering/components/modals/00884-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00884-director-engineering

---

### 752. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00884-director-engineering/components/modals/00884-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00884-director-engineering

---

### 753. Close

**Category**: cancel

**File**: `client/src/pages/00883-director-contracts/components/modals/00883-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00883-director-contracts

---

### 754. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00883-director-contracts/components/modals/00883-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00883-director-contracts

---

### 755. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00883-director-contracts/components/modals/00883-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00883-director-contracts

---

### 756. Close

**Category**: cancel

**File**: `client/src/pages/00882-director-construction/components/modals/00882-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00882-director-construction

---

### 757. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00882-director-construction/components/modals/00882-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00882-director-construction

---

### 758. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00882-director-construction/components/modals/00882-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00882-director-construction

---

### 759. Close

**Category**: cancel

**File**: `client/src/pages/00880-board-of-directors/components/modals/00880-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00880-board-of-directors

---

### 760. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00880-board-of-directors/components/modals/00880-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00880-board-of-directors

---

### 761. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00880-board-of-directors/components/modals/00880-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00880-board-of-directors

---

### 762. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00880-board-of-directors/components/modals/00880-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00880-board-of-directors

---

### 763. Cancel

**Category**: cancel

**File**: `client/src/pages/00880-board-of-directors/components/modals/00880-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00880-board-of-directors

---

### 764. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00877-sundry/components/modals/00877-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 765. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00877-sundry/components/modals/00877-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 766. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00877-sundry/components/modals/00877-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 767. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00877-sundry/components/modals/00877-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 768. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/00877-sundry/components/modals/00877-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 769. Close

**Category**: cancel

**File**: `client/src/pages/00877-sundry/components/modals/00877-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 770. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00877-sundry/components/modals/00877-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 771. Cancel

**Category**: cancel

**File**: `client/src/pages/00877-sundry/components/modals/00877-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 772. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00876-directors/components/modals/00876-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00876-directors

---

### 773. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00876-directors/components/modals/00876-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00876-directors

---

### 774. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00876-directors/components/modals/00876-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00876-directors

---

### 775. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00876-directors/components/modals/00876-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00876-directors

---

### 776. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/00876-directors/components/modals/00876-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00876-directors

---

### 777. Close

**Category**: cancel

**File**: `client/src/pages/00876-directors/components/modals/00876-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00876-directors

---

### 778. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 779. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 780. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 781. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 782. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 783. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 784. Close

**Category**: cancel

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 785. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 786. {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 787. {/* TODO: Implement preview expansion */}}
              >
                📖 More Details

**Category**: view

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 788. Cancel

**Category**: cancel

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 789. {
              console.log("=== BUTTON CLICK DEBUG ===");
              console.log("URL:", url, "exists:", !!url);
              console.log("URL Analysis:", !!urlAnalysis);
              console.log("Company:", company, "exists:", !!company);
              console.log("Project:", project, "exists:", !!project);
              console.log("Button disabled:", !url || !urlAnalysis || !company || !project);
              console.log("=== END BUTTON CLICK DEBUG ===");
            }}
          >
            Process URL

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 790. {isSyncing ? "Syncing..." : "Refresh Data"}

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 791. setShowDebug(!showDebug)}
            style={{
              background: "none",
              border: "1px solid #6c757d",
              color: "#6c757d",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showDebug ? "▼" : "▶"} Debug: Data Sources

**Category**: navigation

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 792. Cancel

**Category**: cancel

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 793. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 794. Cancel

**Category**: cancel

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 795. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00872-developer/components/modals/00872-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00872-developer

---

### 796. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00872-developer/components/modals/00872-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00872-developer

---

### 797. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00872-developer/components/modals/00872-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00872-developer

---

### 798. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00872-developer/components/modals/00872-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00872-developer

---

### 799. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/00872-developer/components/modals/00872-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00872-developer

---

### 800. Close

**Category**: cancel

**File**: `client/src/pages/00872-developer/components/modals/00872-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00872-developer

---

### 801. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 802. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 803. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 804. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 805. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 806. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 807. Close

**Category**: cancel

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 808. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 809. {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 810. {/* TODO: Implement preview expansion */}}
              >
                📖 More Details

**Category**: view

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 811. Cancel

**Category**: cancel

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 812. {
              console.log("=== BUTTON CLICK DEBUG ===");
              console.log("URL:", url, "exists:", !!url);
              console.log("URL Analysis:", !!urlAnalysis);
              console.log("Company:", company, "exists:", !!company);
              console.log("Project:", project, "exists:", !!project);
              console.log("Button disabled:", !url || !urlAnalysis || !company || !project);
              console.log("=== END BUTTON CLICK DEBUG ===");
            }}
          >
            Process URL

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 813. {isSyncing ? "Syncing..." : "Refresh Data"}

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 814. setShowDebug(!showDebug)}
            style={{
              background: "none",
              border: "1px solid #6c757d",
              color: "#6c757d",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showDebug ? "▼" : "▶"} Debug: Data Sources

**Category**: navigation

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 815. Cancel

**Category**: cancel

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 816. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 817. Cancel

**Category**: cancel

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 818. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 819. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 820. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 821. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 822. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 823. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 824. Close

**Category**: cancel

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 825. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 826. {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 827. {/* TODO: Implement preview expansion */}}
              >
                📖 More Details

**Category**: view

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 828. Cancel

**Category**: cancel

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 829. {
              console.log("=== BUTTON CLICK DEBUG ===");
              console.log("URL:", url, "exists:", !!url);
              console.log("URL Analysis:", !!urlAnalysis);
              console.log("Company:", company, "exists:", !!company);
              console.log("Project:", project, "exists:", !!project);
              console.log("Button disabled:", !url || !urlAnalysis || !company || !project);
              console.log("=== END BUTTON CLICK DEBUG ===");
            }}
          >
            Process URL

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 830. {isSyncing ? "Syncing..." : "Refresh Data"}

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 831. setShowDebug(!showDebug)}
            style={{
              background: "none",
              border: "1px solid #6c757d",
              color: "#6c757d",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showDebug ? "▼" : "▶"} Debug: Data Sources

**Category**: navigation

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 832. Cancel

**Category**: cancel

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 833. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 834. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 835. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 836. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 837. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 838. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 839. Close

**Category**: cancel

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 840. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 841. {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 842. {/* TODO: Implement preview expansion */}}
              >
                📖 More Details

**Category**: view

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 843. Cancel

**Category**: cancel

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 844. {
              console.log("=== BUTTON CLICK DEBUG ===");
              console.log("URL:", url, "exists:", !!url);
              console.log("URL Analysis:", !!urlAnalysis);
              console.log("Company:", company, "exists:", !!company);
              console.log("Project:", project, "exists:", !!project);
              console.log("Button disabled:", !url || !urlAnalysis || !company || !project);
              console.log("=== END BUTTON CLICK DEBUG ===");
            }}
          >
            Process URL

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 845. {isSyncing ? "Syncing..." : "Refresh Data"}

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 846. setShowDebug(!showDebug)}
            style={{
              background: "none",
              border: "1px solid #6c757d",
              color: "#6c757d",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showDebug ? "▼" : "▶"} Debug: Data Sources

**Category**: navigation

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 847. Cancel

**Category**: cancel

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 848. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00855-geotechnical-engineering/components/modals/00855-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00855-geotechnical-engineering

---

### 849. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00855-geotechnical-engineering/components/modals/00855-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00855-geotechnical-engineering

---

### 850. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00855-geotechnical-engineering/components/modals/00855-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00855-geotechnical-engineering

---

### 851. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00855-geotechnical-engineering/components/modals/00855-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00855-geotechnical-engineering

---

### 852. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/00855-geotechnical-engineering/components/modals/00855-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00855-geotechnical-engineering

---

### 853. Close

**Category**: cancel

**File**: `client/src/pages/00855-geotechnical-engineering/components/modals/00855-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00855-geotechnical-engineering

---

### 854. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 855. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 856. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 857. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 858. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 859. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 860. Close

**Category**: cancel

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 861. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 862. {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 863. {/* TODO: Implement preview expansion */}}
              >
                📖 More Details

**Category**: view

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 864. Cancel

**Category**: cancel

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 865. {
              console.log("=== BUTTON CLICK DEBUG ===");
              console.log("URL:", url, "exists:", !!url);
              console.log("URL Analysis:", !!urlAnalysis);
              console.log("Company:", company, "exists:", !!company);
              console.log("Project:", project, "exists:", !!project);
              console.log("Button disabled:", !url || !urlAnalysis || !company || !project);
              console.log("=== END BUTTON CLICK DEBUG ===");
            }}
          >
            Process URL

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 866. {isSyncing ? "Syncing..." : "Refresh Data"}

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 867. setShowDebug(!showDebug)}
            style={{
              background: "none",
              border: "1px solid #6c757d",
              color: "#6c757d",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showDebug ? "▼" : "▶"} Debug: Data Sources

**Category**: navigation

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 868. Cancel

**Category**: cancel

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 869. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 870. Cancel

**Category**: cancel

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 871. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 872. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 873. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 874. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 875. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 876. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 877. Close

**Category**: cancel

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 878. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 879. {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 880. {/* TODO: Implement preview expansion */}}
              >
                📖 More Details

**Category**: view

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 881. Cancel

**Category**: cancel

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 882. {
              console.log("=== BUTTON CLICK DEBUG ===");
              console.log("URL:", url, "exists:", !!url);
              console.log("URL Analysis:", !!urlAnalysis);
              console.log("Company:", company, "exists:", !!company);
              console.log("Project:", project, "exists:", !!project);
              console.log("Button disabled:", !url || !urlAnalysis || !company || !project);
              console.log("=== END BUTTON CLICK DEBUG ===");
            }}
          >
            Process URL

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 883. {isSyncing ? "Syncing..." : "Refresh Data"}

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 884. setShowDebug(!showDebug)}
            style={{
              background: "none",
              border: "1px solid #6c757d",
              color: "#6c757d",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showDebug ? "▼" : "▶"} Debug: Data Sources

**Category**: navigation

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 885. Cancel

**Category**: cancel

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 886. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 887. Cancel

**Category**: cancel

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 888. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00825-architectural/components/modals/00825-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 889. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00825-architectural/components/modals/00825-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 890. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00825-architectural/components/modals/00825-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 891. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00825-architectural/components/modals/00825-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 892. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/00825-architectural/components/modals/00825-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 893. Close

**Category**: cancel

**File**: `client/src/pages/00825-architectural/components/modals/00825-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 894. {cloudFiles.every((f) => f.selected) ? "Deselect All" : "Select All"}

**Category**: other

**File**: `client/src/pages/00825-architectural/components/modals/00825-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 895. removeTag(tag)} className="00825-tag-chip-remove" aria-label={`Remove tag ${tag}`} title="Remove tag">×

**Category**: delete

**File**: `client/src/pages/00825-architectural/components/modals/00825-UpsertCloudModal.jsx`

**Tooltip**: `Remove tag`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 896. addTag(tagInput)} disabled={!tagInput.trim()} className="00825-btn 00825-btn-primary 00825-tag-add-btn 00825-btn-small">+ Add Tag

**Category**: other

**File**: `client/src/pages/00825-architectural/components/modals/00825-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 897. Cancel

**Category**: cancel

**File**: `client/src/pages/00825-architectural/components/modals/00825-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 898. {loading ? "⏳ Processing..." : "🔗 Cloud Upsert"}

**Category**: other

**File**: `client/src/pages/00825-architectural/components/modals/00825-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 899. {filteredVectorData.every(v => v.selected) ? "Deselect All" : "Select All"}

**Category**: other

**File**: `client/src/pages/00800-design/components/modals/00800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00800-design

---

### 900. handleDeactivate(vector.id)}
                        style={{ ...styles.actionButton, ...styles.deactivateButton }}
                        disabled={loading}
                      >
                        Deactivate

**Category**: actions

**File**: `client/src/pages/00800-design/components/modals/00800-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00800-design

---

### 901. handleActivate(vector.id)}
                        style={{ ...styles.actionButton, ...styles.activateButton }}
                        disabled={loading}
                      >
                        Activate

**Category**: actions

**File**: `client/src/pages/00800-design/components/modals/00800-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00800-design

---

### 902. handleDelete(vector.id)}
                      style={{ ...styles.actionButton, ...styles.deleteButton }}
                      disabled={loading}
                    >
                      Delete

**Category**: actions

**File**: `client/src/pages/00800-design/components/modals/00800-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00800-design

---

### 903. Close

**Category**: cancel

**File**: `client/src/pages/00800-design/components/modals/00800-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00800-design

---

### 904. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00800-design/components/modals/00800-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00800-design

---

### 905. Cancel

**Category**: cancel

**File**: `client/src/pages/00800-design/components/modals/00800-UpsertCloudModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00800-design

---

### 906. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00435-contracts-post-award/components/modals/00435-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 907. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00435-contracts-post-award/components/modals/00435-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 908. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00435-contracts-post-award/components/modals/00435-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 909. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00435-contracts-post-award/components/modals/00435-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 910. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/00435-contracts-post-award/components/modals/00435-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 911. Close

**Category**: cancel

**File**: `client/src/pages/00435-contracts-post-award/components/modals/00435-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 912. {isLoading ? 'Processing...' : 'Reject'}

**Category**: other

**File**: `client/src/pages/00435-contracts-post-award/components/agents/ProgressiveDisclosureHITLModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 913. {isLoading ? 'Processing...' : 'Escalate'}

**Category**: other

**File**: `client/src/pages/00435-contracts-post-award/components/agents/ProgressiveDisclosureHITLModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 914. {isLoading ? 'Processing...' : 'Approve'}

**Category**: other

**File**: `client/src/pages/00435-contracts-post-award/components/agents/ProgressiveDisclosureHITLModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 915. e.key === 'Enter' && !isLoading && handleApprove()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  aria-describedby="approve-description"
                >
                  {isLoading ? 'Processing...' : 'Approve'}

**Category**: other

**File**: `client/src/pages/00435-contracts-post-award/components/agents/AccessibleProgressiveDisclosureHITLModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 916. e.key === 'Enter' && !isLoading && handleReject()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  aria-describedby="reject-description"
                >
                  {isLoading ? 'Processing...' : 'Reject'}

**Category**: other

**File**: `client/src/pages/00435-contracts-post-award/components/agents/AccessibleProgressiveDisclosureHITLModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 917. e.key === 'Enter' && !isLoading && handleEscalate()}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                    aria-describedby="escalate-description"
                  >
                    {isLoading ? 'Processing...' : 'Escalate'}

**Category**: other

**File**: `client/src/pages/00435-contracts-post-award/components/agents/AccessibleProgressiveDisclosureHITLModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 918. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00425-contracts-pre-award/components/modals/00425-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00425-contracts-pre-award

---

### 919. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00425-contracts-pre-award/components/modals/00425-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00425-contracts-pre-award

---

### 920. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00425-contracts-pre-award/components/modals/00425-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00425-contracts-pre-award

---

### 921. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00425-contracts-pre-award/components/modals/00425-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00425-contracts-pre-award

---

### 922. setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel

**Category**: navigation

**File**: `client/src/pages/00425-contracts-pre-award/components/modals/00425-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00425-contracts-pre-award

---

### 923. Close

**Category**: cancel

**File**: `client/src/pages/00425-contracts-pre-award/components/modals/00425-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00425-contracts-pre-award

---

### 924. handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄

**Category**: navigation

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Tooltip**: `Reindex document`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 925. handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️

**Category**: navigation

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Tooltip**: `Delete document`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 926. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 927. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 928. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 929. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: navigation

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 930. Close

**Category**: cancel

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 931. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: edit

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 932. Cancel

**Category**: cancel

**File**: `client/src/pages/00400-contracts/components/modals/00400-UpsertUrlModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 933. {isSyncing ? "Syncing..." : "Refresh Data"}

**Category**: other

**File**: `client/src/pages/00400-contracts/components/modals/00400-UpsertFileModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 934. setShowDebug(!showDebug)}
            style={{
              background: "none",
              border: "1px solid #6c757d",
              color: "#6c757d",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showDebug ? "▼" : "▶"} Debug: Data Sources

**Category**: navigation

**File**: `client/src/pages/00400-contracts/components/modals/00400-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 935. Cancel

**Category**: cancel

**File**: `client/src/pages/00400-contracts/components/modals/00400-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 936. Close

**Category**: cancel

**File**: `client/src/pages/00300-construction/components/modals/00300-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00300-construction

---

### 937. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00300-construction/components/modals/00300-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00300-construction

---

### 938. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00300-construction/components/modals/00300-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00300-construction

---

### 939. {refreshing ? '🔄' : '🔄'} Refresh

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/SecurityComplianceDashboard.jsx`

**Disabled**: Yes

**Pattern**: Button with text and onClick

**Page Type**: 00165-ui-settings

---

### 940. 📊 Generate Report

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/SecurityComplianceDashboard.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 00165-ui-settings

---

### 941. {refreshing ? '🔄' : '🔄'} Refresh

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/SecurityComplianceDashboard.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 942. 📊 Generate Report

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/SecurityComplianceDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 943. handleDocumentSelect(doc)}
                      >
                        View Details

**Category**: view

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 00165-ui-settings

---

### 944. handleDocumentSelect(doc)}
                        >
                          View Details

**Category**: view

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 00165-ui-settings

---

### 945. Grant User Access

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Disabled**: Yes

**Pattern**: Button with text and onClick

**Page Type**: 00165-ui-settings

---

### 946. handleRevokeUserAccess(docId, userId)
                                  }
                                >
                                  Revoke

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Pattern**: Button with text and onClick

**Page Type**: 00165-ui-settings

---

### 947. handleDocumentSelect(doc)}
                      >
                        View Details

**Category**: view

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 948. handleDocumentSelect(doc)}
                        >
                          View Details

**Category**: view

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 949. Grant User Access

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 950. handleRevokeUserAccess(docId, userId)
                                  }
                                >
                                  Revoke

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 951. Create Template

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/CrossDisciplineSharingTab.jsx`

**Disabled**: Yes

**Pattern**: Button with text and onClick

**Page Type**: 00165-ui-settings

---

### 952. Apply Template

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/CrossDisciplineSharingTab.jsx`

**Disabled**: Yes

**Pattern**: Button with text and onClick

**Page Type**: 00165-ui-settings

---

### 953. Create Template

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/CrossDisciplineSharingTab.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 954. Apply Template

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/CrossDisciplineSharingTab.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 955. {filteredVectorData.every(v => v.selected) ? "Deselect All" : "Select All"}

**Category**: other

**File**: `client/src/pages/00102-administration/components/modals/00102-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00102-administration

---

### 956. handleDeactivate(vector.id)}
                        style={{ ...styles.actionButton, ...styles.deactivateButton }}
                        disabled={loading}
                      >
                        Deactivate

**Category**: actions

**File**: `client/src/pages/00102-administration/components/modals/00102-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00102-administration

---

### 957. handleActivate(vector.id)}
                        style={{ ...styles.actionButton, ...styles.activateButton }}
                        disabled={loading}
                      >
                        Activate

**Category**: actions

**File**: `client/src/pages/00102-administration/components/modals/00102-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00102-administration

---

### 958. handleDelete(vector.id)}
                      style={{ ...styles.actionButton, ...styles.deleteButton }}
                      disabled={loading}
                    >
                      Delete

**Category**: actions

**File**: `client/src/pages/00102-administration/components/modals/00102-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00102-administration

---

### 959. Close

**Category**: cancel

**File**: `client/src/pages/00102-administration/components/modals/00102-VectorDataManagerModal.jsx`

**Disabled**: Yes

**Pattern**: Regular button element

**Page Type**: 00102-administration

---

