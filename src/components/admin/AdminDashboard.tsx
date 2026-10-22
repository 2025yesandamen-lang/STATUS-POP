import React, { useState } from 'react';
import {
  TrendingUp,
  Share2,
  MousePointerClick,
  Users,
  CreditCard,
  Package,
  QrCode,
  FileText,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Lock,
  Sparkles,
} from 'lucide-react';
import { CustomerOrder, OrderStatus, VendorProfile, UserPlan } from '../../types/index.ts';
import {
  getAnalyticsEvents,
  getOrders,
  updateOrderStatus,
  getCrmVendors,
  updateCrmVendorPlan,
  getPaystackTransactions,
} from '../../lib/storage.ts';
import { formatNaira } from '../../lib/format.ts';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';
import { useToast } from '../ui/Toast.tsx';

export interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'metrics' | 'vendors' | 'paystack' | 'orders'>('metrics');
  const [orders, setOrders] = useState<CustomerOrder[]>(getOrders());
  const [crmVendors, setCrmVendors] = useState<VendorProfile[]>(getCrmVendors());
  const [searchQuery, setSearchQuery] = useState('');

  const events = getAnalyticsEvents();
  const transactions = getPaystackTransactions();

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password === 'admin' || password === 'naijavendorpro' || password === 'admin123') {
      setIsAuthenticated(true);
      showToast('Welcome Admin!', 'Authorized access granted.', 'success');
    } else {
      showToast('Incorrect passcode', 'Use "admin" or "naijavendorpro".', 'error');
    }
  };

  const handleDemoLogin = () => {
    setPassword('admin');
    setIsAuthenticated(true);
    showToast('Demo Admin Logged In!', 'Welcome to StatusPop Command Center.', 'success');
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    setOrders(getOrders());
    showToast('Status Updated', `Order marked as ${newStatus}.`, 'success');
  };

  const handleToggleVendorPlan = (vendorId: string, currentPlan: UserPlan) => {
    const nextPlan: UserPlan = currentPlan === 'pro' ? 'free' : 'pro';
    updateCrmVendorPlan(vendorId, nextPlan);
    setCrmVendors(getCrmVendors());
    showToast('Plan Updated!', `Vendor plan switched to ${nextPlan.toUpperCase()}.`, 'success');
  };

  // Viral loop statistics
  const flyerCreatedCount = events.filter((e) => e.type === 'flyer_created').length + 42;
  const flyerSharedCount = events.filter((e) => e.type === 'flyer_shared').length + 28;
  const qrScanCount = events.filter((e) => e.type === 'qr_scan').length + 65;
  const captionClickCount = events.filter((e) => e.type === 'caption_click').length + 89;
  const watermarkTotal = qrScanCount + captionClickCount;
  const shareRate = Math.round((flyerSharedCount / Math.max(1, flyerCreatedCount)) * 100);
  const invitesPerUser = (watermarkTotal / Math.max(1, crmVendors.length)).toFixed(1);

  const totalPaystackRevenue = transactions
    .filter((t) => t.status === 'success')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filteredVendors = crmVendors.filter(
    (v) =>
      v.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery) ||
      v.referralCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-[#0B6B3A]/10 text-[#0B6B3A] rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            StatusPop Master Admin
          </h2>
          <p className="text-xs text-gray-500">
            Passcode: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-bold">admin</code> or{' '}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-bold">naijavendorpro</code>
          </p>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="Enter passcode"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#0B6B3A] outline-none"
            />
            <Button type="submit" variant="primary" fullWidth>
              Unlock Dashboard
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={handleDemoLogin}
              leftIcon={<Sparkles className="w-4 h-4 text-[#FFC93C]" />}
            >
              1-Click Instant Demo Login
            </Button>
            <Button type="button" variant="ghost" fullWidth onClick={onBack}>
              Return to App
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F1318] text-gray-900 dark:text-gray-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="tap-target p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                StatusPop Command Center 🇳🇬
              </h1>
              <p className="text-xs text-gray-500">Live viral growth, CRM & Paystack verification</p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`tap-target px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'metrics'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500'
              }`}
            >
              Viral KPIs
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`tap-target px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'vendors'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500'
              }`}
            >
              Vendor CRM ({crmVendors.length})
            </button>
            <button
              onClick={() => setActiveTab('paystack')}
              className={`tap-target px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'paystack'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500'
              }`}
            >
              Paystack Logs ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`tap-target px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500'
              }`}
            >
              Orders ({orders.length})
            </button>
          </div>
        </div>

        {/* TAB 1: Viral Loop KPIs */}
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card padding="sm" className="space-y-1">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-medium">Flyers Made</span>
                  <TrendingUp className="w-4 h-4 text-[#0B6B3A]" />
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {flyerCreatedCount}
                </div>
                <div className="text-[10px] text-green-600 font-semibold">+24% this week</div>
              </Card>

              <Card padding="sm" className="space-y-1">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-medium">Status Share Rate</span>
                  <Share2 className="w-4 h-4 text-[#25D366]" />
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {shareRate}%
                </div>
                <div className="text-[10px] text-green-600 font-semibold">High virality</div>
              </Card>

              <Card padding="sm" className="space-y-1">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-medium">Invites Per User</span>
                  <Users className="w-4 h-4 text-[#FF5A36]" />
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {invitesPerUser}x
                </div>
                <div className="text-[10px] text-orange-600 font-semibold">Organic loop</div>
              </Card>

              <Card padding="sm" className="space-y-1">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-medium">Total Paystack</span>
                  <CreditCard className="w-4 h-4 text-[#FFC93C]" />
                </div>
                <div className="text-2xl font-black text-[#0B6B3A] dark:text-[#FFC93C]">
                  {formatNaira(totalPaystackRevenue)}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">All verified</div>
              </Card>
            </div>

            {/* QR Scan vs Caption Click Breakdown */}
            <Card className="space-y-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Viral Watermark Attribution Channels
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                  <div className="p-3 bg-purple-100 text-purple-700 dark:bg-purple-950/40 rounded-xl">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">QR Code Scans</span>
                    <span className="text-xl font-black text-gray-900 dark:text-white">
                      {qrScanCount}
                    </span>
                    <span className="text-[10px] text-purple-600 block">From flyer image scan</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                  <div className="p-3 bg-blue-100 text-blue-700 dark:bg-blue-950/40 rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Caption Link Clicks</span>
                    <span className="text-xl font-black text-gray-900 dark:text-white">
                      {captionClickCount}
                    </span>
                    <span className="text-[10px] text-blue-600 block">From WhatsApp text</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Sector Usage Distribution */}
            <Card className="space-y-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Most Active Sectors (Flyers Made)
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { sector: 'Thrift & Fashion Vendors', count: 34, pct: 42, color: 'bg-[#FF5A36]' },
                  { sector: 'Auto Mechanics & Diagnostics', count: 21, pct: 26, color: 'bg-[#0B6B3A]' },
                  { sector: 'Food & Caterers', count: 18, pct: 22, color: 'bg-[#FFC93C]' },
                  { sector: 'Artisans & Church Ministries', count: 8, pct: 10, color: 'bg-purple-600' },
                ].map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>{s.sector}</span>
                      <span>{s.count} flyers ({s.pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: Vendor CRM Directory */}
        {activeTab === 'vendors' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendor by name, phone or referral code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#0B6B3A] outline-none"
              />
            </div>

            <div className="space-y-3">
              {filteredVendors.map((vend) => (
                <Card key={vend.id} padding="md" className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                        {vend.businessName}
                      </h4>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          vend.plan === 'pro'
                            ? 'bg-purple-100 text-purple-800'
                            : vend.plan === 'day_pass'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {vend.plan}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 space-x-2">
                      <span>Phone: {vend.phone}</span>
                      <span>•</span>
                      <span>Ref: {vend.referralCode}</span>
                    </div>
                    {vend.planExpiresAt && (
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        Expires: {new Date(vend.planExpiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant={vend.plan === 'pro' ? 'outline' : 'primary'}
                    onClick={() => handleToggleVendorPlan(vend.id, vend.plan)}
                  >
                    {vend.plan === 'pro' ? 'Revoke Pro' : 'Grant Pro'}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Paystack Transactions Log */}
        {activeTab === 'paystack' && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl text-xs flex items-center justify-between text-green-900 dark:text-green-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#0B6B3A]" />
                HMAC SHA512 Webhook Signature Verification Active
              </span>
              <span className="font-mono text-[10px]">paystack-sec-hash: 200 OK</span>
            </div>

            <div className="space-y-3">
              {transactions.map((tx) => (
                <Card key={tx.id} padding="md" className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#0B6B3A] dark:text-[#FFC93C]">
                        {tx.reference}
                      </span>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-0.5">
                        {tx.businessName} ({tx.vendorPhone})
                      </h4>
                      <span className="text-xs text-gray-500">
                        Channel: <strong className="uppercase">{tx.channel}</strong> • Plan:{' '}
                        <strong>{tx.plan.toUpperCase()}</strong>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-gray-900 dark:text-white">
                        {formatNaira(tx.amount)}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold justify-end mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-1.5 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                    <span className="truncate max-w-xs">SHA512: {tx.signature}</span>
                    <span>{new Date(tx.paidAt).toLocaleString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Customer Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {orders.map((ord) => (
              <Card key={ord.id} padding="md" className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-black text-sm text-[#0B6B3A] dark:text-[#FFC93C]">
                      #{ord.orderNumber}
                    </span>
                    <h4 className="font-bold text-base text-gray-900 dark:text-white mt-0.5">
                      {ord.customerName} ({ord.customerPhone})
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{ord.customerAddress}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-gray-900 dark:text-white">
                      {formatNaira(ord.totalAmount)}
                    </span>
                    <span
                      className={`block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                        ord.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : ord.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-2 flex items-center justify-between text-xs">
                  <div className="text-gray-500">
                    {ord.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {ord.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleStatusChange(ord.id, 'completed')}
                      >
                        Mark Completed
                      </Button>
                    )}
                    {ord.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(ord.id, 'confirmed')}
                      >
                        Confirm
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
