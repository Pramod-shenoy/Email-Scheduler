import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { emailApi } from '../../services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

interface InboxEmailsProps {
    onSelect?: (id: string) => void;
    search?: string;
    status?: string;
}

const InboxEmails: React.FC<InboxEmailsProps> = ({ onSelect, search, status }) => {
    const [page, setPage] = useState(1);
    const limit = 20;

    // Fetch ALL jobs (Inbox behavior, no filtered statuses passed by default unless selected in filter)
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['scheduled-emails', page, search, status], // Reusing key structure but effectively different params
        queryFn: () => emailApi.getScheduledEmails(page, limit, search, status),
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

    const getStatusBadge = (status: string) => {
        const statusClasses = {
            SCHEDULED: 'bg-blue-100 text-blue-800',
            PROCESSING: 'bg-yellow-100 text-yellow-800',
            COMPLETED: 'bg-green-100 text-green-800',
            FAILED: 'bg-red-100 text-red-800',
            CANCELLED: 'bg-gray-100 text-gray-800',
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
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
                <p className="text-red-600">Failed to load emails</p>
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
                <p className="mt-1 text-sm text-gray-500">Your inbox is empty.</p>
            </div>
        );
    }

    return (
        <div className="bg-white h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Recipients</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.jobs.map((job) => (
                            <TableRow
                                key={job.id}
                                onClick={() => onSelect && onSelect(job.id)}
                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <TableCell>
                                    <div className="font-medium text-gray-900">{job.subject}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-gray-900">{job.totalEmails} recipients</div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-gray-900">
                                        {format(new Date(job.scheduledAt), 'MMM dd, HH:mm')}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-gray-900">
                                        {job.sentEmails} / {job.totalEmails}
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                        <div
                                            className="bg-primary-600 h-1.5 rounded-full"
                                            style={{
                                                width: `${(job.sentEmails / job.totalEmails) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(job.status)}
                                </TableCell>
                                <TableCell>
                                    {(job.status === 'SCHEDULED' || job.status === 'PROCESSING') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => handleCancelJob(e, job.id)}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
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

export default InboxEmails;
