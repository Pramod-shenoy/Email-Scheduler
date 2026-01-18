import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { emailApi } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';

interface SentEmailsProps {
  onSelect?: (id: string) => void;
  search?: string;
  status?: string;
}

const SentEmails: React.FC<SentEmailsProps> = ({ onSelect, search, status }) => {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sent-emails', page, search, status],
    queryFn: () => emailApi.getSentEmails(page, limit, search, status),
  });

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
        <p className="text-red-600">Failed to load sent emails</p>
        <Button onClick={() => refetch()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (!data?.emails.length) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No sent emails</h3>
        <p className="mt-1 text-sm text-gray-500">Emails you send will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-gray-100">
        {data.emails.map((email) => (
          <div
            key={email.id}
            onClick={() => onSelect && onSelect(email.id)}
            className="group flex items-center justify-between py-4 px-6 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            {/* Left Section: To & Content */}
            <div className="flex items-center space-x-6 overflow-hidden">
              {/* To: Recipient */}
              <div className="w-64 flex-shrink-0">
                <span className="text-gray-500 font-medium text-sm">To: </span>
                <span className="text-gray-900 font-medium text-sm">{email.email}</span>
              </div>

              {/* Content: Status Pill + Subject + Snippet */}
              <div className="flex items-center space-x-3 overflow-hidden">
                {/* Sent Pill - Gray styling matches mockup */}
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                  Sent
                </div>

                {/* Subject & Snippet */}
                <div className="flex items-center text-sm truncate">
                  <div className="font-bold text-gray-900 mr-2 truncate">
                    {email.subject}
                  </div>
                  <span className="text-gray-500 truncate">- Click to see details...</span>
                </div>
              </div>
            </div>

            {/* Right Section: Star Icon */}
            <div className="flex items-center space-x-4 pl-4 flex-shrink-0">
              <button className="text-gray-300 hover:text-yellow-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
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

export default SentEmails;