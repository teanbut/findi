// Admin console — feature spec §12: approval queues, category capacity
// view, order oversight, commission/payout runs, Feed It Forward ledger,
// Fundraising administration. Listing moderation and the dispute queue
// specifically are still TODO beyond this pass.
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import {
  adminPendingSuppliers,
  adminPendingCategoryRequests,
  adminApproveSupplier,
  adminApproveCategory,
  adminRevenue,
  adminOrders,
  adminCancelOrder,
  adminFeedItForwardLedger,
  adminDisburseFeedItForward,
  adminPendingFundraisingOrgs,
  adminApproveFundraisingOrg,
  adminMailAccounts,
  adminCreateMailAccount,
  adminDeleteMailAccount,
  adminMailInbox,
  adminMailMessage,
  adminSendMail,
  ApiError,
  type SupplierProfile,
  type AdminOrder,
  type FundraisingOrg,
  type MailAccount,
  type MailMessageSummary,
  type MailMessageDetail,
} from '../../../lib/api';

interface PendingCategoryRequest {
  supplierId: string;
  categoryId: string;
  supplier: SupplierProfile;
  category: { id: string; name: string };
}

export default function AdminConsolePage() {
  const { token, role } = useAuth();
  const [pendingSuppliers, setPendingSuppliers] = useState<SupplierProfile[]>([]);
  const [pendingCategories, setPendingCategories] = useState<PendingCategoryRequest[]>([]);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pendingOrgs, setPendingOrgs] = useState<FundraisingOrg[]>([]);
  const [ledger, setLedger] = useState<{ collected: number; disbursed: number; available: number } | null>(null);
  const [disburseRecipient, setDisburseRecipient] = useState('');
  const [disburseAmount, setDisburseAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [mailAccounts, setMailAccounts] = useState<MailAccount[]>([]);
  const [selectedMailbox, setSelectedMailbox] = useState<string | null>(null);
  const [inbox, setInbox] = useState<MailMessageSummary[]>([]);
  const [openMessage, setOpenMessage] = useState<MailMessageDetail | null>(null);
  const [newMailboxLocalPart, setNewMailboxLocalPart] = useState('');
  const [newMailboxDisplayName, setNewMailboxDisplayName] = useState('');
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeText, setComposeText] = useState('');

  async function refresh() {
    try {
      const [suppliers, categories] = await Promise.all([adminPendingSuppliers(), adminPendingCategoryRequests()]);
      setPendingSuppliers(suppliers);
      setPendingCategories(categories as PendingCategoryRequest[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the approval queues.');
    }

    adminOrders().then(setOrders).catch(() => setOrders([]));
    adminFeedItForwardLedger().then(setLedger).catch(() => setLedger(null));
    adminPendingFundraisingOrgs().then(setPendingOrgs).catch(() => setPendingOrgs([]));
    adminMailAccounts().then(setMailAccounts).catch(() => setMailAccounts([]));

    // Last 30 days, purely illustrative window for this pass.
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    adminRevenue(from, to)
      .then((r) => setRevenue(r.findiCommissionRevenue))
      .catch(() => setRevenue(null));
  }

  async function handleCancelOrder(id: string) {
    const reason = window.prompt('Reason for cancelling this order?');
    if (!reason) return;
    setBusyId(id);
    try {
      await adminCancelOrder(id, reason);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not cancel this order.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDisburse(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminDisburseFeedItForward(disburseRecipient, Number(disburseAmount), 'admin');
      setDisburseRecipient('');
      setDisburseAmount('');
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not record this disbursement.');
    }
  }

  async function handleApproveOrg(orgId: string) {
    setBusyId(orgId);
    try {
      await adminApproveFundraisingOrg(orgId);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve this organisation.');
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    if (token && role === 'admin') refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role]);

  async function handleSelectMailbox(id: string) {
    setSelectedMailbox(id);
    setOpenMessage(null);
    try {
      setInbox(await adminMailInbox(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load this inbox.');
      setInbox([]);
    }
  }

  async function handleOpenMessage(uid: number) {
    if (!selectedMailbox) return;
    try {
      setOpenMessage(await adminMailMessage(selectedMailbox, uid));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not open this message.');
    }
  }

  async function handleCreateMailbox(e: React.FormEvent) {
    e.preventDefault();
    setBusyId('new-mailbox');
    try {
      await adminCreateMailAccount(newMailboxLocalPart, newMailboxDisplayName || undefined);
      setNewMailboxLocalPart('');
      setNewMailboxDisplayName('');
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create this mailbox.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteMailbox(id: string, address: string) {
    if (!window.confirm(`Delete ${address}? This removes the mailbox from cPanel too.`)) return;
    setBusyId(id);
    try {
      await adminDeleteMailAccount(id);
      if (selectedMailbox === id) {
        setSelectedMailbox(null);
        setInbox([]);
        setOpenMessage(null);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this mailbox.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleSendMail(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMailbox) return;
    setBusyId('compose');
    try {
      await adminSendMail(selectedMailbox, composeTo, composeSubject, composeText);
      setComposeTo('');
      setComposeSubject('');
      setComposeText('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send this message.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleApproveSupplier(id: string) {
    setBusyId(id);
    try {
      await adminApproveSupplier(id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve this supplier.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleApproveCategory(supplierId: string, categoryId: string) {
    const key = `${supplierId}:${categoryId}`;
    setBusyId(key);
    try {
      await adminApproveCategory(supplierId, categoryId);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve this category.');
    } finally {
      setBusyId(null);
    }
  }

  if (!token || role !== 'admin') {
    return (
      <main>
        <h1>Findi Admin</h1>
        <p>Admin access only.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Findi Admin</h1>
      {error ? <p role="alert">{error}</p> : null}

      <section aria-label="Revenue">
        <h2>Findi commission, last 30 days</h2>
        <p>{revenue === null ? 'Loading…' : `R${revenue.toFixed(2)}`}</p>
      </section>

      <section aria-label="Pending suppliers">
        <h2>Pending supplier applications</h2>
        {pendingSuppliers.length === 0 ? (
          <p>Nothing waiting.</p>
        ) : (
          <ul>
            {pendingSuppliers.map((s) => (
              <li key={s.id}>
                {s.businessName} — {s.tier}
                <button type="button" disabled={busyId === s.id} onClick={() => handleApproveSupplier(s.id)}>
                  {busyId === s.id ? 'Approving…' : 'Approve profile'}
                </button>
                {/* Approving the profile does NOT approve any category —
                    feature spec §5.3: "not free to list anything." Each
                    category below still needs its own approval. */}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Pending category requests">
        <h2>Pending category requests</h2>
        <p>
          Approve here only once you've checked category capacity (feature spec §4.3/§4.5 — does this category
          already have enough quality suppliers?). That check isn't automated in this pass; it's a judgement call
          for now.
        </p>
        {pendingCategories.length === 0 ? (
          <p>Nothing waiting.</p>
        ) : (
          <ul>
            {pendingCategories.map((req) => {
              const key = `${req.supplierId}:${req.categoryId}`;
              return (
                <li key={key}>
                  {req.supplier?.businessName ?? req.supplierId} — {req.category.name}
                  <button
                    type="button"
                    disabled={busyId === key}
                    onClick={() => handleApproveCategory(req.supplierId, req.categoryId)}
                  >
                    {busyId === key ? 'Approving…' : 'Approve category'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-label="Orders">
        <h2>Recent orders</h2>
        {orders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <ul>
            {orders.map((o) => (
              <li key={o.id}>
                #{o.id.slice(0, 8)} — {o.status} — R{o.total}
                {o.fundraisingOrg ? ` — supporting ${o.fundraisingOrg.name}` : ''}
                <ul>
                  {o.items.map((item) => (
                    <li key={item.id}>
                      {item.listing.title} × {item.quantity} — {item.collectionStatus}
                    </li>
                  ))}
                </ul>
                {o.status !== 'cancelled' && (
                  <button type="button" disabled={busyId === o.id} onClick={() => handleCancelOrder(o.id)}>
                    {busyId === o.id ? 'Cancelling…' : 'Cancel order'}
                  </button>
                )}
                {/* NOTE: cancelling here marks the order cancelled and logs
                    it — it does not reverse payment splits or trigger a
                    real refund yet, since that needs the payment gateway
                    (feature spec §18 #2). */}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Feed It Forward ledger">
        <h2>Feed It Forward ledger</h2>
        {ledger ? (
          <p>
            Collected: R{ledger.collected.toFixed(2)} · Disbursed: R{ledger.disbursed.toFixed(2)} · Available: R
            {ledger.available.toFixed(2)}
          </p>
        ) : (
          <p>Loading…</p>
        )}
        <p>
          This is tracked entirely separately from Findi commission revenue above (feature spec §6.4) — never
          combined into one figure.
        </p>
        <form onSubmit={handleDisburse}>
          <label>
            Recipient
            <input required value={disburseRecipient} onChange={(e) => setDisburseRecipient(e.target.value)} />
          </label>
          <label>
            Amount (R)
            <input required type="number" min={0.01} step="0.01" value={disburseAmount} onChange={(e) => setDisburseAmount(e.target.value)} />
          </label>
          <button type="submit">Record disbursement</button>
        </form>
      </section>

      <section aria-label="Pending fundraising organisations">
        <h2>Pending fundraising organisations</h2>
        {pendingOrgs.length === 0 ? (
          <p>Nothing waiting.</p>
        ) : (
          <ul>
            {pendingOrgs.map((org) => (
              <li key={org.id}>
                {org.name} — {org.type} — code {org.code}
                <button type="button" disabled={busyId === org.id} onClick={() => handleApproveOrg(org.id)}>
                  {busyId === org.id ? 'Approving…' : 'Approve'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Findi email">
        <h2>Findi email</h2>
        <p>
          Mailboxes hosted on domains.co.za (cPanel). Creating one here also creates it on the host; deleting one
          here removes it there too.
        </p>

        <form onSubmit={handleCreateMailbox}>
          <label>
            New mailbox local part
            <input
              required
              placeholder="e.g. support"
              pattern="[a-z0-9._-]+"
              value={newMailboxLocalPart}
              onChange={(e) => setNewMailboxLocalPart(e.target.value)}
            />
          </label>
          <span>@findi.co.za</span>
          <label>
            Display name (optional)
            <input value={newMailboxDisplayName} onChange={(e) => setNewMailboxDisplayName(e.target.value)} />
          </label>
          <button type="submit" disabled={busyId === 'new-mailbox'}>
            {busyId === 'new-mailbox' ? 'Creating…' : 'Create mailbox'}
          </button>
        </form>

        {mailAccounts.length === 0 ? (
          <p>No mailboxes yet.</p>
        ) : (
          <ul>
            {mailAccounts.map((account) => (
              <li key={account.id}>
                <button type="button" onClick={() => handleSelectMailbox(account.id)}>
                  {account.address} {account.displayName ? `(${account.displayName})` : ''}
                </button>
                <button type="button" disabled={busyId === account.id} onClick={() => handleDeleteMailbox(account.id, account.address)}>
                  {busyId === account.id ? 'Deleting…' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        )}

        {selectedMailbox ? (
          <>
            <h3>Inbox</h3>
            {inbox.length === 0 ? (
              <p>No messages.</p>
            ) : (
              <ul>
                {inbox.map((msg) => (
                  <li key={msg.uid}>
                    <button type="button" onClick={() => handleOpenMessage(msg.uid)}>
                      {msg.seen ? '' : '● '}
                      {msg.from} — {msg.subject} — {new Date(msg.date).toLocaleString()}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {openMessage ? (
              <article>
                <p>
                  <strong>From:</strong> {openMessage.from} <br />
                  <strong>To:</strong> {openMessage.to} <br />
                  <strong>Subject:</strong> {openMessage.subject} <br />
                  <strong>Date:</strong> {new Date(openMessage.date).toLocaleString()}
                </p>
                <p style={{ whiteSpace: 'pre-wrap' }}>{openMessage.text}</p>
              </article>
            ) : null}

            <h3>Compose</h3>
            <form onSubmit={handleSendMail}>
              <label>
                To
                <input required type="email" value={composeTo} onChange={(e) => setComposeTo(e.target.value)} />
              </label>
              <label>
                Subject
                <input required value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} />
              </label>
              <label>
                Message
                <textarea required value={composeText} onChange={(e) => setComposeText(e.target.value)} />
              </label>
              <button type="submit" disabled={busyId === 'compose'}>
                {busyId === 'compose' ? 'Sending…' : 'Send'}
              </button>
            </form>
          </>
        ) : null}
      </section>

      {/* TODO: listing moderation, dispute queue (feature spec §12) */}
    </main>
  );
}
