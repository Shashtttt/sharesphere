import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CatalogueView } from './components/CatalogueView';
import { AiMatcherView } from './components/AiMatcherView';
import { BookingsView } from './components/BookingsView';
import { QualificationsView } from './components/QualificationsView';
import { IncidentsView } from './components/IncidentsView';
import { WaitingListView } from './components/WaitingListView';
import { AuditTrailView } from './components/AuditTrailView';

// Modals
import { JudgeDemoModal } from './components/JudgeDemoModal';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { CreateResourceModal } from './components/CreateResourceModal';
import { CheckInModal } from './components/CheckInModal';
import { ReturnModal } from './components/ReturnModal';

import { AuthView } from './components/AuthView';
import { Resource, Booking } from './types';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isCreateResourceOpen, setIsCreateResourceOpen] = useState<boolean>(false);
  const [selectedBookingForCheckIn, setSelectedBookingForCheckIn] = useState<Booking | null>(null);
  const [selectedBookingForReturn, setSelectedBookingForReturn] = useState<Booking | null>(null);

  // Trigger refresh in sub-views when booking created
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // If not logged in, render dynamic login and registration page
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-300">Loading ShareSphere Campus Cluster...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView onSuccess={() => setCurrentView('dashboard')} />;
  }

  const handleOpenResourceDetail = (res: Resource) => {
    setSelectedResource(res);
  };

  const handleBookingCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setCurrentView('bookings');
  };

  const handleResourceCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setCurrentView('catalogue');
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            key={`dash-${refreshTrigger}`}
            onSelectNav={setCurrentView}
            onOpenResourceDetail={handleOpenResourceDetail}
            onOpenCreateResource={() => setIsCreateResourceOpen(true)}
          />
        );
      case 'catalogue':
      case 'owner-management':
        return (
          <CatalogueView
            key={`cat-${refreshTrigger}`}
            onOpenResourceDetail={handleOpenResourceDetail}
            onOpenCreateResource={() => setIsCreateResourceOpen(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            userRole={user?.role}
          />
        );
      case 'ai-matcher':
        return (
          <AiMatcherView
            onOpenResourceDetail={handleOpenResourceDetail}
          />
        );
      case 'bookings':
        return (
          <BookingsView
            key={`book-${refreshTrigger}`}
            onOpenCheckIn={(b) => setSelectedBookingForCheckIn(b)}
            onOpenReturn={(b) => setSelectedBookingForReturn(b)}
          />
        );
      case 'qualifications':
        return <QualificationsView key={`qual-${refreshTrigger}`} />;
      case 'incidents':
        return <IncidentsView key={`inc-${refreshTrigger}`} />;
      case 'waiting-list':
        return <WaitingListView key={`wait-${refreshTrigger}`} />;
      case 'audit-trail':
        return <AuditTrailView key={`audit-${refreshTrigger}`} />;
      default:
        return (
          <DashboardView
            onSelectNav={setCurrentView}
            onOpenResourceDetail={handleOpenResourceDetail}
            onOpenCreateResource={() => setIsCreateResourceOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* Top Navbar */}
      <Navbar
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSelectNav={setCurrentView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Collapsible Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectNav={setCurrentView}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          onOpenDemoGuide={() => setIsDemoModalOpen(true)}
        />

        {/* Dynamic Main View Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {renderActiveView()}
        </main>

      </div>

      {/* Global Modals */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 z-20 text-slate-400 hover:text-white bg-slate-800/80 p-2 rounded-full transition-colors"
            >
              ✕
            </button>
            <AuthView onSuccess={() => setIsAuthModalOpen(false)} />
          </div>
        </div>
      )}

      <JudgeDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSelectNav={setCurrentView}
      />

      <ResourceDetailModal
        resource={selectedResource}
        isOpen={selectedResource !== null}
        onClose={() => setSelectedResource(null)}
        onBookingCreated={handleBookingCreated}
      />

      <CreateResourceModal
        isOpen={isCreateResourceOpen}
        onClose={() => setIsCreateResourceOpen(false)}
        onResourceCreated={handleResourceCreated}
      />

      <CheckInModal
        booking={selectedBookingForCheckIn}
        isOpen={selectedBookingForCheckIn !== null}
        onClose={() => setSelectedBookingForCheckIn(null)}
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />

      <ReturnModal
        booking={selectedBookingForReturn}
        isOpen={selectedBookingForReturn !== null}
        onClose={() => setSelectedBookingForReturn(null)}
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
