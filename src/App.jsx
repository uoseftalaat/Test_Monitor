import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import GlobalOverview from './components/overview/GlobalOverview';
import ProjectView from './components/project/ProjectView';
import TestDetailModal from './components/TestDetailModal';
import AuthModal from './components/auth/AuthModal';
import useAuth from './hooks/useAuth';
import useProjectData from './hooks/useProjectData';
import { Loader2, AlertCircle, Info, Database } from 'lucide-react';

export default function App() {
  const [selectedProjectId, setSelectedProjectId] = useState('arm'); // Default to ARM
  const [selectedTest, setSelectedTest] = useState(null);

  // Authentication Hook
  const {
    currentUser,
    authLoading,
    firebaseReady,
    bypassAuthForFallback,
    showAuthModal,
    setShowAuthModal,
    requiresAuth,
    logout,
    enableFallbackBypass,
    disableFallbackBypass
  } = useAuth();

  // Project & Test Monitoring Data Hook
  const {
    globalSummary,
    currentProjectData,
    isLoading,
    isRefreshing,
    lastUpdated,
    errorMessage,
    isUsingCache,
    isFirebaseLive,
    autoRefreshInterval,
    setAutoRefreshInterval,
    refresh,
    clearProjectData
  } = useProjectData({
    selectedProjectId,
    currentUser,
    bypassAuthForFallback,
    firebaseReady,
    authLoading
  });

  const handleSignOut = async () => {
    setSelectedTest(null);
    clearProjectData();
    await logout();
  };

  const projectsList = globalSummary?.projects || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Sticky Header / Navigation */}
      <Navbar
        projects={projectsList}
        selectedProject={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        autoRefreshInterval={autoRefreshInterval}
        onChangeAutoRefresh={setAutoRefreshInterval}
        user={currentUser}
        onSignOut={handleSignOut}
        onSignInClick={() => setShowAuthModal(true)}
        isFirebaseLive={isFirebaseLive}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {requiresAuth ? (
          <AuthModal
            onBypassFallback={enableFallbackBypass}
          />
        ) : (
          <>
            {/* Informational banners */}
            {bypassAuthForFallback && !currentUser && (
              <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-2 text-amber-300 text-xs">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>
                    Running in <strong>Offline Local Preview</strong>. Connect Firebase credentials in <code className="bg-amber-900/50 px-1 py-0.5 rounded text-amber-200">.env.local</code> to enable cloud authentication and real-time Firestore sync.
                  </span>
                </div>
                {firebaseReady && (
                  <button
                    onClick={disableFallbackBypass}
                    className="shrink-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 px-2.5 py-1 rounded-lg border border-amber-500/30 font-medium transition"
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}

            {isUsingCache && (
              <div className="mb-4 p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-2 text-blue-300 text-xs">
                <Info className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Displaying cached test records. Waiting for pipeline updates.</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-between text-red-300 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={refresh}
                  className="text-white bg-red-800/60 hover:bg-red-800 px-3 py-1 rounded-lg font-medium transition"
                >
                  Retry
                </button>
              </div>
            )}

            {isLoading || authLoading ? (
              <div className="h-96 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                <p className="text-xs text-slate-400 font-medium">Loading test metrics and pipeline logs...</p>
              </div>
            ) : selectedProjectId === 'all' ? (
              <GlobalOverview
                globalSummary={globalSummary}
                onSelectProject={setSelectedProjectId}
              />
            ) : (
              <ProjectView
                projectData={currentProjectData}
                onSelectTest={setSelectedTest}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Test Detail Modal */}
      {selectedTest && (
        <TestDetailModal
          test={selectedTest}
          onClose={() => setSelectedTest(null)}
        />
      )}

      {/* Auth Modal Triggered Manually */}
      {showAuthModal && !currentUser && (
        <AuthModal
          onBypassFallback={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
