import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { emailApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ComposeEmailModal: React.FC<ComposeEmailModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial body state if needed (optional for new emails)
  useEffect(() => {
    if (editorRef.current && body && editorRef.current.innerHTML !== body) {
      // Only if strictly needed, but better to avoid cyclic updates for simple compose
    }
  }, [body]);

  // Styling constants
  const inputLabelClass = "w-24 text-gray-500 font-medium text-sm pt-2";
  const inputClass = "flex-1 outline-none text-gray-700 py-2 border-b border-gray-100 focus:border-gray-300 transition-colors bg-transparent";

  const handleFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    // Ensure focus remains for continuous typing
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleLink = () => {
    const url = window.prompt('Enter the URL:');
    if (url) {
      handleFormat('createLink', url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!to || !subject || !body) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsSending(true);
      // Use selected date or send immediately
      const finalScheduledAt = scheduledDate ? scheduledDate.toISOString() : new Date().toISOString();

      let data: any;
      if (files.length > 0) {
        const formData = new FormData();
        formData.append('to', to); // Helper for single but api expects recipients array in JSON
        formData.append('recipients', JSON.stringify([to]));
        formData.append('subject', subject);
        formData.append('body', body);
        formData.append('scheduledAt', finalScheduledAt);
        files.forEach(file => {
          formData.append('attachments', file);
        });
        data = formData;
      } else {
        data = {
          subject,
          body,
          recipients: [to],
          scheduledAt: finalScheduledAt,
        };
      }

      await emailApi.scheduleEmails(data);

      toast.success(scheduledDate ? 'Email scheduled!' : 'Email sent successfully!');
      onSuccess();
      onClose();
      setTo('');
      setSubject('');
      setBody('');
      setFiles([]);
      setScheduledDate(null);
      setShowSchedule(false); // Close popover if open
      if (editorRef.current) editorRef.current.innerHTML = '';
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      {/* Modal Container - Matches strict design */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden relative">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {/* Back Arrow */}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-gray-800">Compose New Email</h2>
          </div>

          <div className="flex items-center space-x-4">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              onChange={handleFileChange}
            />
            {/* Attachment Icon */}
            <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            {/* Calendar Icon */}
            <button
              className={`text-gray-400 hover:text-gray-600 ${showSchedule || scheduledDate ? 'text-blue-500' : ''}`}
              onClick={() => setShowSchedule(!showSchedule)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            {/* Send/Schedule Button */}
            <button
              onClick={() => handleSubmit()}
              disabled={isSending}
              className={`px-6 py-1.5 bg-white border rounded text-sm font-medium transition-colors ${scheduledDate
                ? 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                : 'border-[#16A34A] text-[#16A34A] hover:bg-[#16A34A] hover:text-white'
                }`}
            >
              {isSending ? 'Process...' : (scheduledDate ? 'Schedule' : 'Send')}
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">

          {/* Fields */}
          <div className="space-y-4 mb-8">
            {/* From */}
            <div className="flex items-start">
              <label className={inputLabelClass}>From</label>
              <div className="bg-gray-100 px-3 py-1 rounded text-sm text-gray-700 font-medium flex items-center space-x-2">
                <span>{user?.email || 'user@example.com'}</span>
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* To */}
            <div className="flex items-center">
              <label className={inputLabelClass}>To</label>
              <input
                className={inputClass}
                placeholder="recipient@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            {/* Subject */}
            <div className="flex items-center">
              <label className={inputLabelClass}>Subject</label>
              <input
                className={inputClass}
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Scheduling Config */}
            <div className="flex items-center pt-2">
              <div className="flex items-center mr-8">
                <span className="text-sm text-gray-600 mr-3 font-medium">Delay between 2 emails</span>
                <input type="text" placeholder="00" className="w-12 border border-gray-300 rounded px-2 py-1 text-sm text-center" />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-3 font-medium">Hourly Limit</span>
                <input type="text" placeholder="00" className="w-12 border border-gray-300 rounded px-2 py-1 text-sm text-center" />
              </div>
            </div>
          </div>

          {/* Editor Area */}
          <div className="border-t border-gray-100 pt-6">
            <input
              className="w-full text-lg text-gray-400 placeholder-gray-300 outline-none mb-4"
              placeholder="Type Your Reply..."
              readOnly
            />

            {/* Functional Toolbar */}
            <div className="flex items-center space-x-4 mb-4 text-gray-400 border-b border-gray-100 pb-2 select-none">
              <button onClick={() => handleFormat('undo')} className="cursor-pointer hover:text-gray-600 focus:outline-none" title="Undo">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              </button>
              <button onClick={() => handleFormat('redo')} className="cursor-pointer hover:text-gray-600 focus:outline-none" title="Redo">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
              </button>
              <span className="h-4 w-px bg-gray-300 mx-2"></span>
              <button onClick={() => handleFormat('fontName', 'Serif')} className="cursor-pointer hover:text-gray-600 font-serif font-bold focus:outline-none" title="Serif">T</button>
              <button onClick={() => handleFormat('bold')} className="cursor-pointer hover:text-gray-600 font-bold focus:outline-none" title="Bold">B</button>
              <button onClick={() => handleFormat('italic')} className="cursor-pointer hover:text-gray-600 italic focus:outline-none" title="Italic">I</button>
              <button onClick={() => handleFormat('underline')} className="cursor-pointer hover:text-gray-600 underline focus:outline-none" title="Underline">U</button>
              <span className="h-4 w-px bg-gray-300 mx-2"></span>
              <button onClick={() => handleFormat('justifyLeft')} className="cursor-pointer hover:text-gray-600 focus:outline-none" title="Align Left">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>
              </button>

              <button onClick={handleLink} className="cursor-pointer hover:text-gray-600 focus:outline-none" title="Insert Link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /></svg>
              </button>
            </div>

            <div
              ref={editorRef}
              contentEditable
              className="w-full h-64 resize-none outline-none text-gray-700 overflow-y-auto"
              onInput={(e) => setBody(e.currentTarget.innerHTML)}
              style={{ minHeight: '16rem' }}
            />
          </div>

          {/* Attachment Previews */}
          {files.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments ({files.length})</h4>
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center bg-gray-50 border border-gray-200 rounded px-2 py-1">
                    <span className="text-xs text-gray-600 truncate max-w-[150px]">{file.name}</span>
                    <button onClick={() => removeFile(index)} className="ml-2 text-gray-400 hover:text-red-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {showSchedule && (
            <div className="absolute top-0 right-0 mt-0 bg-white rounded-lg shadow-2xl border border-gray-100 w-80 p-4 z-10" style={{ right: '2rem', top: '4rem' }}>
              <h3 className="text-md font-bold text-gray-800 mb-4">Send Later</h3>

              {/* Date/Time Picker */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Pick date & time</label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                  onChange={(e) => setScheduledDate(e.target.value ? new Date(e.target.value) : null)}
                  value={scheduledDate ? scheduledDate.toISOString().slice(0, 16) : ''}
                />
              </div>

              <div className="space-y-2 mb-4">
                <button
                  onClick={() => setScheduledDate(new Date(Date.now() + 86400000))} // +1 day
                  className="block w-full text-left text-sm text-gray-600 hover:bg-gray-50 px-2 py-1.5 rounded"
                >
                  Tomorrow
                </button>
                <button className="block w-full text-left text-sm text-gray-600 hover:bg-gray-50 px-2 py-1.5 rounded">Tomorrow, 10:00 AM</button>
                <button className="block w-full text-left text-sm text-gray-600 hover:bg-gray-50 px-2 py-1.5 rounded">Tomorrow, 11:00 AM</button>
                <button className="block w-full text-left text-sm text-gray-600 hover:bg-gray-50 px-2 py-1.5 rounded">Tomorrow, 3:00 PM</button>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setScheduledDate(null);
                    setShowSchedule(false);
                  }}
                  className="px-4 py-1.5 text-gray-500 text-sm font-medium hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSchedule(false)}
                  className="px-4 py-1.5 bg-[#16A34A] text-white text-sm font-medium rounded hover:bg-[#15803d]"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ComposeEmailModal;