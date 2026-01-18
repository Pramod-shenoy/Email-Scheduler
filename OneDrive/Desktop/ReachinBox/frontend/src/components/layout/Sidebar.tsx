import React from 'react';
import { useAuthStore } from '../../stores/authStore';

interface SidebarProps {
    onCompose: () => void;
    activeView: 'inbox' | 'scheduled' | 'sent';
    onNavigate: (view: 'inbox' | 'scheduled' | 'sent') => void;
    scheduledCount: number;
    sentCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({
    onCompose,
    activeView,
    onNavigate,
    scheduledCount,
    sentCount
}) => {
    const { logout, user } = useAuthStore();

    return (
        <div className="h-screen w-64 bg-white border-r border-gray-100 flex flex-col p-4 fixed left-0 top-0 z-50">
            {/* Logo */}
            <div className="mb-6 px-2">
                <h1 className="text-xl font-bold tracking-tight">Emails</h1>
            </div>

            {/* User Profile */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-300 overflow-hidden">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                            alt="User"
                        />
                    </div>
                    <div className="flex-1 min-w-0 max-w-[100px]">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || 'email@example.com'}</p>
                    </div>
                </div>
                <button onClick={logout} className="text-gray-400 hover:text-red-500" title="Logout">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>

            {/* Compose Button */}
            <button
                onClick={onCompose}
                className="mb-8 w-full py-2.5 px-4 bg-white border border-[#16A34A] text-[#16A34A] hover:bg-[#16A34A] hover:text-white rounded-full font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
            >
                <span>Compose</span>
            </button>

            <div className="space-y-1">
                <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Core
                </div>

                <NavItem
                    active={activeView === 'inbox'}
                    onClick={() => onNavigate('inbox')}
                    label="Inbox"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    }
                />

                <NavItem
                    active={activeView === 'scheduled'}
                    onClick={() => onNavigate('scheduled')}
                    label="Scheduled"
                    count={scheduledCount}
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />

                <NavItem
                    active={activeView === 'sent'}
                    onClick={() => onNavigate('sent')}
                    label="Sent"
                    count={sentCount}
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    }
                />
            </div>
        </div>
    );
};

const NavItem = ({ active, onClick, icon, label, count }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, count?: number }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors duration-200 group ${active ? 'bg-[#E9F3EE] text-[#16A34A]' : 'text-gray-600 hover:bg-gray-50'
            }`}
    >
        <div className="flex items-center space-x-3">
            <span className={active ? 'text-[#16A34A]' : 'text-gray-400 group-hover:text-gray-500'}>
                {icon}
            </span>
            <span className="text-sm font-medium">{label}</span>
        </div>
        {count !== undefined && (
            <span className={`text-xs ${active ? 'text-[#16A34A]' : 'text-gray-400'}`}>
                {count}
            </span>
        )}
    </button>
);

export default Sidebar;
