# 🔘 Buttons Breakdown - Construct AI

**Detailed analysis of all buttons in the system.**

## 📋 Overview

This document contains detailed information about each button found in the Construct AI system.

## 📊 Statistics

- **Total Buttons**: 970
- **Categories**: 8
- **Generated**: 2026-03-11T06:08:10.844Z

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

**Pattern**: Regular button element

**Page Type**: 192-Construction

---

### 8. Close

**Category**: other

**File**: `client/src/pages/03000-landscaping/components/modals/03000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 03000-landscaping

---

### 9. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/03000-landscaping/components/modals/03000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 03000-landscaping

---

### 10. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/03000-landscaping/components/modals/03000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 03000-landscaping

---

### 11. Close

**Category**: other

**File**: `client/src/pages/02500-security/components/modals/02500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02500-security

---

### 12. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/02500-security/components/modals/02500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02500-security

---

### 13. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/02500-security/components/modals/02500-VectorDataManagerModal.jsx`

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

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 17. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/02400-safety/components/modals/02400-VectorDataManagerModal.jsx`

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

**Category**: actions

**File**: `client/src/pages/02400-safety/components/modals/02400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 19. Close

**Category**: other

**File**: `client/src/pages/02400-safety/components/modals/02400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 20. onViewDetails(result)}
                  >
                    👁️ Review

**Category**: view

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 21. onViewDetails(result, true)}
                  >
                    📋 View

**Category**: view

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 22. onAcceptEvaluation(result)}
                      >
                        ✓ Accept

**Category**: other

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 23. onRejectEvaluation(result)}
                      >
                        ✗ Reject

**Category**: other

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 24. setCurrentPage(1)}
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

**Category**: other

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 25. setCurrentPage(prev => Math.max(prev - 1, 1))}
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

**Category**: other

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 26. setCurrentPage(pageNum)}
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

**Category**: other

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 27. setCurrentPage(prev => Math.min(prev + 1, totalPages))
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

**Category**: other

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 28. setCurrentPage(totalPages)}
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

**Category**: other

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResultsTable.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 29. onEvaluationDetails && onEvaluationDetails(result)}
                        title="View detailed evaluation"
                      >
                        👁️ Review

**Category**: view

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResults.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 30. {
                          navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                        }}
                        title="Export evaluation data"
                      >
                        📋 Export

**Category**: navigation

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/EvaluationResults.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 31. openDocumentUploadModal(activeTab)}
        >
          Upload Documents

**Category**: other

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/ContractorVettingTabContent.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 32. analyzeSection(activeTab)}
      >
        {getAnalyzeButtonText(activeTab)}

**Category**: other

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/ContractorVettingTabContent.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 33. setShowEvaluationDetailsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                ×

**Category**: view

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/ContractorVettingModals.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 34. setShowFullDetailsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                ×

**Category**: view

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/ContractorVettingModals.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 35. window.location.reload()}
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

**Category**: other

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/02400-contractor-vetting-page.lazy.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 36. this.setState({ hasError: false, error: null })}
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

**Category**: other

**File**: `client/src/pages/02400-safety/02400-contractor-vetting/components/02400-contractor-vetting-page.lazy.jsx`

**Pattern**: Regular button element

**Page Type**: 02400-safety

---

### 37. Close

**Category**: other

**File**: `client/src/pages/02250-quality-control/components/modals/02250-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02250-quality-control

---

### 38. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/02250-quality-control/components/modals/02250-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02250-quality-control

---

### 39. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/02250-quality-control/components/modals/02250-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02250-quality-control

---

### 40. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/02250-quality-control/components/modals/02250-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02250-quality-control

---

### 41. Cancel

**Category**: cancel

**File**: `client/src/pages/02250-quality-control/components/modals/02250-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02250-quality-control

---

### 42. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/02200-quality-assurance/components/modals/02200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-quality-assurance

---

### 43. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/02200-quality-assurance/components/modals/02200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-quality-assurance

---

### 44. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/02200-quality-assurance/components/modals/02200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-quality-assurance

---

### 45. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/02200-quality-assurance/components/modals/02200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-quality-assurance

---

### 46. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/02200-quality-assurance/components/modals/02200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-quality-assurance

---

### 47. Close

**Category**: other

**File**: `client/src/pages/02200-quality-assurance/components/modals/02200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-quality-assurance

---

### 48. workflowStateManager?.pauseWorkflow?.()}
          disabled={currentState?.status !== 'active'}
        >
          ⏸️ Pause

**Category**: other

**File**: `client/src/pages/02200-agent-monitoring/components/WorkflowVisualizerTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 49. workflowStateManager?.resumeWorkflow?.()}
          disabled={currentState?.status !== 'paused'}
        >
          ▶️ Resume

**Category**: other

**File**: `client/src/pages/02200-agent-monitoring/components/WorkflowVisualizerTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 50. workflowStateManager?.resetWorkflow?.()}
        >
          🔄 Reset

**Category**: other

**File**: `client/src/pages/02200-agent-monitoring/components/WorkflowVisualizerTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 51. {
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

**Category**: other

**File**: `client/src/pages/02200-agent-monitoring/components/PerformanceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 52. {
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

**Category**: other

**File**: `client/src/pages/02200-agent-monitoring/components/PerformanceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 53. {
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

**Category**: other

**File**: `client/src/pages/02200-agent-monitoring/components/PerformanceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 54. {
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

**Category**: other

**File**: `client/src/pages/02200-agent-monitoring/components/HITLTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 55. handleAssignToMe(task.id)}
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

**Category**: other

**File**: `client/src/pages/02200-agent-monitoring/components/HITLTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 56. setSelectedTask(task)}
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

**Category**: view

**File**: `client/src/pages/02200-agent-monitoring/components/HITLTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 57. setSelectedTask(null)}
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

**Category**: cancel

**File**: `client/src/pages/02200-agent-monitoring/components/HITLTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 58. handleResolve(selectedTask.id, 'rejected')}
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

**Category**: other

**File**: `client/src/pages/02200-agent-monitoring/components/HITLTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 59. handleResolve(selectedTask.id, 'approved')}
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

**Category**: other

**File**: `client/src/pages/02200-agent-monitoring/components/HITLTab.jsx`

**Pattern**: Regular button element

**Page Type**: 02200-agent-monitoring

---

### 60. Close

**Category**: other

**File**: `client/src/pages/02100-public-relations/components/modals/02100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02100-public-relations

---

### 61. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/02100-public-relations/components/modals/02100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02100-public-relations

---

### 62. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/02100-public-relations/components/modals/02100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02100-public-relations

---

### 63. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/02076-quality-assurance-sub/components/modals/02076-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance-sub

---

### 64. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/02076-quality-assurance-sub/components/modals/02076-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance-sub

---

### 65. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/02076-quality-assurance-sub/components/modals/02076-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance-sub

---

### 66. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/02076-quality-assurance-sub/components/modals/02076-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance-sub

---

### 67. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/02076-quality-assurance-sub/components/modals/02076-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance-sub

---

### 68. Close

**Category**: other

**File**: `client/src/pages/02076-quality-assurance-sub/components/modals/02076-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance-sub

---

### 69. Close

**Category**: other

**File**: `client/src/pages/02076-quality-assurance/components/modals/02076-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance

---

### 70. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/02076-quality-assurance/components/modals/02076-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance

---

### 71. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/02076-quality-assurance/components/modals/02076-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance

---

### 72. Cancel

**Category**: cancel

**File**: `client/src/pages/02076-quality-assurance/components/modals/02076-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance

---

### 73. Cancel

**Category**: cancel

**File**: `client/src/pages/02076-quality-assurance/components/modals/02076-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02076-quality-assurance

---

### 74. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 75. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 76. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 77. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 78. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 79. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 80. Close

**Category**: other

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 81. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/02075-inspection/components/modals/02075-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 82. Cancel

**Category**: cancel

**File**: `client/src/pages/02075-inspection/components/modals/02075-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 83. removeFile(fileData.id)}
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

**Category**: delete

**File**: `client/src/pages/02075-inspection/components/modals/02075-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 84. Cancel

**Category**: cancel

**File**: `client/src/pages/02075-inspection/components/modals/02075-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 85. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/02075-inspection/components/modals/02075-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 86. Cancel

**Category**: cancel

**File**: `client/src/pages/02075-inspection/components/modals/02075-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02075-inspection

---

### 87. Retry

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/SchemaDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 88. Refresh Data

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/SchemaDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 89. Close

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/SchemaDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 90. Close

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/SchemaDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 91. e.target.style.backgroundColor = '#b91c1c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
            >
              Retry

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 92. setCurrentView('alerts')}
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

**Category**: view

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 93. setCurrentView('alerts')}
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

**Category**: view

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 94. setCurrentView('history')}
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

**Category**: view

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 95. setCurrentView('tables')}
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

**Category**: view

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 96. 🔄 Refresh Dashboard

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 97. Clear Selection

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 98. 📋 Copy

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 99. 📄 JSON

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 100. 📊 CSV

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 101. setFilterLevel(filter.key)}
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

### 102. Select All

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 103. Select None

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 104. Clear Selection

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 105. 📋 Copy

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 106. 📄 JSON

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 107. 📊 CSV

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 108. setCurrentView('overview')}
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

**Category**: view

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 109. setTableFilter(filter.key)}
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

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 110. Select All ({totalDisplayed})

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 111. Select None

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 112. setCurrentView('tables')}
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

**Category**: view

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 113. openPolicyModal(policy.policyname)}
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

**Category**: view

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 114. setIsSearchMode(!isSearchMode)}
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

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 115. setAdvancedSearchOpen(!advancedSearchOpen)}
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

**Category**: view

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 116. {
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

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 117. ✕

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 118. Close

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 119. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 120. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 121. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 122. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 123. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 124. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 125. Close

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 126. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/modals/02050-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 127. Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/modals/02050-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 128. removeFile(fileData.id)}
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

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/modals/02050-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 129. Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/modals/02050-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 130. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/modals/02050-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 131. Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/modals/02050-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 132. {
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

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 133. {
              e.target.style.backgroundColor = '#fff8f2';
              e.target.style.borderColor = '#ffb733';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#ffa500';
            }}
          >
            Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 134. {
              e.target.style.backgroundColor = '#ffb733';
              e.target.style.borderColor = '#ffb733';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#ffa500';
              e.target.style.borderColor = '#ffa500';
            }}
          >
            Create Error Tracking

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 135. ×

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 136. setEditMode(false)} style={{ background: '#f8f9fa', color: '#000000', border: '2px solid #ddd' }}>Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 137. Save Changes

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 138. ×

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 139. setEditMode(true)} className="orange-button">Edit

**Category**: edit

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 140. ×

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/error-tracking/ErrorTracking.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 141. Generate Suggestions

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Button with text

**Page Type**: 02050-information-technology

---

### 142. Attach Files

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Button with text

**Page Type**: 02050-information-technology

---

### 143. removeFile(index)}
                            >
                              Remove

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Button with text

**Page Type**: 02050-information-technology

---

### 144. Add

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Button with text

**Page Type**: 02050-information-technology

---

### 145. removeUrl(index)}
                            >
                              Remove

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Button with text

**Page Type**: 02050-information-technology

---

### 146. Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Button with text

**Page Type**: 02050-information-technology

---

### 147. Apply Enhancements

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Button with text

**Page Type**: 02050-information-technology

---

### 148. Generate Suggestions

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 149. Attach Files

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 150. removeFile(index)}
                            >
                              Remove

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 151. Add

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 152. removeUrl(index)}
                            >
                              Remove

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 153. Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 154. Apply Enhancements

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 155. setHovered(true)}
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

### 156. setHovered(true)}
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

### 157. onChange(current - 1, pageSize)} disabled={current === 1}>
              Previous

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/VoiceCallManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 158. onChange(pageNum, pageSize)}>{pageNum}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/VoiceCallManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 159. onChange(current + 1, pageSize)} disabled={current === pages}>
              Next

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/VoiceCallManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 160. setModalVisible(false)} className="btn-close" aria-label="Close">

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/VoiceCallManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 161. setShowForm(!showForm)}
          className="btn btn-primary"
          disabled={loading}
        >
          {showForm ? 'Cancel' : '+ Add New API Configuration'}

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/DevSettings/SimpleExternalApiSettings.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 162. Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/DevSettings/SimpleExternalApiSettings.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 163. handleEdit(config)}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Edit

**Category**: edit

**File**: `client/src/pages/02050-information-technology/components/DevSettings/SimpleExternalApiSettings.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 164. handleDelete(config.id)}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    Delete

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/DevSettings/SimpleExternalApiSettings.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 165. + Create New Prompt

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 166. handleSort('name')}
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

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 167. handleSort('type')}
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

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 168. handleSort('category')}
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

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 169. handleSort('tags')}
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

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 170. handleSort('date_added')}
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

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 171. handleSort('is_active')}
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

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 172. handleEdit(prompt)}
                              title="Edit"
                            >
                              ✏️

**Category**: edit

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 173. handleEnhance(prompt)}
                              title="Enhance"
                            >
                              ✨

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 174. handleDelete(prompt.id)}
                              title="Delete"
                            >
                              🗑️

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 175. setShowModal(false)}
              >
                ×

**Category**: view

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 176. setShowModal(false)}>
                Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 177. 🧹 Clear Filters

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 178. setShowForm(!showForm)}
          className="btn btn-primary"
          disabled={loading}
        >
          {showForm ? 'Cancel' : '+ Add New API Configuration'}

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 179. Cancel

**Category**: cancel

**File**: `client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 180. handleTestApi(config)}
                    className="btn btn-outline"
                    disabled={testingApi === config.id || loading}
                  >
                    {testingApi === config.id ? 'Testing...' : 'Test Connection'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 181. handleEdit(config)}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Edit

**Category**: edit

**File**: `client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 182. handleDelete(config.id)}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    Delete

**Category**: delete

**File**: `client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 183. setAuditModalVisible(false)}>
            Close

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/DocumentationManager.jsx`

**Pattern**: Button with text

**Page Type**: 02050-information-technology

---

### 184. setAuditModalVisible(false)}>
            Close

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/DocumentationManager.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 185. setActiveTab(key)}
          >
            {label}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 186. runTest(testKey, category)}
                          disabled={simulationStatus.isRunning}
                        >
                          {isRunning ? 'Running...' : 'Run Test'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 187. runTest(key, 'logic')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Run Test'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 188. runTest(key, 'runtime')}
                        disabled={runningTests.has(key)}
                      >
                        {runningTests.has(key) ? 'Running...' : 'Run Test'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 189. runTest(key, 'workflow')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Run Simulation'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 190. runTest(key, 'runtime')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Start Runtime Test'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 191. runTest(key, 'scale')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Run Test'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-information-technology

---

### 192. runTest(testKey, category)}
                          disabled={simulationStatus.isRunning}
                        >
                          {isRunning ? 'Running...' : 'Run Test'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Pattern**: Class-based button

**Page Type**: 02050-information-technology

---

### 193. runTest(key, 'runtime')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Start Runtime Test'}

**Category**: other

**File**: `client/src/pages/02050-information-technology/components/DevSettings/02050-simulator-ui.jsx`

**Pattern**: Class-based button

**Page Type**: 02050-information-technology

---

### 194. handleStateChange("templates")}
              >
                Templates

**Category**: other

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 195. handleStateChange("create")}
              >
                Create New

**Category**: other

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 196. handleStateChange("projects")}
              >
                Project Integration

**Category**: other

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 197. handleStateChange("collaboration")}
              >
                Cross-Discipline

**Category**: other

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 198. handleStateChange("analytics")}
              >
                Analytics

**Category**: other

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 199. Clear Filters

**Category**: other

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 200. openModal("EngineeringTemplateCreateModal", {
                    triggerPage: PAGE_ID,
                    onSuccess: fetchTemplates
                  })}
                >
                  New Engineering Template

**Category**: other

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 201. openModal("EngineeringTemplateImportModal", {
                    triggerPage: PAGE_ID,
                    onSuccess: fetchTemplates
                  })}
                >
                  Import from CAD/Drawings

**Category**: other

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 202. openModal("ProjectTemplateMappingModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Map Templates to Projects

**Category**: other

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 203. openModal("ProjectTemplateSyncModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Sync Project Templates

**Category**: other

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 204. openModal("CrossDisciplineReviewModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Cross-Discipline Review

**Category**: view

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 205. openModal("TemplateSharingModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Share Templates

**Category**: other

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 206. openModal("EngineeringTemplateStatsModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Template Usage Analytics

**Category**: other

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 207. openModal("ComplianceReportModal", {
                    discipline: 'engineering',
                    triggerPage: PAGE_ID
                  })}
                >
                  Engineering Compliance Report

**Category**: other

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 208. setShowViewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×

**Category**: view

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 209. setShowViewModal(false)}
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

**Category**: view

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 210. {
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

**Category**: view

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 211. setShowDeleteModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×

**Category**: delete

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 212. setShowDeleteModal(false)}
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

**Category**: cancel

**File**: `client/src/pages/02050-engineering-templates/EngineeringTemplatesPage.jsx`

**Pattern**: Regular button element

**Page Type**: 02050-engineering-templates

---

### 213. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 214. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 215. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 216. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 217. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 218. Close

**Category**: other

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 219. Cancel

**Category**: cancel

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 220. {isImporting ? "Importing..." : "Import from URL"}

**Category**: other

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 221. removeFile(file.id)}
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

**Category**: delete

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 222. Cancel

**Category**: cancel

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 223. {isUploading ? "Uploading..." : "Upload Files"}

**Category**: other

**File**: `client/src/pages/02025-quantity-surveying/components/modals/02025-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02025-quantity-surveying

---

### 224. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 225. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 226. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 227. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 228. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 229. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 230. Close

**Category**: other

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 231. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/02000-project-controls/components/modals/02000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 232. Cancel

**Category**: cancel

**File**: `client/src/pages/02000-project-controls/components/modals/02000-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 233. removeFile(fileData.id)}
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

**Category**: delete

**File**: `client/src/pages/02000-project-controls/components/modals/02000-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 234. Cancel

**Category**: cancel

**File**: `client/src/pages/02000-project-controls/components/modals/02000-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 235. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/02000-project-controls/components/modals/02000-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 236. Cancel

**Category**: cancel

**File**: `client/src/pages/02000-project-controls/components/modals/02000-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 02000-project-controls

---

### 237. navigate('/01900-procurement')}>
            Back to Procurement

**Category**: navigation

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 238. navigate('/01900-procurement')}>
            Back to Procurement

**Category**: navigation

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 239. navigate('/01900-procurement')}
          >
            ← Back to Procurement

**Category**: navigation

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 240. window.open(order.main_document_url, '_blank')}
            >
              📄 View Final Document

**Category**: view

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 241. window.open(order.approval_cover_url, '_blank')}
            >
              📋 View Cover Sheet

**Category**: view

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 242. setActiveTab('overview')}
        >
          Overview

**Category**: view

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 243. setActiveTab('contributions')}
        >
          Contributions

**Category**: other

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 244. setActiveTab('documents')}
        >
          Documents

**Category**: other

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 245. setActiveTab('approvals')}
        >
          Approvals

**Category**: other

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 246. window.open(order.main_document_url, '_blank')}
                        >
                          📄 View PDF

**Category**: view

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 247. window.open(order.approval_cover_url, '_blank')}
                        >
                          📋 View PDF

**Category**: view

**File**: `client/src/pages/01900-procurement/ProcurementOrderDetailsPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 248. onRemoveSection(section.id)}
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

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/VariationCanvas.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 249. ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/TemplateTypeManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 250. {loading ? 'Creating...' : 'Create'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/TemplateTypeManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 251. Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/TemplateTypeManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 252. {loading ? 'Updating...' : 'Update'}

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/TemplateTypeManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 253. Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/TemplateTypeManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 254. startEdit(type)}
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

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/TemplateTypeManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 255. handleDelete(type.id || type.code, type.name)}
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

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/TemplateTypeManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 256. Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/SectionLibrary.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 257. setSearchTerm('')}
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

**Category**: other

**File**: `client/src/pages/01900-procurement/components/SectionLibrary.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 258. toggle(app.id)}
                style={{
                  padding: '5px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  border: '1px solid #dee2e6',
                  backgroundColor: statuses[app.id] === 'completed' ? '#d4edda' : '#fff',
                  color: statuses[app.id] === 'completed' ? '#155724' : '#495057',
                  fontWeight: 500
                }}
              >
                {statuses[app.id] === 'completed' ? '✅ Done' : 'Mark Done'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ProcurementWorkflowOrchestrator.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 259. Skip (Not Guinea)

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ProcurementWorkflowOrchestrator.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 260. onOrderSelect?.(order)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          View Details

**Category**: view

**File**: `client/src/pages/01900-procurement/components/ProcurementAccordion.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 261. Retry

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 262. Preview

**Category**: view

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 263. Reset to Defaults

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 264. {saving ? 'Saving...' : 'Save Standards'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 265. setActiveTab('fonts')}
        >
          Fonts

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 266. setActiveTab('spacing')}
        >
          Spacing

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 267. setActiveTab('page')}
        >
          Page Layout

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 268. setActiveTab('numbering')}
        >
          Numbering

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 269. setActiveTab('colors')}
        >
          Colors

**Category**: other

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 270. setPreviewHTML('')}>×

**Category**: view

**File**: `client/src/pages/01900-procurement/components/FormattingStandardsManager.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 271. {
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

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/DocumentAssemblyDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 272. {assemblyInProgress ? "Assembling..." : "Start Document Assembly"}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/DocumentAssemblyDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 273. Test Workflow

**Category**: other

**File**: `client/src/pages/01900-procurement/components/CreateOrderModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 274. Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/CreateOrderModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 275. {loading ? "Creating..." : "Create Order"}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/CreateOrderModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 276. setSelectedContribution(null)}
              >
                ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ContributionTracker.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 277. setSelectedContribution(null)}
              >
                Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/ContributionTracker.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 278. {saving ? 'Saving...' : 'Save Contribution'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ContributionTracker.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 279. Refresh Status

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ContributionTracker.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 280. {generating ? 'Generating...' : 'Generate Final Documents'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ContributionTracker.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 281. ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 282. Export Changes

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 283. Close

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 284. Undo

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 285. Export Changes

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 286. Close

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 287. Undo

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 288. ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ChangeSummaryPanel.jsx`

**Pattern**: Accessibility button

**Page Type**: 01900-procurement

---

### 289. Save

**Category**: other

**File**: `client/src/pages/01900-procurement/components/ActionPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 290. {
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

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/ActionPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 291. setShowVariationManager(false)}
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

**Category**: view

**File**: `client/src/pages/01900-procurement/components/ActionPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 292. {
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

**Category**: view

**File**: `client/src/pages/01900-procurement/components/ActionPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 293. {
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

**Category**: view

**File**: `client/src/pages/01900-procurement/components/ActionPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 294. {
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

**Category**: actions

**File**: `client/src/pages/01900-procurement/components/ActionPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 295. ← Return to Chat

**Category**: other

**File**: `client/src/pages/01900-procurement/components/shared/OrderPreview.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 296. ✏️ Edit Data

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/shared/OrderPreview.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 297. {isProcessing ? '⏳ Creating Order...' : '📤 Create Order'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/shared/OrderPreview.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 298. ✏️ Edit Data

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/shared/OrderPreview.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 299. {isProcessing ? '⏳ Creating Order...' : '📤 Create Order'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/shared/OrderPreview.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 300. ← Go Back

**Category**: other

**File**: `client/src/pages/01900-procurement/components/shared/OrderHandoff.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 301. ← Go Back

**Category**: other

**File**: `client/src/pages/01900-procurement/components/shared/OrderHandoff.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 302. {isProcessing ? '⏳ Creating Order...' : '✅ Confirm & Create Order'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/shared/OrderHandoff.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 303. ← Go Back

**Category**: other

**File**: `client/src/pages/01900-procurement/components/shared/OrderHandoff.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 304. {isProcessing ? '⏳ Creating Order...' : '✅ Confirm & Create Order'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/shared/OrderHandoff.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 305. None of the above apply - Skip

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 306. ← Back

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 307. Next →

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 308. None of the above apply - Skip

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 309. ← Back

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 310. Next →

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 311. None of the above apply - Skip

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Pattern**: Accessibility button

**Page Type**: 01900-procurement

---

### 312. ← Back

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Pattern**: Accessibility button

**Page Type**: 01900-procurement

---

### 313. Next →

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/RequirementsSelectionCard.jsx`

**Pattern**: Accessibility button

**Page Type**: 01900-procurement

---

### 314. {
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

### 315. {
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

### 316. ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 317. setActiveTab('search')}
          >
            Search Orders

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 318. setActiveTab('recent')}
          >
            Recent Orders

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 319. Clear

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 320. ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 321. {loading ? 'Loading...' : 'Load Order for Editing'}

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 322. Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 323. Clear

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 324. {loading ? 'Loading...' : 'Load Order for Editing'}

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 325. Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 326. ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Accessibility button

**Page Type**: 01900-procurement

---

### 327. ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/OrderSearchModal.jsx`

**Pattern**: Accessibility button

**Page Type**: 01900-procurement

---

### 328. onHide()}
          >
            Close

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/OrderDetailsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 329. {
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

### 330. setSearchTerm('')}
              aria-label="Clear search"
            >
              ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/ItemSelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 331. {
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

### 332. setSearchTerm('')}
          >
            Clear search

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/ItemSelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 333. {
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

### 334. setSearchTerm('')}
          >
            Clear search

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/ItemSelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 335. setSearchTerm('')}
              aria-label="Clear search"
            >
              ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/GroupSelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 336. {
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

### 337. setSearchTerm('')}
          >
            Clear search

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/GroupSelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 338. {
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

### 339. setSearchTerm('')}
          >
            Clear search

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/GroupSelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 340. onHide()}
          >
            Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/EditOrderModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 341. {isLoading ? 'Updating...' : 'Update Order'}

**Category**: edit

**File**: `client/src/pages/01900-procurement/components/modals/EditOrderModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 342. onHide()}
          >
            Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/DeleteConfirmationModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 343. {
              e.target.style.backgroundColor = '#b91c1c';
              e.target.style.borderColor = '#b91c1c';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.borderColor = '#dc2626';
            }}
          >
            Delete Order

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/DeleteConfirmationModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 344. onHide()}
              >
                Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/CreateOrderModal.refactored.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 345. {showSequencePreview ? 'Hide Preview' : 'Show Preview'}

**Category**: view

**File**: `client/src/pages/01900-procurement/components/modals/CreateOrderModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 346. onHide()}
              >
                Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/CreateOrderModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 347. setSearchTerm('')}
              aria-label="Clear search"
            >
              ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/CountrySelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 348. {
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

### 349. setSearchTerm('')}
          >
            Clear search

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/CountrySelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 350. {
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

### 351. setSearchTerm('')}
          >
            Clear search

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/CountrySelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 352. setSearchTerm('')}
              aria-label="Clear search"
            >
              ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/CategorySelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 353. {
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

### 354. setSearchTerm('')}
          >
            Clear search

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/CategorySelectionCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 355. {
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

### 356. setSearchTerm('')}
          >
            Clear search

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/CategorySelectionCard.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 357. e.target.style.background = '#e9ecef'}
          onMouseOut={(e) => e.target.style.background = 'none'}
        >
          ✕

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/CategoryIntelligencePanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 358. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/01900-procurement/components/modals/01900-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 359. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/01900-procurement/components/modals/01900-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 360. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/01900-procurement/components/modals/01900-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 361. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/01900-procurement/components/modals/01900-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 362. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/01900-procurement/components/modals/01900-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 363. Close

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/01900-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 364. {cloudFiles.every((f) => f.selected) ? "Deselect All" : "Select All"}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/01900-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 365. removeTag(tag)}
                        className="01900-tag-chip-remove"
                        aria-label={`Remove tag ${tag}`}
                        title="Remove tag"
                      >
                        ×

**Category**: delete

**File**: `client/src/pages/01900-procurement/components/modals/01900-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 366. addTag(tagInput)}
                  disabled={!tagInput.trim()}
                  className="01900-btn 01900-btn-primary 01900-tag-add-btn 01900-btn-small"
                >
                  + Add Tag

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/01900-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 367. Cancel

**Category**: cancel

**File**: `client/src/pages/01900-procurement/components/modals/01900-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 368. {loading ? "⏳ Processing..." : "🔗 Cloud Upsert"}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/01900-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 369. {showSequencePreview ? 'Hide Preview' : 'Show Preview'}

**Category**: view

**File**: `client/src/pages/01900-procurement/components/modals/phases/TemplateSelectionPhase.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 370. handleCardComplete(activeCardId)}
            disabled={disabled || isProcessing}
          >
            {isProcessing ? 'Saving...' : 'Complete Card'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/components/RequirementsCardSystem.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 371. setActiveCardId(null)}
            disabled={disabled || isProcessing}
          >
            Skip for Now

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/components/RequirementsCardSystem.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 372. handleCardComplete(activeCardId)}
            disabled={disabled || isProcessing}
          >
            {isProcessing ? 'Saving...' : 'Complete Card'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/components/RequirementsCardSystem.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 373. setActiveCardId(null)}
            disabled={disabled || isProcessing}
          >
            Skip for Now

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modals/components/RequirementsCardSystem.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 374. onSupplierAssign && onSupplierAssign(null)}
              title="Clear supplier"
            >
              ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 375. setShowSupplierPanel(false)}
            >
              ×

**Category**: view

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 376. 📊 Extract

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 377. ✅ Validate

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 378. {isProcessing ? '⏳' : '📤'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 379. onSupplierAssign && onSupplierAssign(null)}
              title="Clear supplier"
            >
              ×

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 380. 📊 Extract

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 381. ✅ Validate

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 382. {isProcessing ? '⏳' : '📤'}

**Category**: other

**File**: `client/src/pages/01900-procurement/components/modal/ChatInterface.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 383. window.dispatchEvent(new CustomEvent('switch-to-chat-tab'))}
          >
            ← Return to Chat

**Category**: other

**File**: `client/src/pages/01900-procurement/components/documents/SOWViewer.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 384. window.print()}>
            🖨️ Print

**Category**: other

**File**: `client/src/pages/01900-procurement/components/documents/SOWViewer.jsx`

**Pattern**: Regular button element

**Page Type**: 01900-procurement

---

### 385. window.dispatchEvent(new CustomEvent('switch-to-chat-tab'))}
          >
            ← Return to Chat

**Category**: other

**File**: `client/src/pages/01900-procurement/components/documents/SOWViewer.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 386. window.print()}>
            🖨️ Print

**Category**: other

**File**: `client/src/pages/01900-procurement/components/documents/SOWViewer.jsx`

**Pattern**: Class-based button

**Page Type**: 01900-procurement

---

### 387. Try Again

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/ModalErrorBoundary.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 388. window.location.reload()}
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

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/ModalErrorBoundary.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 389. {saving ? "Saving..." : "💾 Save Weights"}

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/AgentWeightsConfig.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 390. 🔄 Reset to Defaults

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/AgentWeightsConfig.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 391. 🔄 Refresh

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/AgentWeightsConfig.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 392. {
              e.target.style.backgroundColor = contractsTheme.secondary;
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = "white";
            }}
          >
            Previous

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/modals/ContractorVettingModalFooter.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 393. Close

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/modals/ContractorVettingModalFooter.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 394. Next

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/modals/ContractorVettingModalFooter.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 395. {swarmRunning ? "Processing..." : "Complete Vetting"}

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/modals/ContractorVettingModalFooter.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 396. Download Certificate

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/modals/ContractorVettingModalFooter.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 397. Re-evaluate

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/modals/ContractorVettingModalFooter.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 398. Complete

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/modals/ContractorVettingModalFooter.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 399. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/01850-other-parties/components/modals/01850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 400. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/01850-other-parties/components/modals/01850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 401. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/01850-other-parties/components/modals/01850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 402. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/01850-other-parties/components/modals/01850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 403. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/01850-other-parties/components/modals/01850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 404. Close

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/modals/01850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 405. 🔄 Start New Vetting

**Category**: other

**File**: `client/src/pages/01850-other-parties/components/modals/steps/ResultsStep.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 406. {
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

**Category**: delete

**File**: `client/src/pages/01850-other-parties/components/modals/steps/DocumentUploadStep.jsx`

**Pattern**: Regular button element

**Page Type**: 01850-other-parties

---

### 407. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 408. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 409. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 410. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 411. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 412. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 413. Close

**Category**: other

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 414. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/01800-operations/components/modals/01800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 415. Cancel

**Category**: cancel

**File**: `client/src/pages/01800-operations/components/modals/01800-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 416. removeFile(fileData.id)}
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

**Category**: delete

**File**: `client/src/pages/01800-operations/components/modals/01800-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 417. Cancel

**Category**: cancel

**File**: `client/src/pages/01800-operations/components/modals/01800-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01800-operations

---

### 418. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/01750-legal/components/modals/01750-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01750-legal

---

### 419. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/01750-legal/components/modals/01750-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01750-legal

---

### 420. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/01750-legal/components/modals/01750-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01750-legal

---

### 421. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/01750-legal/components/modals/01750-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01750-legal

---

### 422. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/01750-legal/components/modals/01750-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01750-legal

---

### 423. Close

**Category**: other

**File**: `client/src/pages/01750-legal/components/modals/01750-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01750-legal

---

### 424. {
              e.stopPropagation();
              onRefresh();
            }}
          >
            🔄 Refresh

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsOrderSelector.jsx`

**Pattern**: Button with text

**Page Type**: 01700-logistics

---

### 425. {
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

### 426. ➕ Create

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 427. ×

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 428. handleTabChange(tab.id)}
              >
                {tab.id === 'dashboard' && 'Dashboard'}
                {tab.id === 'cdc' && 'CDC'}
                {tab.id === 'documents' && 'Documents'}
                {tab.id === 'tracking' && 'Tracking'}
                {tab.id === 'compliance' && 'Compliance'}
                {tab.id === 'chat' && 'Chat'}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 429. Change Order

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 430. {
                      // Open tracking interface
                      openModal('LogisticsTrackingModal', {
                        modalTitle: 'Shipment Tracking',
                        triggerPage: '01700-logistics'
                      });
                    }}
                  >
                    Open Tracking Dashboard

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 431. Close

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 432. ×

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 433. Cancel

**Category**: cancel

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 434. Save Changes

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 435. ➕ Create

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 436. ×

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 437. Change Order

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 438. {
                      // Open tracking interface
                      openModal('LogisticsTrackingModal', {
                        modalTitle: 'Shipment Tracking',
                        triggerPage: '01700-logistics'
                      });
                    }}
                  >
                    Open Tracking Dashboard

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 439. Close

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 440. ×

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 441. Cancel

**Category**: cancel

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 442. Save Changes

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 443. ×

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 444. {isProcessing ? '⏳' : '📤'}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 445. setCurrentMessage('Validate current data')}
              disabled={isProcessing}
            >
              🔍 Validate Data

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 446. setCurrentMessage('Make supplier required')}
              disabled={isProcessing}
            >
              ✅ Make Supplier Required

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 447. setCurrentMessage('Help with document generation')}
              disabled={isProcessing}
            >
              📄 Document Help

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 448. ×

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 449. {isProcessing ? '⏳' : '📤'}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 450. setCurrentMessage('Validate current data')}
              disabled={isProcessing}
            >
              🔍 Validate Data

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 451. setCurrentMessage('Make supplier required')}
              disabled={isProcessing}
            >
              ✅ Make Supplier Required

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 452. setCurrentMessage('Help with document generation')}
              disabled={isProcessing}
            >
              📄 Document Help

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/LogisticsChatModal.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 453. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 454. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 455. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 456. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 457. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 458. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 459. Close

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 460. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/01700-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 461. Cancel

**Category**: cancel

**File**: `client/src/pages/01700-logistics/components/modals/01700-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 462. removeFile(fileData.id)}
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

**Category**: delete

**File**: `client/src/pages/01700-logistics/components/modals/01700-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 463. Cancel

**Category**: cancel

**File**: `client/src/pages/01700-logistics/components/modals/01700-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 464. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/01700-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 465. Cancel

**Category**: cancel

**File**: `client/src/pages/01700-logistics/components/modals/01700-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 466. handleCardAction(card.id, 'view-details')}
          >
            View details

**Category**: actions

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 467. handleCardAction(card.id, 'manage-documents')}
          >
            Go to Documents

**Category**: actions

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 468. handleCardAction(card.id, 'view-compliance')}
          >
            Open Compliance

**Category**: actions

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 469. handleCardAction(card.id, 'create-cdc')}
          >
            Open CDC

**Category**: actions

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 470. {
              if (tab.id !== 'dashboard') {
                await openLogisticsModal(tab.id, { procurementOrderId });
              }
            }}
          >
            {tab.name}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 471. Retry

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 472. openLogisticsModal('documents', { procurementOrderId })}>Documents

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 473. openLogisticsModal('tracking', { procurementOrderId })}>Tracking

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 474. openLogisticsModal('compliance', { procurementOrderId })}>Compliance

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 475. openLogisticsModal('documents', { procurementOrderId })}>Documents

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 476. openLogisticsModal('tracking', { procurementOrderId })}>Tracking

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 477. openLogisticsModal('compliance', { procurementOrderId })}>Compliance

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/DashboardTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 478. Retry

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 479. handleCategoryChange('all')}
          >
            All Categories ({complianceData.totalRequirements})

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 480. handleCategoryChange(key)}
            >
              {category.name} ({category.requirements.length})

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 481. handleDocumentUpload(requirement.id)}
                        >
                          📎 Upload Document

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 482. handleStatusUpdate(requirement.id, 'completed')}
                        >
                          ✅ Mark Complete

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 483. handleStatusUpdate(requirement.id, 'pending')}
                        >
                          🔄 Reopen

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 484. 🔄 Refresh Status

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 485. openLogisticsModal('dashboard', { procurementOrderId })}
        >
          📊 Back to Dashboard

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 486. handleCategoryChange('all')}
          >
            All Categories ({complianceData.totalRequirements})

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 487. handleCategoryChange(key)}
            >
              {category.name} ({category.requirements.length})

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 488. handleDocumentUpload(requirement.id)}
                        >
                          📎 Upload Document

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 489. handleStatusUpdate(requirement.id, 'completed')}
                        >
                          ✅ Mark Complete

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 490. handleStatusUpdate(requirement.id, 'pending')}
                        >
                          🔄 Reopen

**Category**: edit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 491. 🔄 Refresh Status

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 492. openLogisticsModal('dashboard', { procurementOrderId })}
        >
          📊 Back to Dashboard

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/ComplianceTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 493. Retry

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/CDCTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 494. handleAttachDocument(doc.id)}
                  >
                    Attach

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/CDCTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 495. {isSubmitting ? 'Submitting...' : 'Submit CDC Declaration'}

**Category**: submit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/CDCTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 496. openLogisticsModal('dashboard', { procurementOrderId })}
        >
          Back to Dashboard

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/CDCTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 497. handleAttachDocument(doc.id)}
                  >
                    Attach

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/CDCTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 498. {isSubmitting ? 'Submitting...' : 'Submit CDC Declaration'}

**Category**: submit

**File**: `client/src/pages/01700-logistics/components/modals/tabs/CDCTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 499. openLogisticsModal('dashboard', { procurementOrderId })}
        >
          Back to Dashboard

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/tabs/CDCTab.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 500. {isValidating ? 'Validating...' : 'Validate Data'}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/components/LogisticsDocumentGenerator.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 501. 0}
          >
            {isProcessing ? 'Generating...' : `Generate ${selectedDocumentType ? availableDocuments.find(d => d.value === selectedDocumentType)?.label : 'Document'}`}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/components/LogisticsDocumentGenerator.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 502. 0}
          >
            {isProcessing ? 'Generating...' : `Generate All Required (${availableDocuments.filter(d => d.required).length})`}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/components/LogisticsDocumentGenerator.jsx`

**Pattern**: Regular button element

**Page Type**: 01700-logistics

---

### 503. {isValidating ? 'Validating...' : 'Validate Data'}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/components/LogisticsDocumentGenerator.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 504. 0}
          >
            {isProcessing ? 'Generating...' : `Generate ${selectedDocumentType ? availableDocuments.find(d => d.value === selectedDocumentType)?.label : 'Document'}`}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/components/LogisticsDocumentGenerator.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 505. 0}
          >
            {isProcessing ? 'Generating...' : `Generate All Required (${availableDocuments.filter(d => d.required).length})`}

**Category**: other

**File**: `client/src/pages/01700-logistics/components/modals/components/LogisticsDocumentGenerator.jsx`

**Pattern**: Class-based button

**Page Type**: 01700-logistics

---

### 506. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 507. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 508. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 509. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 510. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 511. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 512. Close

**Category**: other

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 513. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/01500-human-resources/components/modals/01500-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 514. Cancel

**Category**: cancel

**File**: `client/src/pages/01500-human-resources/components/modals/01500-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 515. removeFile(fileData.id)}
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

**Category**: delete

**File**: `client/src/pages/01500-human-resources/components/modals/01500-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 516. Cancel

**Category**: cancel

**File**: `client/src/pages/01500-human-resources/components/modals/01500-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01500-human-resources

---

### 517. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/01400-health/components/modals/01400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01400-health

---

### 518. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/01400-health/components/modals/01400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01400-health

---

### 519. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/01400-health/components/modals/01400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01400-health

---

### 520. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/01400-health/components/modals/01400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01400-health

---

### 521. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/01400-health/components/modals/01400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01400-health

---

### 522. Close

**Category**: other

**File**: `client/src/pages/01400-health/components/modals/01400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01400-health

---

### 523. ×

**Category**: other

**File**: `client/src/pages/01300-hitl-review/components/hitl-review-modal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 524. setError(null)}
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

**Category**: other

**File**: `client/src/pages/01300-hitl-review/components/hitl-review-modal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 525. ×

**Category**: other

**File**: `client/src/pages/01300-hitl-review/components/hitl-review-modal.jsx`

**Pattern**: Accessibility button

**Page Type**: 01300-hitl-review

---

### 526. setShowWorkflowDiagram(false)}
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

**Category**: view

**File**: `client/src/pages/01300-hitl-review/components/WorkflowDiagram.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 527. {isRestoreMode ? '✕ Cancel' : '↩️ Restore'}

**Category**: cancel

**File**: `client/src/pages/01300-hitl-review/components/RestorePointsPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 528. {
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

**Category**: other

**File**: `client/src/pages/01300-hitl-review/components/RestorePointsPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 529. {
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

**Category**: delete

**File**: `client/src/pages/01300-hitl-review/components/RestorePointsPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 530. setShowConfirmClear(true)}
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

**Category**: view

**File**: `client/src/pages/01300-hitl-review/components/RestorePointsPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 531. selectedCheckpointId && onRollback(selectedCheckpointId)}
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

**Category**: other

**File**: `client/src/pages/01300-hitl-review/components/RestorePointsPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 532. setShowConfirmClear(false)}
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

**Category**: cancel

**File**: `client/src/pages/01300-hitl-review/components/RestorePointsPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 533. {
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

**Category**: delete

**File**: `client/src/pages/01300-hitl-review/components/RestorePointsPanel.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 534. ×

**Category**: other

**File**: `client/src/pages/01300-hitl-review/components/AgentWorkflowReview.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 535. Show Diagram

**Category**: view

**File**: `client/src/pages/01300-hitl-review/components/AgentWorkflowReview.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-hitl-review

---

### 536. onClick(workflow)}
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

**Category**: view

**File**: `client/src/pages/01300-governance/components/TasksWorkflowsContent.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 537. handleWorkflowClick(workflow)}
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

**Category**: view

**File**: `client/src/pages/01300-governance/components/TaskCards.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 538. removeToast(toast.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: 'inherit'
                  }}
                >
                  ×

**Category**: delete

**File**: `client/src/pages/01300-governance/components/NEW-FormCreationPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 539. setShowTemplateModal(true)}
            >
              🤖 AI Generate

**Category**: view

**File**: `client/src/pages/01300-governance/components/NEW-FormCreationPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 540. handleCreateForm()}
            >
              ➕ New Form

**Category**: other

**File**: `client/src/pages/01300-governance/components/NEW-FormCreationPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 541. setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                style={{
                  ...styles.button,
                  padding: '8px',
                  fontSize: '12px',
                  backgroundColor: viewMode === 'grid' ? '#007bff' : '#6c757d'
                }}
              >
                {viewMode === 'grid' ? '⊞' : '⊟'}

**Category**: view

**File**: `client/src/pages/01300-governance/components/NEW-FormCreationPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 542. refreshData()}
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

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 543. setShowTemplateModal(false)}
                style={styles.button}
              >
                Close

**Category**: view

**File**: `client/src/pages/01300-governance/components/NEW-FormCreationPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 544. window.location.reload()}
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

**Category**: other

**File**: `client/src/pages/01300-governance/components/NEW-FormCreationPage.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 545. {
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

### 546. {
                              e.stopPropagation();
                              deleteTemplate(preset.id);
                            }}
                          >
                            Delete

**Category**: delete

**File**: `client/src/pages/01300-governance/components/FormStylingPromptModal.jsx`

**Pattern**: Button with text

**Page Type**: 01300-governance

---

### 547. Remove

**Category**: delete

**File**: `client/src/pages/01300-governance/components/FormStylingPromptModal.jsx`

**Pattern**: Button with text

**Page Type**: 01300-governance

---

### 548. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/FormStylingPromptModal.jsx`

**Pattern**: Button with text

**Page Type**: 01300-governance

---

### 549. {
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

### 550. Remove

**Category**: delete

**File**: `client/src/pages/01300-governance/components/FormStylingPromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 551. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/FormStylingPromptModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 552. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/DocumentUploadTemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 553. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/DocumentUploadTemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 554. {isProcessing ? "Creating Template..." : "Create Template"}

**Category**: other

**File**: `client/src/pages/01300-governance/components/DocumentUploadTemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 555. setShowNewRequest(!showNewRequest)}
        >
          {showNewRequest ? 'Cancel Request' : '+ New Sharing Request'}

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Button with text

**Page Type**: 01300-governance

---

### 556. Submit Governance Request

**Category**: submit

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Button with text

**Page Type**: 01300-governance

---

### 557. handleApprovalAction(request.id, 'approve', '')}
                            >
                              ✅ Approve

**Category**: actions

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Button with text

**Page Type**: 01300-governance

---

### 558. {
                                const comments = prompt('Denial reason:');
                                if (comments) handleApprovalAction(request.id, 'deny', comments);
                              }}
                            >
                              ❌ Deny

**Category**: actions

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Button with text

**Page Type**: 01300-governance

---

### 559. setShowNewRequest(!showNewRequest)}
        >
          {showNewRequest ? 'Cancel Request' : '+ New Sharing Request'}

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 560. Submit Governance Request

**Category**: submit

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 561. handleApprovalAction(request.id, 'approve', '')}
                            >
                              ✅ Approve

**Category**: actions

**File**: `client/src/pages/01300-governance/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 562. {
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

### 563. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/TemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 564. {
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

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 565. setIsOpen(!isOpen)}
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

**Category**: actions

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormsTableRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 566. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormEditModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 567. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormEditModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 568. Save Form

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormEditModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 569. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormDetailModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 570. Close

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormDetailModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 571. setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Close"
            >
              ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationToastContainer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 572. {
                  setSearchTerm("");
                  setFormTypeFilter("all");
                  setStatusFilter("all");
                }}
              >
                🔄 Clear Filters

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationSearchAndFilters.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 573. handleCreateProcurementTemplate(template)}
                >
                  Create Template

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationProcurementTemplatesSection.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 574. setShowProcurementTemplates(false)}
          >
            Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationProcurementTemplatesSection.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 575. setShowTemplateModal(false)}
                >
                  ×

**Category**: view

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationModals.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 576. {
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

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 577. setShowPreviewModal(false)}
              >
                ×

**Category**: view

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationModals.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 578. setShowPreviewModal(false)}
              >
                Close Preview

**Category**: view

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationModals.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 579. {
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

### 580. setError(null)}
                aria-label="Close error"
              >
                ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationMainContent.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 581. setError(null)}
        aria-label="Close"
      >
        ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/FormCreationErrorDisplay.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 582. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/BulkDisciplineCopyModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 583. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/BulkDisciplineCopyModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 584. 🔄 Copy to Discipline Templates

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/BulkDisciplineCopyModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 585. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/BulkApprovalModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 586. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/BulkApprovalModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 587. {
              onBulkApprove();
              onHide();
            }}
          >
            Publish All

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/BulkApprovalModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 588. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 589. setShowEnhanceModal(true)}
                      disabled={!customPrompt.trim()}
                      title="Enhance your prompt with AI suggestions, templates, and resources"
                    >
                      ✨ Enhance

**Category**: view

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 590. setCustomPrompt(example)}
                      >
                        {example.length > 30 ? example.substring(0, 30) + '...' : example}

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 591. {currentStep === 'discipline' ? 'Cancel' : '← Back'}

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 592. 🤖 Generate Template

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 593. downloadHtmlTemplate(generatedTemplate)}
                  >
                    📥 Download HTML

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 594. openHtmlInNewTab(generatedTemplate)}
                  >
                    🌐 Open in Browser

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 595. 💾 Save Template

**Category**: other

**File**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 596. {
              e.target.style.backgroundColor = "#fff8f2";
              e.target.style.borderColor = "#ffb733";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.borderColor = "#ffa500";
            }}
          >
            Clear Filters

**Category**: other

**File**: `client/src/pages/01300-governance/components/templates/components/TemplateFilters.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 597. Close Preview

**Category**: view

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplatePreviewRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 598. window.open('', '_blank').document.write(preview?.html || '')}
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

**Category**: view

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplatePreviewRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 599. navigator.clipboard.writeText(preview?.html || '')}
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

### 600. Close

**Category**: other

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplatePreviewRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 601. {
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

**Category**: delete

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplatePreviewRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 602. setError(null)}
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

**Category**: other

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateManagementMainContent.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 603. {
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

**Category**: view

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateManagementMainContent.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 604. {
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

**Category**: edit

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateManagementMainContent.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 605. {
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

**Category**: delete

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateManagementMainContent.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 606. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateEditorRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 607. Save Template

**Category**: other

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateEditorRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 608. + Add Section

**Category**: other

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateEditorRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 609. setActiveSection(index)}
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

**Category**: other

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateEditorRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 610. deleteSection(activeSection)}
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

**Category**: delete

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateEditorRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 611. addQuestion(activeSection)}
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

**Category**: other

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateEditorRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 612. deleteQuestion(activeSection, qIndex)}
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

**Category**: delete

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateEditorRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 613. Close

**Category**: other

**File**: `client/src/pages/01300-governance/components/template-management/ui-renderers/TemplateComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 614. {
              e.target.style.backgroundColor = "#fff8f2";
              e.target.style.borderColor = "#ffb733";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.borderColor = "#ffa500";
            }}
          >
            Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/modals/TemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 615. {
              e.target.style.backgroundColor = "#fff8f2";
              e.target.style.borderColor = "#ffb733";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.borderColor = "#ffa500";
            }}
          >
            {selectedTemplate ? "Update Template" : "Create Template"}

**Category**: edit

**File**: `client/src/pages/01300-governance/components/modals/TemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 616. {
                e.target.style.backgroundColor = "#fff8f2";
                e.target.style.borderColor = "#ffb733";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "white";
                e.target.style.borderColor = "#ffa500";
              }}
            >
              Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/modals/BulkTemplateCopyModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 617. {
                  e.target.style.backgroundColor = "#fff8f2";
                  e.target.style.borderColor = "#ffb733";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "white";
                  e.target.style.borderColor = "#ffa500";
                }}
              >
                Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/modals/AITemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 618. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 619. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 620. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 621. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 622. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 623. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 624. Close

**Category**: other

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 625. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/01300-governance/components/modals/01300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 626. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/modals/01300-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 627. removeFile(fileData.id)}
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

**Category**: delete

**File**: `client/src/pages/01300-governance/components/modals/01300-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 628. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/modals/01300-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 629. {
                      e.stopPropagation();
                      onFormView?.(form);
                    }}
                  >
                    👁️

**Category**: view

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormList.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 630. {
                      e.stopPropagation();
                      onFormEdit?.(form);
                    }}
                  >
                    ✏️

**Category**: edit

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormList.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 631. {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${form.name}"? This action cannot be undone.`)) {
                        onFormDelete?.(form);
                      }
                    }}
                  >
                    🗑️

**Category**: actions

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormList.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 632. 🔄 Clear Filters

**Category**: other

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormFilteringSection.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 633. !saving && onHide?.()}
            disabled={saving}
            aria-label="Close modal"
          >
            ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormEditorModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 634. !saving && onCancel?.()}
              disabled={saving}
            >
              Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormEditorModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 635. {
                e.stopPropagation();
                onView?.(form);
              }}
            >
              👁️ View

**Category**: view

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 636. {
                  e.stopPropagation();
                  onEdit?.(form);
                }}
              >
                ✏️ Edit

**Category**: edit

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 637. {
                  e.stopPropagation();
                  if (window.confirm(`Delete "${form.name}"? This action cannot be undone.`)) {
                    onDelete?.(form);
                  }
                }}
              >
                🗑️ Delete

**Category**: actions

**File**: `client/src/pages/01300-governance/components/form-management/ui/components/FormCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 638. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/TemplateModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 639. {
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

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 640. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/HoldPointNotificationModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 641. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/HoldPointNotificationModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 642. Generate HTML Template

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/HoldPointNotificationModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 643. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormsTableRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 644. {
              e.target.style.backgroundColor = '#fff8f2';
              e.target.style.borderColor = '#ffb733';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#ffa500';
            }}
          >
            Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormsTableRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 645. {
              e.target.style.backgroundColor = '#fff8f2';
              e.target.style.borderColor = '#ffb733';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#ffa500';
            }}
          >
            👁️ Preview Form

**Category**: view

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormsTableRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 646. {
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

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormsTableRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 647. setIsOpen(!isOpen)}
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

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormsTableRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 648. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormEditModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 649. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormEditModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 650. Save Form

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormEditModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 651. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormDetailModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 652. Close

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormDetailModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 653. setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Close"
            >
              ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormCreationToastContainer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 654. {
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

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormCreationSearchAndFilters.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 655. handleCreateProcurementTemplate(template)}
                >
                  Create Template

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormCreationProcurementTemplatesSection.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 656. setShowProcurementTemplates(false)}
          >
            Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormCreationProcurementTemplatesSection.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 657. setError(null)}
                aria-label="Close error"
              >
                ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormCreationMainContent.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 658. setError(null)}
        aria-label="Close"
      >
        ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FormCreationErrorDisplay.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 659. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 660. applyBulkAction('mark_all_editable')}
              >
                Mark All Editable

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 661. applyBulkAction('mark_all_readonly')}
              >
                Mark All Read-only

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 662. applyBulkAction('enable_ai_suggestions')}
              >
                Enable AI Suggestions

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 663. applyBulkAction('disable_ai_suggestions')}
              >
                Disable AI Suggestions

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 664. applyBulkAction('mark_all_required')}
              >
                Mark All Required

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 665. applyBulkAction('clear_requirements')}
              >
                Clear All Requirements

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 666. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 667. Proceed to Template Creation

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/FieldCharacteristicsModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 668. applyBulkAction('mark_all_editable')}
            >
              Mark All Editable

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 669. applyBulkAction('mark_all_readonly')}
            >
              Mark All Read-only

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 670. applyBulkAction('enable_ai_suggestions')}
            >
              Enable AI Suggestions

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 671. applyBulkAction('disable_ai_suggestions')}
            >
              Disable AI Suggestions

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 672. applyBulkAction('mark_all_required')}
            >
              Mark All Required

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 673. applyBulkAction('clear_requirements')}
            >
              Clear All Requirements

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 674. setActiveTab('original')}
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

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 675. setActiveTab('processed')}
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

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 676. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 677. {
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

**Category**: edit

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/ContentComparisonRenderer.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 678. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/BulkDisciplineCopyModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 679. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/BulkDisciplineCopyModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 680. 🔄 Copy to Discipline Templates

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/BulkDisciplineCopyModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 681. ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/BulkApprovalModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 682. Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/BulkApprovalModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 683. {
              onBulkApprove();
              onHide();
            }}
          >
            Publish All

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/BulkApprovalModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 684. !saving && onHide?.()}
            disabled={saving}
          >
            ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/AdvancedFormConfigurationModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 685. {
                if (configurationStep === 'fields') setConfigurationStep('basic');
                if (configurationStep === 'comparison') setConfigurationStep('fields');
              }}
              disabled={saving}
            >
              ← Back

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/AdvancedFormConfigurationModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 686. {'Next: Configure Fields →'}

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/AdvancedFormConfigurationModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 687. {'Next: Review & Save →'}

**Category**: view

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/AdvancedFormConfigurationModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 688. {saving ? '⏳ Saving...' : '💾 Save Form Configuration'}

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/ui-renderers/AdvancedFormConfigurationModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 689. {
                      e.stopPropagation();
                      onFormView?.(form);
                    }}
                  >
                    👁️

**Category**: view

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormList.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 690. {
                      e.stopPropagation();
                      onFormEdit?.(form);
                    }}
                  >
                    ✏️

**Category**: edit

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormList.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 691. {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${form.name}"? This action cannot be undone.`)) {
                        onFormDelete?.(form);
                      }
                    }}
                  >
                    🗑️

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormList.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 692. 🔄 Clear Filters

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormFilteringSection.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 693. !saving && onHide?.()}
            disabled={saving}
            aria-label="Close modal"
          >
            ×

**Category**: other

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormEditorModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 694. !saving && onCancel?.()}
              disabled={saving}
            >
              Cancel

**Category**: cancel

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormEditorModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 695. {
                e.stopPropagation();
                onView?.(form);
              }}
            >
              👁️ View

**Category**: view

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 696. {
                  e.stopPropagation();
                  onEdit?.(form);
                }}
              >
                ✏️ Edit

**Category**: edit

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

---

### 697. {
                  e.stopPropagation();
                  if (window.confirm(`Delete "${form.name}"? This action cannot be undone.`)) {
                    onDelete?.(form);
                  }
                }}
              >
                🗑️ Delete

**Category**: actions

**File**: `client/src/pages/01300-governance/components/features/form-management/ui/components/FormCard.jsx`

**Pattern**: Regular button element

**Page Type**: 01300-governance

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

**Category**: other

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

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

**Category**: delete

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 700. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 701. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 702. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 703. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 704. Close

**Category**: other

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 705. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/01200-finance/components/modals/01200-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 706. Cancel

**Category**: cancel

**File**: `client/src/pages/01200-finance/components/modals/01200-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

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

**Category**: delete

**File**: `client/src/pages/01200-finance/components/modals/01200-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

---

### 708. Cancel

**Category**: cancel

**File**: `client/src/pages/01200-finance/components/modals/01200-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01200-finance

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

**Category**: other

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

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

**Category**: delete

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 711. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 712. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 713. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 714. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 715. Close

**Category**: other

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 716. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/01100-ethics/components/modals/01100-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 717. Cancel

**Category**: cancel

**File**: `client/src/pages/01100-ethics/components/modals/01100-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

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

**Category**: delete

**File**: `client/src/pages/01100-ethics/components/modals/01100-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 719. Cancel

**Category**: cancel

**File**: `client/src/pages/01100-ethics/components/modals/01100-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01100-ethics

---

### 720. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 721. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 722. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 723. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 724. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 725. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 726. Close

**Category**: other

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 727. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/01000-environmental/components/modals/01000-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 728. Cancel

**Category**: cancel

**File**: `client/src/pages/01000-environmental/components/modals/01000-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 729. removeFile(fileData.id)}
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

**Category**: delete

**File**: `client/src/pages/01000-environmental/components/modals/01000-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 730. Cancel

**Category**: cancel

**File**: `client/src/pages/01000-environmental/components/modals/01000-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 01000-environmental

---

### 731. Close

**Category**: other

**File**: `client/src/pages/00900-document-control/components/modals/00900-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00900-document-control

---

### 732. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00900-document-control/components/modals/00900-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00900-document-control

---

### 733. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00900-document-control/components/modals/00900-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00900-document-control

---

### 734. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00900-document-control/components/modals/00900-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00900-document-control

---

### 735. Cancel

**Category**: cancel

**File**: `client/src/pages/00900-document-control/components/modals/00900-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00900-document-control

---

### 736. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00895-director-project/components/modals/00895-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00895-director-project

---

### 737. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00895-director-project/components/modals/00895-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00895-director-project

---

### 738. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00895-director-project/components/modals/00895-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00895-director-project

---

### 739. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00895-director-project/components/modals/00895-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00895-director-project

---

### 740. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/00895-director-project/components/modals/00895-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00895-director-project

---

### 741. Close

**Category**: other

**File**: `client/src/pages/00895-director-project/components/modals/00895-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00895-director-project

---

### 742. Close

**Category**: other

**File**: `client/src/pages/00890-director-projects/components/modals/00890-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00890-director-projects

---

### 743. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00890-director-projects/components/modals/00890-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00890-director-projects

---

### 744. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00890-director-projects/components/modals/00890-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00890-director-projects

---

### 745. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00890-director-projects/components/modals/00890-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00890-director-projects

---

### 746. Cancel

**Category**: cancel

**File**: `client/src/pages/00890-director-projects/components/modals/00890-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00890-director-projects

---

### 747. Close

**Category**: other

**File**: `client/src/pages/00889-director-finance/components/modals/00889-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00889-director-finance

---

### 748. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00889-director-finance/components/modals/00889-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00889-director-finance

---

### 749. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00889-director-finance/components/modals/00889-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00889-director-finance

---

### 750. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00889-director-finance/components/modals/00889-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00889-director-finance

---

### 751. Cancel

**Category**: cancel

**File**: `client/src/pages/00889-director-finance/components/modals/00889-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00889-director-finance

---

### 752. Close

**Category**: other

**File**: `client/src/pages/00888-director-procurement/components/modals/00888-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00888-director-procurement

---

### 753. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00888-director-procurement/components/modals/00888-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00888-director-procurement

---

### 754. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00888-director-procurement/components/modals/00888-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00888-director-procurement

---

### 755. Close

**Category**: other

**File**: `client/src/pages/00886-director-logistics/components/modals/00886-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00886-director-logistics

---

### 756. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00886-director-logistics/components/modals/00886-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00886-director-logistics

---

### 757. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00886-director-logistics/components/modals/00886-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00886-director-logistics

---

### 758. Close

**Category**: other

**File**: `client/src/pages/00885-director-hse/components/modals/00885-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00885-director-hse

---

### 759. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00885-director-hse/components/modals/00885-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00885-director-hse

---

### 760. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00885-director-hse/components/modals/00885-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00885-director-hse

---

### 761. Close

**Category**: other

**File**: `client/src/pages/00884-director-engineering/components/modals/00884-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00884-director-engineering

---

### 762. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00884-director-engineering/components/modals/00884-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00884-director-engineering

---

### 763. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00884-director-engineering/components/modals/00884-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00884-director-engineering

---

### 764. Close

**Category**: other

**File**: `client/src/pages/00883-director-contracts/components/modals/00883-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00883-director-contracts

---

### 765. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00883-director-contracts/components/modals/00883-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00883-director-contracts

---

### 766. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00883-director-contracts/components/modals/00883-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00883-director-contracts

---

### 767. Close

**Category**: other

**File**: `client/src/pages/00882-director-construction/components/modals/00882-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00882-director-construction

---

### 768. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00882-director-construction/components/modals/00882-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00882-director-construction

---

### 769. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00882-director-construction/components/modals/00882-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00882-director-construction

---

### 770. Close

**Category**: other

**File**: `client/src/pages/00880-board-of-directors/components/modals/00880-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00880-board-of-directors

---

### 771. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00880-board-of-directors/components/modals/00880-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00880-board-of-directors

---

### 772. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00880-board-of-directors/components/modals/00880-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00880-board-of-directors

---

### 773. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00880-board-of-directors/components/modals/00880-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00880-board-of-directors

---

### 774. Cancel

**Category**: cancel

**File**: `client/src/pages/00880-board-of-directors/components/modals/00880-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00880-board-of-directors

---

### 775. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00877-sundry/components/modals/00877-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 776. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00877-sundry/components/modals/00877-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 777. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00877-sundry/components/modals/00877-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 778. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00877-sundry/components/modals/00877-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 779. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/00877-sundry/components/modals/00877-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 780. Close

**Category**: other

**File**: `client/src/pages/00877-sundry/components/modals/00877-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 781. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00877-sundry/components/modals/00877-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 782. Cancel

**Category**: cancel

**File**: `client/src/pages/00877-sundry/components/modals/00877-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00877-sundry

---

### 783. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00876-directors/components/modals/00876-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00876-directors

---

### 784. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00876-directors/components/modals/00876-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00876-directors

---

### 785. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00876-directors/components/modals/00876-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00876-directors

---

### 786. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00876-directors/components/modals/00876-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00876-directors

---

### 787. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/00876-directors/components/modals/00876-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00876-directors

---

### 788. Close

**Category**: other

**File**: `client/src/pages/00876-directors/components/modals/00876-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00876-directors

---

### 789. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 790. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 791. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 792. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 793. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 794. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 795. Close

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 796. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 797. {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 798. {/* TODO: Implement preview expansion */}}
              >
                📖 More Details

**Category**: view

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 799. Cancel

**Category**: cancel

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 800. {
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

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 801. {isSyncing ? "Syncing..." : "Refresh Data"}

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 802. setShowDebug(!showDebug)}
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

**Category**: view

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 803. Cancel

**Category**: cancel

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 804. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 805. Cancel

**Category**: cancel

**File**: `client/src/pages/00875-sales/components/modals/00875-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00875-sales

---

### 806. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00872-developer/components/modals/00872-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00872-developer

---

### 807. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00872-developer/components/modals/00872-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00872-developer

---

### 808. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00872-developer/components/modals/00872-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00872-developer

---

### 809. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00872-developer/components/modals/00872-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00872-developer

---

### 810. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/00872-developer/components/modals/00872-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00872-developer

---

### 811. Close

**Category**: other

**File**: `client/src/pages/00872-developer/components/modals/00872-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00872-developer

---

### 812. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 813. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 814. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 815. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 816. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 817. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 818. Close

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 819. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 820. {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 821. {/* TODO: Implement preview expansion */}}
              >
                📖 More Details

**Category**: view

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 822. Cancel

**Category**: cancel

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 823. {
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

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 824. {isSyncing ? "Syncing..." : "Refresh Data"}

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 825. setShowDebug(!showDebug)}
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

**Category**: view

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 826. Cancel

**Category**: cancel

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 827. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 828. Cancel

**Category**: cancel

**File**: `client/src/pages/00871-process-engineering/components/modals/00871-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00871-process-engineering

---

### 829. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 830. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 831. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 832. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 833. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 834. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 835. Close

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 836. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 837. {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 838. {/* TODO: Implement preview expansion */}}
              >
                📖 More Details

**Category**: view

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 839. Cancel

**Category**: cancel

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 840. {
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

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 841. {isSyncing ? "Syncing..." : "Refresh Data"}

**Category**: other

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 842. setShowDebug(!showDebug)}
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

**Category**: view

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 843. Cancel

**Category**: cancel

**File**: `client/src/pages/00870-mechanical-engineering/components/modals/00870-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00870-mechanical-engineering

---

### 844. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 845. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 846. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 847. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 848. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 849. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 850. Close

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 851. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 852. {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 853. {/* TODO: Implement preview expansion */}}
              >
                📖 More Details

**Category**: view

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 854. Cancel

**Category**: cancel

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 855. {
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

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 856. {isSyncing ? "Syncing..." : "Refresh Data"}

**Category**: other

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 857. setShowDebug(!showDebug)}
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

**Category**: view

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 858. Cancel

**Category**: cancel

**File**: `client/src/pages/00860-electrical-engineering/components/modals/00860-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00860-electrical-engineering

---

### 859. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00855-geotechnical-engineering/components/modals/00855-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00855-geotechnical-engineering

---

### 860. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00855-geotechnical-engineering/components/modals/00855-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00855-geotechnical-engineering

---

### 861. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00855-geotechnical-engineering/components/modals/00855-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00855-geotechnical-engineering

---

### 862. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00855-geotechnical-engineering/components/modals/00855-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00855-geotechnical-engineering

---

### 863. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/00855-geotechnical-engineering/components/modals/00855-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00855-geotechnical-engineering

---

### 864. Close

**Category**: other

**File**: `client/src/pages/00855-geotechnical-engineering/components/modals/00855-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00855-geotechnical-engineering

---

### 865. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 866. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 867. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 868. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 869. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 870. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 871. Close

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 872. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 873. {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 874. {/* TODO: Implement preview expansion */}}
              >
                📖 More Details

**Category**: view

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 875. Cancel

**Category**: cancel

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 876. {
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

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 877. {isSyncing ? "Syncing..." : "Refresh Data"}

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 878. setShowDebug(!showDebug)}
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

**Category**: view

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 879. Cancel

**Category**: cancel

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 880. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 881. Cancel

**Category**: cancel

**File**: `client/src/pages/00850-civil-engineering/components/modals/00850-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00850-civil-engineering

---

### 882. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 883. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 884. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 885. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 886. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 887. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 888. Close

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 889. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 890. {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 891. {/* TODO: Implement preview expansion */}}
              >
                📖 More Details

**Category**: view

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 892. Cancel

**Category**: cancel

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 893. {
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

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 894. {isSyncing ? "Syncing..." : "Refresh Data"}

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 895. setShowDebug(!showDebug)}
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

**Category**: view

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 896. Cancel

**Category**: cancel

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 897. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 898. Cancel

**Category**: cancel

**File**: `client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00835-chemical-engineering

---

### 899. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00825-architectural/components/modals/00825-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 900. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00825-architectural/components/modals/00825-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 901. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00825-architectural/components/modals/00825-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 902. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00825-architectural/components/modals/00825-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 903. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/00825-architectural/components/modals/00825-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 904. Close

**Category**: other

**File**: `client/src/pages/00825-architectural/components/modals/00825-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 905. {cloudFiles.every((f) => f.selected) ? "Deselect All" : "Select All"}

**Category**: other

**File**: `client/src/pages/00825-architectural/components/modals/00825-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 906. removeTag(tag)} className="00825-tag-chip-remove" aria-label={`Remove tag ${tag}`} title="Remove tag">×

**Category**: delete

**File**: `client/src/pages/00825-architectural/components/modals/00825-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 907. addTag(tagInput)} disabled={!tagInput.trim()} className="00825-btn 00825-btn-primary 00825-tag-add-btn 00825-btn-small">+ Add Tag

**Category**: other

**File**: `client/src/pages/00825-architectural/components/modals/00825-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 908. Cancel

**Category**: cancel

**File**: `client/src/pages/00825-architectural/components/modals/00825-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 909. {loading ? "⏳ Processing..." : "🔗 Cloud Upsert"}

**Category**: other

**File**: `client/src/pages/00825-architectural/components/modals/00825-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00825-architectural

---

### 910. {filteredVectorData.every(v => v.selected) ? "Deselect All" : "Select All"}

**Category**: other

**File**: `client/src/pages/00800-design/components/modals/00800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00800-design

---

### 911. handleDeactivate(vector.id)}
                        style={{ ...styles.actionButton, ...styles.deactivateButton }}
                        disabled={loading}
                      >
                        Deactivate

**Category**: actions

**File**: `client/src/pages/00800-design/components/modals/00800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00800-design

---

### 912. handleActivate(vector.id)}
                        style={{ ...styles.actionButton, ...styles.activateButton }}
                        disabled={loading}
                      >
                        Activate

**Category**: actions

**File**: `client/src/pages/00800-design/components/modals/00800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00800-design

---

### 913. handleDelete(vector.id)}
                      style={{ ...styles.actionButton, ...styles.deleteButton }}
                      disabled={loading}
                    >
                      Delete

**Category**: actions

**File**: `client/src/pages/00800-design/components/modals/00800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00800-design

---

### 914. Close

**Category**: other

**File**: `client/src/pages/00800-design/components/modals/00800-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00800-design

---

### 915. {cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}

**Category**: other

**File**: `client/src/pages/00800-design/components/modals/00800-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00800-design

---

### 916. Cancel

**Category**: cancel

**File**: `client/src/pages/00800-design/components/modals/00800-UpsertCloudModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00800-design

---

### 917. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00435-contracts-post-award/components/modals/00435-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 918. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00435-contracts-post-award/components/modals/00435-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 919. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00435-contracts-post-award/components/modals/00435-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 920. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00435-contracts-post-award/components/modals/00435-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 921. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/00435-contracts-post-award/components/modals/00435-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 922. Close

**Category**: other

**File**: `client/src/pages/00435-contracts-post-award/components/modals/00435-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 923. {isLoading ? 'Processing...' : 'Reject'}

**Category**: other

**File**: `client/src/pages/00435-contracts-post-award/components/agents/ProgressiveDisclosureHITLModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 924. {isLoading ? 'Processing...' : 'Escalate'}

**Category**: other

**File**: `client/src/pages/00435-contracts-post-award/components/agents/ProgressiveDisclosureHITLModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 925. {isLoading ? 'Processing...' : 'Approve'}

**Category**: other

**File**: `client/src/pages/00435-contracts-post-award/components/agents/ProgressiveDisclosureHITLModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 926. e.key === 'Enter' && !isLoading && handleApprove()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  aria-describedby="approve-description"
                >
                  {isLoading ? 'Processing...' : 'Approve'}

**Category**: other

**File**: `client/src/pages/00435-contracts-post-award/components/agents/AccessibleProgressiveDisclosureHITLModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 927. e.key === 'Enter' && !isLoading && handleReject()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  aria-describedby="reject-description"
                >
                  {isLoading ? 'Processing...' : 'Reject'}

**Category**: other

**File**: `client/src/pages/00435-contracts-post-award/components/agents/AccessibleProgressiveDisclosureHITLModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 928. e.key === 'Enter' && !isLoading && handleEscalate()}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                    aria-describedby="escalate-description"
                  >
                    {isLoading ? 'Processing...' : 'Escalate'}

**Category**: other

**File**: `client/src/pages/00435-contracts-post-award/components/agents/AccessibleProgressiveDisclosureHITLModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00435-contracts-post-award

---

### 929. handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})

**Category**: actions

**File**: `client/src/pages/00425-contracts-pre-award/components/modals/00425-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00425-contracts-pre-award

---

### 930. handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected

**Category**: actions

**File**: `client/src/pages/00425-contracts-pre-award/components/modals/00425-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00425-contracts-pre-award

---

### 931. handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected

**Category**: actions

**File**: `client/src/pages/00425-contracts-pre-award/components/modals/00425-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00425-contracts-pre-award

---

### 932. {loading ? "Processing..." : `Yes, ${action}`}

**Category**: actions

**File**: `client/src/pages/00425-contracts-pre-award/components/modals/00425-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00425-contracts-pre-award

---

### 933. setAction("")}
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

**Category**: actions

**File**: `client/src/pages/00425-contracts-pre-award/components/modals/00425-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00425-contracts-pre-award

---

### 934. Close

**Category**: other

**File**: `client/src/pages/00425-contracts-pre-award/components/modals/00425-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00425-contracts-pre-award

---

### 935. handleReindexDocument(doc.id)}
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

**Category**: other

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 936. handleDeleteDocument(doc.id)}
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

**Category**: delete

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 937. alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents

**Category**: other

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 938. alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table

**Category**: other

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 939. alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics

**Category**: other

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 940. alert("Table backup created successfully.")}
              >
                💾 Create Backup

**Category**: other

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 941. Close

**Category**: other

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 942. alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes

**Category**: other

**File**: `client/src/pages/00400-contracts/components/modals/00400-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 943. Cancel

**Category**: cancel

**File**: `client/src/pages/00400-contracts/components/modals/00400-UpsertUrlModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 944. {isSyncing ? "Syncing..." : "Refresh Data"}

**Category**: other

**File**: `client/src/pages/00400-contracts/components/modals/00400-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 945. setShowDebug(!showDebug)}
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

**Category**: view

**File**: `client/src/pages/00400-contracts/components/modals/00400-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 946. Cancel

**Category**: cancel

**File**: `client/src/pages/00400-contracts/components/modals/00400-UpsertFileModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00400-contracts

---

### 947. Close

**Category**: other

**File**: `client/src/pages/00300-construction/components/modals/00300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00300-construction

---

### 948. {loading ? "Exporting..." : "Export"}

**Category**: other

**File**: `client/src/pages/00300-construction/components/modals/00300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00300-construction

---

### 949. {loading ? "Deleting..." : "Delete"}

**Category**: delete

**File**: `client/src/pages/00300-construction/components/modals/00300-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00300-construction

---

### 950. {refreshing ? '🔄' : '🔄'} Refresh

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/SecurityComplianceDashboard.jsx`

**Pattern**: Button with text

**Page Type**: 00165-ui-settings

---

### 951. 📊 Generate Report

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/SecurityComplianceDashboard.jsx`

**Pattern**: Button with text

**Page Type**: 00165-ui-settings

---

### 952. {refreshing ? '🔄' : '🔄'} Refresh

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/SecurityComplianceDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 953. 📊 Generate Report

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/SecurityComplianceDashboard.jsx`

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 954. handleDocumentSelect(doc)}
                      >
                        View Details

**Category**: view

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Pattern**: Button with text

**Page Type**: 00165-ui-settings

---

### 955. handleDocumentSelect(doc)}
                        >
                          View Details

**Category**: view

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Pattern**: Button with text

**Page Type**: 00165-ui-settings

---

### 956. Grant User Access

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Pattern**: Button with text

**Page Type**: 00165-ui-settings

---

### 957. handleRevokeUserAccess(docId, userId)
                                  }
                                >
                                  Revoke

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Pattern**: Button with text

**Page Type**: 00165-ui-settings

---

### 958. handleDocumentSelect(doc)}
                      >
                        View Details

**Category**: view

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 959. handleDocumentSelect(doc)}
                        >
                          View Details

**Category**: view

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 960. Grant User Access

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 961. handleRevokeUserAccess(docId, userId)
                                  }
                                >
                                  Revoke

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/DocumentAccessTab.jsx`

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 962. Create Template

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Button with text

**Page Type**: 00165-ui-settings

---

### 963. Apply Template

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Button with text

**Page Type**: 00165-ui-settings

---

### 964. Create Template

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 965. Apply Template

**Category**: other

**File**: `client/src/pages/00165-ui-settings/components/CrossDisciplineSharingTab.jsx`

**Pattern**: Regular button element

**Page Type**: 00165-ui-settings

---

### 966. {filteredVectorData.every(v => v.selected) ? "Deselect All" : "Select All"}

**Category**: other

**File**: `client/src/pages/00102-administration/components/modals/00102-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00102-administration

---

### 967. handleDeactivate(vector.id)}
                        style={{ ...styles.actionButton, ...styles.deactivateButton }}
                        disabled={loading}
                      >
                        Deactivate

**Category**: actions

**File**: `client/src/pages/00102-administration/components/modals/00102-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00102-administration

---

### 968. handleActivate(vector.id)}
                        style={{ ...styles.actionButton, ...styles.activateButton }}
                        disabled={loading}
                      >
                        Activate

**Category**: actions

**File**: `client/src/pages/00102-administration/components/modals/00102-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00102-administration

---

### 969. handleDelete(vector.id)}
                      style={{ ...styles.actionButton, ...styles.deleteButton }}
                      disabled={loading}
                    >
                      Delete

**Category**: actions

**File**: `client/src/pages/00102-administration/components/modals/00102-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00102-administration

---

### 970. Close

**Category**: other

**File**: `client/src/pages/00102-administration/components/modals/00102-VectorDataManagerModal.jsx`

**Pattern**: Regular button element

**Page Type**: 00102-administration

---

