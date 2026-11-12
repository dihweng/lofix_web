import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, X } from 'lucide-react';
import { supportApi } from '../../api/support';

export const NotificationBell: React.FC<{ accountId: number }> = ({ accountId }) => {
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['notifications', accountId, offset], queryFn: () => supportApi.getNotifications(offset), refetchInterval: 30000, refetchIntervalInBackground: false });
  const markRead = useMutation({ mutationFn: (id: number) => supportApi.markNotificationRead(id), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications', accountId] }) });
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, [open]);
  const unread = query.data?.unreadCount || 0;
  return <div ref={container} className="relative ml-auto mr-3">
    <button type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} aria-controls="notification-panel" onClick={() => setOpen(!open)} className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100">
      <Bell className="w-5 h-5" />
      {unread > 0 && <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
    </button>
    {open && <section id="notification-panel" aria-label="Notifications" className="fixed right-4 left-4 top-20 sm:absolute sm:left-auto sm:top-full sm:right-0 sm:w-96 mt-2 rounded-xl border border-slate-200 bg-white shadow-xl z-50">
      <div className="flex justify-between items-center p-4 border-b"><h2 className="font-semibold">Notifications</h2><button aria-label="Close notifications" onClick={() => setOpen(false)}><X className="w-4 h-4" /></button></div>
      <div className="max-h-96 overflow-y-auto p-3 space-y-2">
        {query.isLoading && <p className="p-2 text-sm">Loading notifications…</p>}
        {query.isError && <div role="alert" className="text-sm text-red-700">Unable to load notifications. <button onClick={() => query.refetch()} className="underline">Retry</button></div>}
        {markRead.isError && <p role="alert" className="text-sm text-red-700">Could not mark this notification as read. Please try again.</p>}
        {query.data?.items.length === 0 && <p className="p-2 text-sm text-slate-500">No notifications yet. Support replies will appear here.</p>}
        {query.data?.items.map(item => <div key={item.id} className={`p-3 rounded-lg ${item.readAt ? 'bg-slate-50' : 'bg-emerald-50'}`}>
          <Link to={`/contact?message=${item.messageId}`} onClick={() => setOpen(false)} className="block text-sm font-semibold text-slate-900">{item.title}</Link>
          <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
          {!item.readAt && <button disabled={markRead.isPending} onClick={() => markRead.mutate(item.id)} className="mt-2 text-xs text-emerald-700 underline disabled:opacity-50">Mark as read</button>}
        </div>)}
      </div>
      <div className="flex justify-between border-t p-3 text-sm">
        <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))} className="disabled:opacity-40">Newer</button>
        <button disabled={!query.data || offset + 20 >= query.data.total} onClick={() => setOffset(offset + 20)} className="disabled:opacity-40">Older</button>
      </div>
    </section>}
  </div>;
};
