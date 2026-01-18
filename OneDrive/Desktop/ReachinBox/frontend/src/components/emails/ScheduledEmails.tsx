import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { emailApi } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

interface ScheduledEmailsProps {
  onSelect?: (id: string) => void;
  search?: string;
  status?: string;
  statuses?: string[];
}

const ScheduledEmails: React.FC<ScheduledEmailsProps> = ({ onSelect, search, status, statuses }) => {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['scheduled-emails', page, search, status, statuses],
    queryFn: () => emailApi.getScheduledEmails(page, limit, search, status, statuses),
  });

  const handleCancelJob = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    try {
      await emailApi.cancelJob(jobId);
      toast.success('Job cancelled successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to cancel job');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load scheduled emails</p>
        <Button onClick={() => refetch()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (!data?.jobs.length) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No emails found</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-gray-100">
        {data.jobs.map((job) => {
          // Parse recipients for display
          // Parse recipients for display
          let recipientsDisplay = 'Recipients';
          try {
            const recipients = JSON.parse(job.totalEmails ? (job as any).recipients || '[]' : '[]');
            if (Array.isArray(recipients) && recipients.length > 0) {
              const firstEmail = recipients[0];
              // Get name before @ and capitalize first letter
              const namePart = firstEmail.split('@')[0];
              recipientsDisplay = namePart.charAt(0).toUpperCase() + namePart.slice(1);

              if (recipients.length > 1) recipientsDisplay += ` +${recipients.length - 1} others`;
            }
          } catch (e) { recipientsDisplay = 'Multiple Recipients'; }

          // Mock body snippet if not available in job list logic, usually backend might need to send snippet
          // For now, using subject as main title and "Scheduled" as subtitle or similar
          const isScheduled = job.status === 'SCHEDULED';

          return (
            <div
              key={job.id}
              onClick={() => onSelect && onSelect(job.id)}
              className="group flex items-center justify-between py-4 px-6 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {/* Left Section: To & Content */}
              <div className="flex items-center space-x-6 overflow-hidden">

                {/* To: Recipient */}
                <div className="w-64 flex-shrink-0">
                  <span className="text-gray-500 font-medium text-sm">To: </span>
                  <span className="text-gray-900 font-medium text-sm">{recipientsDisplay}</span>
                </div>

                {/* Content: Date Pill + Subject + Snippet */}
                <div className="flex items-center space-x-3 overflow-hidden">
                  {/* Date Pill - Orange styling matches mockup */}
                  <div className="flex items-center space-x-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{format(new Date(job.scheduledAt), 'MMM d, h:mm a')}</span>
                  </div>

                  {/* Subject & Snippet */}
                  <div className="flex items-center text-sm truncate">
                    <span className="font-bold text-gray-900 mr-2 truncate">{job.subject}</span>
                    <span className="text-gray-500 truncate">- {job.status} - Click to see details...</span>
                  </div>
                </div>
              </div>

              {/* Right Section: Star & Actions */}
              <div className="flex items-center space-x-4 pl-4 flex-shrink-0">
                {/* Cancel Button (Functional) */}
                {(job.status === 'SCHEDULED' || job.status === 'PROCESSING') && (
                  <button
                    onClick={(e) => handleCancelJob(e, job.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Cancel Job"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}

                {/* Star Icon (Mock for visual closeness) */}
                <button className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === data.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledEmails;