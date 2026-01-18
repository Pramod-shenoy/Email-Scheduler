import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ScheduledEmails from '../components/emails/ScheduledEmails';
import InboxEmails from '../components/emails/InboxEmails';
import SentEmails from '../components/emails/SentEmails';
import ComposeEmailModal from '../components/emails/ComposeEmailModal';
import Sidebar from '../components/layout/Sidebar';
import { emailApi } from '../services/api';
import EmailDetail from '../components/emails/EmailDetail';

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'scheduled' | 'sent'>('inbox');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Detail View State
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['email-stats'],
    queryFn: emailApi.getStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleComposeSuccess = () => {
    // Invalidate queries to trigger refresh
    queryClient.invalidateQueries({ queryKey: ['email-stats'] });
    queryClient.invalidateQueries({ queryKey: ['scheduled-emails'] });
    queryClient.invalidateQueries({ queryKey: ['sent-emails'] });
  };

  const handleSelectEmail = async (id: string, type: 'job' | 'send') => {
    try {
      setLoadingDetail(true);
      const data = type === 'job'
        ? await emailApi.getEmailJob(id)
        : await emailApi.getEmailSend(id);

      setSelectedEmail({ ...data, _viewType: type });
    } catch (error) {
      console.error('Failed to load email details', error);
      // Fallback/Toast could go here
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        onCompose={() => setIsComposeOpen(true)}
        activeView={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setSelectedEmail(null);
          setFilterStatus(''); // Reset filter on tab change
          setSearchQuery('');
        }}
        scheduledCount={stats?.counts?.scheduled || 0}
        sentCount={stats?.counts?.sent || 0}
      />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Bar / Header */}
        <div className="bg-white border-b border-gray-200 h-16 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="font-bold text-gray-700">Homepage</div>
          <div className="w-1/3">
            <div className="relative text-gray-400 focus-within:text-gray-600">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                className="block w-full h-10 pl-10 pr-3 rounded-full border-none bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                placeholder="Search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-4 relative">
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors ${filterStatus ? 'text-blue-500 bg-blue-50' : ''}`}
                title="Filter by Status"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-100">
                  <button
                    onClick={() => { setFilterStatus(''); setIsFilterOpen(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 ${filterStatus === '' ? 'bg-gray-50 font-medium' : ''}`}
                  >
                    All Statuses
                  </button>
                  {activeTab === 'scheduled' ? (
                    <>
                      <button onClick={() => { setFilterStatus('SCHEDULED'); setIsFilterOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Scheduled</button>
                      <button onClick={() => { setFilterStatus('PROCESSING'); setIsFilterOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Processing</button>
                      <button onClick={() => { setFilterStatus('FAILED'); setIsFilterOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Failed</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setFilterStatus('SENT'); setIsFilterOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Sent</button>
                      <button onClick={() => { setFilterStatus('FAILED'); setIsFilterOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Failed</button>
                    </>
                  )}
                </div>
              )}
            </div>

            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 h-[calc(100vh-4rem)] overflow-hidden">
          {selectedEmail ? (
            <div className="h-full pb-8">
              <EmailDetail
                email={selectedEmail}
                type={selectedEmail._viewType}
                onBack={() => setSelectedEmail(null)}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow h-full overflow-hidden">
              {activeTab === 'inbox' && (
                <InboxEmails
                  onSelect={(id) => handleSelectEmail(id, 'job')}
                  search={searchQuery}
                  status={filterStatus}
                />
              )}
              {activeTab === 'scheduled' && (
                <ScheduledEmails
                  onSelect={(id) => handleSelectEmail(id, 'job')}
                  search={searchQuery}
                  status={filterStatus}
                  statuses={['SCHEDULED', 'PROCESSING']}
                />
              )}
              {activeTab === 'sent' && (
                <SentEmails
                  onSelect={(id) => handleSelectEmail(id, 'send')}
                  search={searchQuery}
                  status={filterStatus}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Compose Modal */}
      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={handleComposeSuccess}
      />
    </div>
  );
};

export default DashboardPage;