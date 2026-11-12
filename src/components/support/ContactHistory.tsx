import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supportApi } from '../../api/support';

export const ContactHistory: React.FC<{ accountId: number }> = ({ accountId }) => {
  const [params, setParams] = useSearchParams();
  const selectedId = Number(params.get('message'));
  const [offset, setOffset] = useState(0);
  const list = useQuery({ queryKey: ['contact-messages', accountId, offset], queryFn: () => supportApi.getMessages(offset), refetchInterval: 30000 });
  const detail = useQuery({ queryKey: ['contact-message', accountId, selectedId], queryFn: () => supportApi.getMessage(selectedId), enabled: Number.isSafeInteger(selectedId) && selectedId > 0, refetchInterval: 30000 });
  return <section className="mt-8 rounded-2xl border border-slate-200 p-6 bg-white" aria-label="My support messages">
    <h2 className="text-xl font-semibold">My support messages</h2>
    <p className="mt-2 text-sm text-slate-600">Open an enquiry to read replies from our support team.</p>
    {list.isLoading && <p className="mt-4">Loading messages…</p>}
    {list.isError && <p role="alert" className="mt-4 text-red-700">Unable to load messages. <button className="underline" onClick={() => list.refetch()}>Retry</button></p>}
    {list.data?.items.length === 0 && <p className="mt-4 text-slate-500">You haven't sent any messages yet.</p>}
    <div className="mt-4 space-y-2">{list.data?.items.map(item => <button key={item.id} onClick={() => setParams({ message: String(item.id) })} className={`block w-full text-left border rounded-lg p-3 ${selectedId === item.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
      <span className="font-medium">{item.subject}</span><span className="block text-xs text-slate-500 mt-1">#{item.id} · {item.status.replace('_', ' ')} · {new Date(item.createdAt).toLocaleDateString()}</span>
    </button>)}</div>
    <div className="flex justify-between mt-4 text-sm"><button disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 20))} className="disabled:opacity-40">Previous</button><button disabled={!list.data || offset + 20 >= list.data.total} onClick={() => setOffset(offset + 20)} className="disabled:opacity-40">Next</button></div>
    {detail.isFetching && !detail.data && selectedId > 0 && <p className="mt-4">Loading conversation…</p>}
    {detail.isError && <p role="alert" className="mt-4 text-red-700">This message could not be loaded. <button onClick={() => detail.refetch()} className="underline">Retry</button></p>}
    {detail.data && <article className="mt-6 border-t pt-6 space-y-4">
      <h3 className="font-semibold text-lg">{detail.data.subject}</h3>
      <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-semibold mb-2">Your message</p><p className="whitespace-pre-wrap break-words text-sm">{detail.data.message}</p></div>
      {detail.data.replies?.map(reply => <div key={reply.id} className="rounded-lg bg-emerald-50 p-4"><p className="text-xs font-semibold mb-2">Lofix Support · {new Date(reply.createdAt).toLocaleString()}</p><p className="whitespace-pre-wrap break-words text-sm">{reply.body}</p></div>)}
      {!detail.data.replies?.length && <p className="text-sm text-slate-500">Waiting for a support reply.</p>}
    </article>}
  </section>;
};
