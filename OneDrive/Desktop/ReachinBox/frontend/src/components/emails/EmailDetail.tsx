import React from 'react';
import { format } from 'date-fns';

interface Attachment {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: string; // Base64 encoded content
}

interface EmailDetailProps {
    email: any; // Using any for simplicity as it could be Job or Send
    onBack: () => void;
    type: 'job' | 'send';
}

const EmailDetail: React.FC<EmailDetailProps> = ({ email, onBack, type }) => {
    // Normalize data between Job and Send
    const subject = email.subject || email.emailJob?.subject;
    const body = email.body || email.emailJob?.body;
    const recipient = type === 'send' ? email.email : 'Multiple Recipients';
    const time = type === 'send' ? email.sentAt : email.scheduledAt;

    // Parse attachments
    let attachments: Attachment[] = [];
    try {
        const rawAttachments = email.attachments || email.emailJob?.attachments;
        if (rawAttachments) {
            attachments = typeof rawAttachments === 'string' ? JSON.parse(rawAttachments) : rawAttachments;
        }
    } catch (e) {
        console.error('Failed to parse attachments', e);
    }

    return (
        <div className="bg-white rounded-lg shadow h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center bg-gray-50 rounded-t-lg">
                <button
                    onClick={onBack}
                    className="mr-4 text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <span className="ml-auto text-sm text-gray-500 font-mono">
                    {email.id}
                </span>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
                {/* Metadata */}
                {/* Metadata */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xl mr-4 flex-shrink-0">
                            {recipient[0].toUpperCase()}
                        </div>
                        <div>
                            <div className="font-bold text-xl text-gray-800 mb-1">{subject}</div>
                            <div className="text-sm text-gray-500">
                                &lt;
                                {type === 'send'
                                    ? recipient
                                    : Array.isArray(JSON.parse((email.recipients || '[]')))
                                        ? JSON.parse((email.recipients || '[]')).join(', ')
                                        : 'Multiple Recipients'
                                }
                                &gt;
                            </div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 whitespace-nowrap ml-4">
                        {time ? format(new Date(time), 'MMM d, yyyy, h:mm a') : 'Not sent yet'}
                    </div>
                </div>

                {/* Body */}
                <div className="prose max-w-none text-gray-700 mb-8">
                    <div dangerouslySetInnerHTML={{ __html: body }} />
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                    <div className="border-t border-gray-100 pt-6">
                        <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            Attachments ({attachments.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {attachments.map((file, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors">
                                    {file.mimetype.startsWith('image/') ? (
                                        <img
                                            src={`data:${file.mimetype};base64,${file.buffer}`}
                                            alt={file.originalname}
                                            className="w-full h-32 object-cover rounded mb-2"
                                        />
                                    ) : (
                                        <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-600 truncate font-medium">{file.originalname}</div>
                                    <div className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailDetail;
