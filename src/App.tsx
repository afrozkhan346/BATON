/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { MarqueeBanner } from './components/MarqueeBanner';
import { HorizontalStoryFlow } from './components/HorizontalStoryFlow';
import { DashboardView } from './components/DashboardView';
import { SourcesView } from './components/SourcesView';
import { ClaimsLedgerView } from './components/ClaimsLedgerView';
import { GapsView } from './components/GapsView';
import { HandoverReportView } from './components/HandoverReportView';
import { BatonBenchView } from './components/BatonBenchView';
import { ReviewModal } from './components/ReviewModal';
import { ResolveGapModal } from './components/ResolveGapModal';
import { BackendDocsModal } from './components/BackendDocsModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';

import {
  INITIAL_METRICS,
  INITIAL_SOURCES,
  INITIAL_CLAIMS,
  INITIAL_GAPS,
} from './data/mockData';
import {
  Claim,
  ClaimStatus,
  KnowledgeGap,
  SourceDocument,
  ProcessStatus,
  ProjectDashboardMetrics,
  User,
  UserRole,
} from './types/baton';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Authentication & RBAC User State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('baton_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.user) return parsed.user;
      }
    } catch {}
    // Default initial persona: Project Manager (Rushikesh Bobade)
    return {
      id: 'usr-demo-pm',
      email: 'pm@baton.ai',
      full_name: 'Rushikesh Bobade',
      role: 'project_manager',
      created_at: new Date().toISOString(),
    };
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('baton_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed?.token || null;
      }
    } catch {}
    return null;
  });

  // Core Application Data State
  const [metrics, setMetrics] = useState<ProjectDashboardMetrics>(INITIAL_METRICS);
  const [sources, setSources] = useState<SourceDocument[]>(INITIAL_SOURCES);
  const [claims, setClaims] = useState<Claim[]>(INITIAL_CLAIMS);
  const [gaps, setGaps] = useState<KnowledgeGap[]>(INITIAL_GAPS);
  const [isApproved, setIsApproved] = useState<boolean>(false);

  // Modal States
  const [selectedClaimForReview, setSelectedClaimForReview] = useState<Claim | null>(null);
  const [selectedGapForResolution, setSelectedGapForResolution] = useState<KnowledgeGap | null>(null);

  // Processing Job State
  const [processStatus, setProcessStatus] = useState<ProcessStatus>({
    status: 'idle',
    progress_pct: 100,
    chunks_processed: 32,
    claims_extracted: 27,
    gaps_found: 4,
    conflicts_found: 2,
  });

  // Keep dark/light class in sync with documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Handle successful login or registration
  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    try {
      localStorage.setItem('baton_auth', JSON.stringify({ user, token }));
    } catch {}
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    try {
      localStorage.removeItem('baton_auth');
    } catch {}
  };

  // Handle Fast Demo Role Switcher
  const handleQuickSwitchRole = (newRole: UserRole) => {
    let switchedUser: User;
    if (newRole === 'admin') {
      switchedUser = {
        id: 'usr-demo-admin',
        email: 'admin@baton.ai',
        full_name: 'Antigravity Admin',
        role: 'admin',
        created_at: new Date().toISOString(),
      };
    } else if (newRole === 'project_manager') {
      switchedUser = {
        id: 'usr-demo-pm',
        email: 'pm@baton.ai',
        full_name: 'Rushikesh Bobade',
        role: 'project_manager',
        created_at: new Date().toISOString(),
      };
    } else {
      switchedUser = {
        id: 'usr-demo-employee',
        email: 'employee@baton.ai',
        full_name: 'Afroz Khan',
        role: 'employee',
        created_at: new Date().toISOString(),
      };
    }
    const token = `demo-token-${newRole}-${Date.now()}`;
    setCurrentUser(switchedUser);
    setAuthToken(token);
    try {
      localStorage.setItem('baton_auth', JSON.stringify({ user: switchedUser, token }));
    } catch {}
  };

  // Recalculate metrics whenever claims or gaps change
  const updateMetricsState = (newClaims: Claim[], newGaps: KnowledgeGap[]) => {
    const verified = newClaims.filter((c) => c.status === 'VERIFIED').length;
    const resolvedGaps = newGaps.filter((g) => g.status === 'resolved').length;
    const openGapsCount = newGaps.filter((g) => g.status === 'open').length;
    const conflictsCount = newClaims.filter((c) => c.status === 'CONFLICT').length;

    const attentionItems: string[] = [];
    if (openGapsCount > 0) {
      attentionItems.push(`${openGapsCount} open knowledge gaps requiring successor triage`);
    }
    if (conflictsCount > 0) {
      attentionItems.push(`${conflictsCount} active cross-source contradictions`);
    }
    const unverifiedCount = newClaims.filter((c) => c.status === 'NEEDS_REVIEW').length;
    if (unverifiedCount > 0) {
      attentionItems.push(`${unverifiedCount} claims awaiting human evidentiary audit`);
    }

    setMetrics((prev) => ({
      ...prev,
      claims_verified: verified,
      claims_total: newClaims.length,
      gaps_resolved: resolvedGaps,
      gaps_total: newGaps.length,
      approvals_pending: unverifiedCount,
      needs_attention: attentionItems.length > 0 ? attentionItems : ['All items verified and ready for official sign-off'],
      handover_ready: unverifiedCount === 0 && openGapsCount === 0 && conflictsCount === 0,
    }));
  };

  // Handler: Review Claim (Verify / Edit / Reject)
  const handleReviewSubmit = (
    action: 'verify' | 'edit' | 'reject',
    updatedStatement?: string,
    note?: string
  ) => {
    if (!selectedClaimForReview) return;

    const reviewerName = currentUser?.full_name || 'Anonymous Reviewer';

    const updatedClaims = claims.map((c) => {
      if (c.id === selectedClaimForReview.id) {
        const newStatus: ClaimStatus = action === 'verify' ? 'VERIFIED' : action === 'edit' ? 'NEEDS_REVIEW' : 'REJECTED';
        const newHistory = [
          ...(c.review_history || []),
          {
            id: `rev-${Date.now()}`,
            claim_id: c.id,
            reviewer: reviewerName,
            action,
            previous_status: c.status,
            new_status: newStatus,
            statement_before: c.statement,
            statement_after: updatedStatement || c.statement,
            note: note || `Reviewer action: ${action} by ${reviewerName} (${currentUser?.role || 'user'})`,
            created_at: new Date().toISOString(),
          },
        ];

        return {
          ...c,
          statement: updatedStatement || c.statement,
          status: newStatus,
          review_history: newHistory,
        };
      }
      return c;
    });

    setClaims(updatedClaims);
    updateMetricsState(updatedClaims, gaps);
    setSelectedClaimForReview(null);
  };

  // Handler: Resolve Knowledge Gap
  const handleResolveGap = (gapId: string, resolutionNote: string, owner?: string) => {
    const resolverName = currentUser?.full_name || 'Anonymous Engineer';

    const updatedGaps = gaps.map((g) => {
      if (g.id === gapId) {
        return {
          ...g,
          status: 'resolved' as const,
          resolution_note: resolutionNote,
          owner: owner || g.owner,
          resolved_at: new Date().toISOString(),
          resolved_by: resolverName,
        };
      }
      return g;
    });

    setGaps(updatedGaps);
    updateMetricsState(claims, updatedGaps);
  };

  // Handler: Upload File
  const handleUploadFile = (file: File, restricted?: boolean) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'txt';
    const newDoc: SourceDocument = {
      id: `src-${Date.now()}`,
      filename: file.name,
      file_type: (['pdf', 'docx', 'csv', 'txt'].includes(extension) ? extension : 'txt') as any,
      file_size: `${(file.size / 1024).toFixed(1)} KB`,
      owner: currentUser?.full_name || 'Project Manager',
      status: restricted ? 'redacted' : 'processed',
      total_chunks: Math.max(1, Math.ceil(file.size / 1024 / 2)),
      restricted: !!restricted,
      redacted_items_count: restricted ? 1 : 0,
      uploaded_at: new Date().toISOString(),
    };

    setSources((prev) => [newDoc, ...prev]);
  };

  // Handler: Trigger AI Processing Pipeline
  const handleRunProcessing = () => {
    setProcessStatus({
      status: 'processing',
      progress_pct: 10,
      chunks_processed: 8,
      claims_extracted: 6,
      gaps_found: 1,
      conflicts_found: 0,
    });

    const interval = setInterval(() => {
      setProcessStatus((prev) => {
        if (prev.progress_pct >= 100) {
          clearInterval(interval);
          return {
            status: 'completed',
            progress_pct: 100,
            chunks_processed: 32,
            claims_extracted: 27,
            gaps_found: 4,
            conflicts_found: 2,
          };
        }
        return {
          ...prev,
          progress_pct: Math.min(100, prev.progress_pct + 30),
          chunks_processed: Math.min(32, prev.chunks_processed + 8),
          claims_extracted: Math.min(27, prev.claims_extracted + 7),
        };
      });
    }, 400);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#07090e] text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        setIsDark={setIsDark}
        onOpenDocs={() => setIsDocsOpen(true)}
        isLiveBackend={isLiveBackend}
        setIsLiveBackend={setIsLiveBackend}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onQuickSwitchRole={handleQuickSwitchRole}
      />

      {/* Main Container */}
      <main className="flex-1 w-full">
        {/* Cinematic Hero */}
        <HeroSection
          onExplore={() => {
            setActiveTab('claims');
            document.getElementById('studio-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenDocs={() => setIsDocsOpen(true)}
          onOpenBenchmark={() => {
            setActiveTab('bench');
            document.getElementById('studio-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          isDark={isDark}
        />

        {/* Infinite Marquee Ticker */}
        <MarqueeBanner />

        {/* 4-Gate Horizontal Story Flow */}
        <HorizontalStoryFlow />

        {/* Interactive Studio Workspace Section */}
        <section id="studio-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'sources' && (
            <SourcesView
              sources={sources}
              onUploadFile={handleUploadFile}
              onRunProcessing={handleRunProcessing}
              processStatus={processStatus}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'claims' && (
            <ClaimsLedgerView
              claims={claims}
              onReviewClaim={(claim) => setSelectedClaimForReview(claim)}
            />
          )}

          {activeTab === 'gaps' && (
            <GapsView
              gaps={gaps}
              claims={claims}
              onOpenResolveModal={(gap) => setSelectedGapForResolution(gap)}
              onReviewClaim={(claim) => setSelectedClaimForReview(claim)}
            />
          )}

          {activeTab === 'report' && (
            <HandoverReportView
              metrics={metrics}
              claims={claims}
              gaps={gaps}
              isApproved={isApproved}
              onApprove={() => setIsApproved(true)}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'bench' && <BatonBenchView />}
        </section>
      </main>

      {/* Review Modal */}
      {selectedClaimForReview && (
        <ReviewModal
          claim={selectedClaimForReview}
          reviewerName={currentUser?.full_name || 'Rushikesh Bobade'}
          isOpen={true}
          onClose={() => setSelectedClaimForReview(null)}
          onSubmit={handleReviewSubmit}
        />
      )}

      {/* Gap Resolution Modal */}
      {selectedGapForResolution && (
        <ResolveGapModal
          gap={selectedGapForResolution}
          reviewerName={currentUser?.full_name || 'Rushikesh Bobade'}
          isOpen={true}
          onClose={() => setSelectedGapForResolution(null)}
          onResolve={handleResolveGap}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        apiBaseUrl={isLiveBackend ? 'http://127.0.0.1:8000' : 'http://127.0.0.1:8000'}
      />

      {/* Backend API Contract & Blueprint Modal */}
      <BackendDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
        apiBaseUrl={isLiveBackend ? 'http://127.0.0.1:8000' : 'https://api.baton.evidence/v1'}
      />

      {/* Footer */}
      <Footer
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenBenchmark={() => {
          setActiveTab('bench');
          document.getElementById('studio-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  );
}
