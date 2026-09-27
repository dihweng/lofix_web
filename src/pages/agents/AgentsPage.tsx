import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsApi, CleaningAgent } from '../../api/agents';
import { authApi, Account, CreateAccountPayload } from '../../api/auth';
import { PageLayout } from '../../components/layout/PageLayout';
import { Table, Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { ToastContainer, ToastMessage } from '../../components/common/Toast';
import { UserPlus, ShieldCheck, UserCheck, AlertOctagon, Info, Home, Wrench, Plus, User } from 'lucide-react';

export const AgentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'house_agents' | 'cleaning_agents'>('house_agents');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Register New Agent Account Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regTitle, setRegTitle] = useState('Mr');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [autoEnrollCleaner, setAutoEnrollCleaner] = useState(true);

  // Enroll Cleaner Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');

  // Verification Modal State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [targetAgent, setTargetAgent] = useState<CleaningAgent | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [agentStatus, setAgentStatus] = useState<'AVAILABLE' | 'OFFLINE' | 'SUSPENDED'>('AVAILABLE');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const queryClient = useQueryClient();

  // Load cleaning agent profiles
  const { data: agentProfiles = [], isLoading: isProfilesLoading } = useQuery({
    queryKey: ['admin-agents', limit, offset],
    queryFn: () => agentsApi.getAgents(limit, offset),
  });

  // Load all system accounts
  const { data: accounts = [], isLoading: isAccountsLoading } = useQuery({
    queryKey: ['admin-accounts-all'],
    queryFn: () => authApi.getAccounts(),
  });

  // Filter system accounts with role === 'Agent'
  const houseRentalAgents = accounts.filter((acc) => acc.role === 'Agent');

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const openRegisterModal = () => {
    setRegTitle('Mr');
    setRegFirstName('');
    setRegLastName('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setRegConfirmPassword('');
    setAutoEnrollCleaner(true);
    setIsRegisterModalOpen(true);
  };

  const openEnrollModalForAccount = (accId?: number) => {
    setSelectedAccountId(accId || (houseRentalAgents.length > 0 ? houseRentalAgents[0].id : ''));
    setIsEnrollModalOpen(true);
  };

  const openVerifyModal = (agent: CleaningAgent) => {
    setTargetAgent(agent);
    setIsVerified(agent.verified);
    setAgentStatus(agent.status);
    setIsVerifyModalOpen(true);
  };

  // Register New Agent Account Mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (regPassword !== regConfirmPassword) {
        throw new Error('Passwords do not match');
      }
      const payload: CreateAccountPayload = {
        title: regTitle,
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        email: regEmail.trim(),
        phoneNumber: regPhone.trim(),
        password: regPassword,
        confirmPassword: regConfirmPassword,
        role: 'Agent',
      };

      const newAccount = await authApi.createAccount(payload);

      if (autoEnrollCleaner && newAccount.id) {
        await agentsApi.createAgentProfile(newAccount.id);
      }

      return newAccount;
    },
    onSuccess: (newAccount) => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts-all'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      addToast(
        'success',
        `Registered Agent Account #${newAccount.id} (${newAccount.firstName} ${newAccount.lastName}) ${
          autoEnrollCleaner ? 'and enrolled as Cleaner' : ''
        }`
      );
      setIsRegisterModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to register agent account');
      addToast('error', msg);
    },
  });

  // Enroll Mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAccountId) throw new Error('Select an account to enroll');
      return agentsApi.createAgentProfile(Number(selectedAccountId));
    },
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      addToast('success', `Enrolled account #${selectedAccountId} as Cleaning Agent Profile #${newProfile.id}`);
      setIsEnrollModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to enroll cleaner profile';
      addToast('error', msg);
    },
  });

  // Verification & Status Mutation
  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!targetAgent) return;
      return agentsApi.verifyAgent(targetAgent.id, {
        verified: isVerified,
        status: agentStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      addToast('success', `Cleaning Agent Profile #${targetAgent?.id} status updated`);
      setIsVerifyModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update cleaning agent status';
      addToast('error', msg);
    },
  });

  // TAB 1: House / Rental Agents Columns
  const houseAgentColumns: Column<Account>[] = [
    {
      header: 'Account ID',
      cell: (acc) => (
        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">
          Account #{acc.id}
        </span>
      ),
    },
    {
      header: 'Agent Name & Email',
      cell: (acc) => (
        <div>
          <div className="font-semibold text-slate-900">
            {acc.firstName} {acc.lastName}
          </div>
          <div className="text-xs text-slate-500 font-mono">{acc.email}</div>
        </div>
      ),
    },
    {
      header: 'Base Role',
      cell: (acc) => <Badge variant="info">{acc.role}</Badge>,
    },
    {
      header: 'Cleaning Profile Enrolled',
      cell: (acc) => {
        const enrolledProfile = agentProfiles.find((p) => p.accountId === acc.id);
        if (enrolledProfile) {
          return (
            <Badge variant={enrolledProfile.verified ? 'success' : 'warning'}>
              Enrolled (Profile #{enrolledProfile.id})
            </Badge>
          );
        }
        return <Badge variant="neutral">Rental Only</Badge>;
      },
    },
    {
      header: 'Actions',
      cell: (acc) => {
        const isAlreadyEnrolled = agentProfiles.some((p) => p.accountId === acc.id);
        return (
          <Button
            variant={isAlreadyEnrolled ? 'outline' : 'primary'}
            size="sm"
            onClick={() => openEnrollModalForAccount(acc.id)}
            disabled={isAlreadyEnrolled}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            {isAlreadyEnrolled ? 'Enrolled as Cleaner' : 'Enroll as Cleaner'}
          </Button>
        );
      },
    },
  ];

  // TAB 2: Cleaning Agents Columns
  const cleaningAgentColumns: Column<CleaningAgent>[] = [
    {
      header: 'Profile ID',
      cell: (agent) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200 text-xs">
          Profile #{agent.id}
        </span>
      ),
    },
    {
      header: 'Linked Account',
      cell: (agent) => {
        const acc = accounts.find((a) => a.id === agent.accountId);
        return (
          <div>
            <div className="font-semibold text-slate-900">
              {acc ? `${acc.firstName} ${acc.lastName}` : `Account #${agent.accountId}`}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Account ID: {agent.accountId} • {acc?.email || 'N/A'}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Verification Status',
      cell: (agent) => (
        <Badge variant={agent.verified ? 'success' : 'warning'}>
          {agent.verified ? 'Verified' : 'Unverified'}
        </Badge>
      ),
    },
    {
      header: 'Availability State',
      cell: (agent) => {
        const variants = {
          AVAILABLE: 'success' as const,
          OFFLINE: 'neutral' as const,
          SUSPENDED: 'danger' as const,
        };
        return <Badge variant={variants[agent.status]}>{agent.status}</Badge>;
      },
    },
    {
      header: 'Actions',
      cell: (agent) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openVerifyModal(agent)}
          leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
        >
          Verify / Suspend
        </Button>
      ),
    },
  ];

  return (
    <PageLayout
      title="Agent Directory & Management"
      subtitle="Register new agent accounts, view directory, and manage cleaning dispatch profiles"
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={openRegisterModal}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Register Agent Account
          </Button>
          <Button
            variant="outline"
            onClick={() => openEnrollModalForAccount()}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Enroll as Cleaner
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Toggle Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('house_agents')}
            className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'house_agents'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>House & Rental Agents ({houseRentalAgents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cleaning_agents')}
            className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'cleaning_agents'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Cleaning Agents / Cleaners ({agentProfiles.length})</span>
          </button>
        </div>

        {/* Directory Info Callout */}
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Registering & Managing Agents</p>
            <p className="mt-0.5 text-purple-800">
              Use <code className="bg-purple-100 px-1 rounded font-bold">Register Agent Account</code> to create a new system Account with <code className="bg-purple-100 px-1 rounded font-bold">role = 'Agent'</code>.
              Then enroll them as a Cleaner to generate a dedicated <code className="bg-purple-100 px-1 rounded font-bold">Agent Profile ID</code> for cleaning job dispatch.
            </p>
          </div>
        </div>

        {/* TAB 1: HOUSE / RENTAL AGENTS */}
        {activeTab === 'house_agents' && (
          <Table
            columns={houseAgentColumns}
            data={houseRentalAgents}
            isLoading={isAccountsLoading}
            keyExtractor={(acc) => acc.id}
            emptyMessage="No accounts with the Agent role found. Click 'Register Agent Account' above to create one."
          />
        )}

        {/* TAB 2: CLEANING AGENTS */}
        {activeTab === 'cleaning_agents' && (
          <>
            <Table
              columns={cleaningAgentColumns}
              data={agentProfiles}
              isLoading={isProfilesLoading}
              keyExtractor={(agent) => agent.id}
              emptyMessage="No enrolled cleaning agent profiles found."
            />

            <Pagination
              offset={offset}
              limit={limit}
              totalCountOnPage={agentProfiles.length}
              onOffsetChange={setOffset}
            />
          </>
        )}
      </div>

      {/* Register New Agent Account Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register New Agent System Account"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            registerMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Title"
              value={regTitle}
              onChange={(e) => setRegTitle(e.target.value)}
              options={[
                { value: 'Mr', label: 'Mr' },
                { value: 'Mrs', label: 'Mrs' },
                { value: 'Ms', label: 'Ms' },
                { value: 'Dr', label: 'Dr' },
              ]}
              required
            />
            <div className="col-span-2">
              <Input
                label="First Name"
                value={regFirstName}
                onChange={(e) => setRegFirstName(e.target.value)}
                placeholder="e.g. John"
                required
              />
            </div>
          </div>

          <Input
            label="Last Name"
            value={regLastName}
            onChange={(e) => setRegLastName(e.target.value)}
            placeholder="e.g. Doe"
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            placeholder="john.agent@lofix.com"
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            value={regPhone}
            onChange={(e) => setRegPhone(e.target.value)}
            placeholder="08012345678"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Password"
              type="password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-enroll"
              checked={autoEnrollCleaner}
              onChange={(e) => setAutoEnrollCleaner(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
            />
            <label htmlFor="auto-enroll" className="font-semibold text-purple-900 cursor-pointer">
              Automatically enroll as Cleaning Agent after account registration
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRegisterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-purple-600 hover:bg-purple-700"
              isLoading={registerMutation.isPending}
            >
              Register Agent Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Enroll Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Enroll Account as Cleaner"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enrollMutation.mutate();
          }}
          className="space-y-4"
        >
          {houseRentalAgents.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>No user accounts with the "Agent" role were found. Register an agent account first.</span>
            </div>
          ) : (
            <Select
              label="Select Agent Account to Enroll"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              options={houseRentalAgents.map((acc) => {
                const isAlreadyEnrolled = agentProfiles.some((p) => p.accountId === acc.id);
                return {
                  value: acc.id,
                  label: `Account #${acc.id} — ${acc.firstName} ${acc.lastName} (${acc.email}) ${
                    isAlreadyEnrolled ? '— Already Enrolled' : ''
                  }`,
                };
              })}
              placeholder="Choose account..."
              required
            />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEnrollModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={houseRentalAgents.length === 0 || !selectedAccountId}
              isLoading={enrollMutation.isPending}
            >
              Confirm Cleaner Enrollment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Verification & Status Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title={`Verify / Suspend Cleaning Agent Profile #${targetAgent?.id}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyMutation.mutate();
          }}
          className="space-y-5"
        >
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <p className="font-semibold text-slate-800">
              Cleaning Agent Profile ID: <span className="font-mono text-emerald-700">#{targetAgent?.id}</span>
            </p>
            <p className="text-slate-600">
              Linked Account ID: <span className="font-mono">#{targetAgent?.accountId}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Verification Approval
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="verified"
                  checked={isVerified}
                  onChange={() => setIsVerified(true)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">Verified (true)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="verified"
                  checked={!isVerified}
                  onChange={() => setIsVerified(false)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">Unverified (false)</span>
              </label>
            </div>
          </div>

          <Select
            label="Availability / Suspension Status"
            value={agentStatus}
            onChange={(e) =>
              setAgentStatus(e.target.value as 'AVAILABLE' | 'OFFLINE' | 'SUSPENDED')
            }
            options={[
              { value: 'AVAILABLE', label: 'AVAILABLE (Ready for job assignment)' },
              { value: 'OFFLINE', label: 'OFFLINE (Temporarily unavailable)' },
              { value: 'SUSPENDED', label: 'SUSPENDED (Disabled from assignments)' },
            ]}
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsVerifyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={verifyMutation.isPending}
            >
              Update Status
            </Button>
          </div>
        </form>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </PageLayout>
  );
};
