import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  Users,
  User,
  Car,
  Calendar,
  Lock,
  Eye,
  Sliders,
  RefreshCw,
  LogOut,
  AlertCircle,
  Database,
  History,
  ToggleLeft,
  ToggleRight,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import { Booking, Vehicle, Vendor, SiteSettings, AuditLog, BookingStatus, Invoice } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { InvoiceModal } from '../vendor/InvoiceModal';
import { InvoiceListView } from '../vendor/InvoiceListView';

interface AdminPortalProps {
  onClose: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onClose }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('goamate_admin_token') || 'goamate-admin-secret-2026');
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'vendors' | 'vehicles' | 'invoices' | 'switches' | 'audit' | 'database'>('overview');

  // Login state
  const [secretTokenInput, setSecretTokenInput] = useState<string>('goamate-admin-secret-2026');
  const [loginEmail, setLoginEmail] = useState<string>('goamate.com@gmail.com');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorFilter, setVendorFilter] = useState<'all' | 'pending' | 'approved' | 'suspended' | 'rejected' | 'removed'>('all');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Supabase Database Sync State
  const [supabaseInfo, setSupabaseInfo] = useState<any>(null);
  const [syncingSupabase, setSyncingSupabase] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [copiedFullSql, setCopiedFullSql] = useState<boolean>(false);

  // Modals & view targets
  const [viewingDocBooking, setViewingDocBooking] = useState<Booking | null>(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [rejectingVendor, setRejectingVendor] = useState<Vendor | null>(null);
  const [removingVendor, setRemovingVendor] = useState<Vendor | null>(null);
  const [purgingVendor, setPurgingVendor] = useState<Vendor | null>(null);
  const [isPurgingVendor, setIsPurgingVendor] = useState<boolean>(false);
  const [purgeConfirmationCheck, setPurgeConfirmationCheck] = useState<boolean>(false);
  const [vendorRejectionReason, setVendorRejectionReason] = useState<string>('');

  const [rejectingVehicle, setRejectingVehicle] = useState<Vehicle | null>(null);
  const [removingVehicle, setRemovingVehicle] = useState<Vehicle | null>(null);
  const [removingReason, setRemovingReason] = useState<string>('');
  const [vehicleRejectionReason, setVehicleRejectionReason] = useState<string>('');

  // Fetch all admin data
  const loadAdminData = async (adminToken: string) => {
    try {
      setLoading(true);
      setError(null);
      const [st, bk, vn, vh, sett, logs, sb, invs] = await Promise.all([
        api.getAdminStats(adminToken),
        api.getAdminBookings(adminToken),
        api.getAdminVendors(adminToken),
        api.getAdminVehicles(adminToken).catch(() => api.getVehicles()),
        api.getSettings(),
        api.getAdminAuditLogs(adminToken),
        api.getAdminSupabaseStatus(adminToken).catch(() => null),
        api.getAdminInvoices(adminToken).catch(() => []),
      ]);

      setStats(st);
      setBookings(bk);
      setVendors(vn);
      setVehicles(vh);
      setSettings(sett);
      setAuditLogs(logs);
      if (sb) setSupabaseInfo(sb);
      setInvoices(invs);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAdminData(token);
    }
  }, [token]);

  const handleSyncSupabaseAll = async () => {
    if (!token) return;
    try {
      setSyncingSupabase(true);
      setError(null);
      const res = await api.syncAllToSupabase(token);
      if (res.success) {
        setSuccessMsg(`Successfully synced ${res.syncedBookings} bookings and fleet to Supabase!`);
      } else {
        setError(`Supabase notice: ${res.error || 'Check Row Level Security (RLS) policy in Supabase'}`);
      }
      const updated = await api.getAdminSupabaseStatus(token);
      setSupabaseInfo(updated);
      await loadAdminData(token);
    } catch (err: any) {
      setError(err.message || 'Supabase sync failed');
    } finally {
      setSyncingSupabase(false);
    }
  };

  const handleCopySql = () => {
    if (supabaseInfo?.sqlHelper) {
      navigator.clipboard.writeText(supabaseInfo.sqlHelper);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    }
  };

  const handleCopyFullSql = () => {
    if (supabaseInfo?.fullSchemaSql) {
      navigator.clipboard.writeText(supabaseInfo.fullSchemaSql);
      setCopiedFullSql(true);
      setTimeout(() => setCopiedFullSql(false), 3000);
    }
  };

  // Login handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.adminLogin(secretTokenInput);
      setToken(res.token);
      localStorage.setItem('goamate_admin_token', res.token);
      await loadAdminData(res.token);
    } catch (err: any) {
      setError(err.message || 'Admin authorization failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('goamate_admin_token');
    setToken(null);
  };

  // Booking status update with overlap conflict check
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: BookingStatus, reason?: string) => {
    if (!token) return;
    try {
      setError(null);
      await api.updateBookingStatus(bookingId, newStatus, reason, token);
      setSuccessMsg(`Booking status transitioned to ${newStatus}`);
      await loadAdminData(token);
    } catch (err: any) {
      setError(err.message || 'Status transition rejected');
    }
  };

  // Vendor status update (Approve, Suspend, Reactivate, Reject)
  const handleVendorStatus = async (vendorId: string, data: { status?: Vendor['status']; isDeleted?: boolean; reason?: string }) => {
    if (!token) return;
    try {
      setError(null);
      await api.updateVendorStatus(vendorId, data, token);
      setSuccessMsg(`Vendor updated successfully`);
      setRejectingVendor(null);
      setRemovingVendor(null);
      await loadAdminData(token);
    } catch (err: any) {
      setError(err.message || 'Failed to update vendor');
    }
  };

  // Permanently delete vendor and all associated data from platform and database
  const handleDeleteVendorPermanently = async () => {
    if (!token || !purgingVendor) return;
    try {
      setIsPurgingVendor(true);
      setError(null);
      await api.deleteVendorPermanently(purgingVendor.id, token);
      setSuccessMsg(`Vendor deleted successfully. All vehicles belonging to this vendor were also removed.`);
      setPurgingVendor(null);
      setPurgeConfirmationCheck(false);
      await loadAdminData(token);
    } catch (err: any) {
      setError(err.message || 'Failed to permanently delete vendor data');
    } finally {
      setIsPurgingVendor(false);
    }
  };

  const handleVehicleStatus = async (vehicleId: string, data: { status?: Vehicle['status']; isActive?: boolean; rejectionReason?: string; isDeleted?: boolean; reason?: string }) => {
    if (!token) return;
    try {
      setError(null);
      await api.updateVehicleStatus(vehicleId, data, token);
      setSuccessMsg(`Vehicle updated successfully`);
      setRejectingVehicle(null);
      setRemovingVehicle(null);
      await loadAdminData(token);
    } catch (err: any) {
      setError(err.message || 'Failed to update vehicle');
    }
  };

  // Operational Switches Toggle
  const handleToggleSwitch = async (key: keyof SiteSettings) => {
    if (!token || !settings) return;
    const newVal = !settings[key];
    try {
      const updated = await api.updateAdminSettings({ [key]: newVal }, token);
      setSettings(updated);
      setSuccessMsg(`Operational setting "${key}" updated to ${newVal ? 'ENABLED' : 'DISABLED'}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update switch');
    }
  };

  // CSV Export Download
  const handleExportCsv = () => {
    if (!token) return;
    window.location.href = `/api/admin/export/bookings.csv`;
  };

  // -------------------------------------------------------------
  // RENDER: LOGIN FORM
  // -------------------------------------------------------------
  if (!token) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/85 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-emerald-600" />
              <div>
                <h2 className="font-extrabold text-slate-900 text-xl">Super Admin Access</h2>
                <span className="text-xs text-slate-500">GoaMate Operational Control</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-full">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800">Bootstrap Procedure:</div>
            <div>Authorized super-admin email: <code>goamate.com@gmail.com</code></div>
            <div>Default bootstrap secret: <code>goamate-admin-secret-2026</code></div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Super Admin Secret Token</label>
              <input
                type="password"
                required
                value={secretTokenInput || ''}
                onChange={e => setSecretTokenInput(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Authorize Super Admin Session</span>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: FULL ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-start py-4 sm:py-8 px-2 sm:px-4">
      <div className="bg-white rounded-3xl max-w-6xl w-full h-[88vh] max-h-[850px] flex flex-col overflow-hidden shadow-2xl my-auto">
        {/* Admin Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-white text-base sm:text-lg">GoaMate Super Admin</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-900 text-emerald-300 border border-emerald-700">
                  SYSTEM ROOT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Primary Base: Margao &bull; goamate.com@gmail.com &bull; +91 9403784132
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-xs font-semibold"
              title="Download bookings CSV with formula injection defense"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 bg-slate-100 border-b border-slate-200 overflow-x-auto">
          {[
            { id: 'overview', label: 'Dashboard' },
            { id: 'bookings', label: `All Bookings (${bookings.length})` },
            {
              id: 'vendors',
              label: (
                <span className="flex items-center gap-1.5">
                  <span>Vendors ({vendors.length})</span>
                  {vendors.filter(v => v.status === 'pending').length > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-slate-900 rounded-full text-[10px] font-extrabold animate-pulse">
                      {vendors.filter(v => v.status === 'pending').length} New
                    </span>
                  )}
                </span>
              ),
            },
            { id: 'vehicles', label: `Fleet Catalog (${vehicles.length})` },
            { id: 'invoices', label: `Invoices (${invoices.length})` },
            { id: 'database', label: `Supabase Sync (${supabaseInfo?.metrics?.totalBookingsInDb ?? 0} in DB)` },
            { id: 'switches', label: 'Operational Switches' },
            { id: 'audit', label: `Audit Log (${auditLogs.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-800 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Alerts in Admin */}
        {error && (
          <div className="m-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="m-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)}>
              <X className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        )}

        {/* Tab Contents */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 bg-slate-50">
          {/* ================= TAB 1: OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase">Total Bookings</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalBookings}</div>
                    <span className="text-xs text-amber-600 font-semibold">{stats.pendingBookings} Pending</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase">Fleet Inventory</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalVehicles}</div>
                    <span className="text-xs text-emerald-600 font-semibold">{stats.pendingVehicles} Pending Review</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase">Partner Vendors</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalVendors}</div>
                    <span className="text-xs text-amber-600 font-semibold">{stats.pendingVendors} Awaiting Approval</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase">Gross Booking Value</span>
                    <div className="text-2xl font-extrabold text-emerald-700 mt-1">₹{stats.totalBookingValue}</div>
                    <span className="text-xs text-slate-500">Includes deposits</span>
                  </div>
                </div>
              )}

              {/* Fast Action Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Immediate Action Items</span>
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                      <span>Pending Guest Bookings:</span>
                      <button
                        onClick={() => setActiveTab('bookings')}
                        className="font-bold text-amber-700 hover:underline flex items-center gap-1"
                      >
                        <span>{bookings.filter(b => b.status === 'pending').length}</span>
                        <span className="text-[10px] text-amber-600 font-normal">&rarr; View</span>
                      </button>
                    </li>
                    <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                      <span>Pending Vendor Applications:</span>
                      <button
                        onClick={() => {
                          setVendorFilter('pending');
                          setActiveTab('vendors');
                        }}
                        className="font-bold text-amber-700 hover:underline flex items-center gap-1"
                      >
                        <span>{vendors.filter(v => v.status === 'pending').length}</span>
                        <span className="text-[10px] text-amber-600 font-normal">&rarr; Approve</span>
                      </button>
                    </li>
                    <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                      <span>Vehicles Needing Approval:</span>
                      <button
                        onClick={() => setActiveTab('vehicles')}
                        className="font-bold text-amber-700 hover:underline flex items-center gap-1"
                      >
                        <span>{vehicles.filter(v => v.status === 'pending_approval').length}</span>
                        <span className="text-[10px] text-amber-600 font-normal">&rarr; Review</span>
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>System Status Summary</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 block">Accepting Bookings:</span>
                      <span className={`font-bold ${settings?.acceptNewBookings ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {settings?.acceptNewBookings ? 'YES (Active)' : 'NO (Paused)'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 block">Maintenance Mode:</span>
                      <span className={`font-bold ${settings?.maintenanceMode ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {settings?.maintenanceMode ? 'ACTIVE (Under Maintenance)' : 'NORMAL'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 block">Vendor Signups:</span>
                      <span className="font-bold text-slate-800">
                        {settings?.allowVendorRegistration ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <span className="text-slate-500 block">Primary Focus:</span>
                      <span className="font-bold text-slate-800">Margao, South Goa</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supabase Cloud Health Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">Supabase Database Integration</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {supabaseInfo?.metrics?.isConfigured ? 'Connected' : 'Active'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {supabaseInfo?.metrics?.totalBookingsInDb ?? 0} bookings in Supabase database • Key: {supabaseInfo?.metrics?.hasServiceRoleKey ? 'Service Role (Full Access)' : 'Publishable (Anon)'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('database')}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                >
                  Configure &amp; Sync &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 2: ALL BOOKINGS ================= */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm">All Platform Bookings</h3>
                <button
                  onClick={handleExportCsv}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-base">{b.referenceNumber}</span>
                          <StatusBadge status={b.status} />
                        </div>
                        <span className="text-xs text-slate-500">
                          {b.vehicle?.name || b.vehicleId} &bull; Created {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-500">Total Estimated:</span>
                        <div className="text-lg font-black text-emerald-700">₹{b.totalEstimatedAmount}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                      <div>
                        <span className="font-bold text-slate-800 block">Customer Info:</span>
                        <span>{b.customerName}</span>
                        <p>{b.customerPhone}</p>
                        <p>{b.customerEmail}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">Duration &amp; Location:</span>
                        <span>{b.pickupDatetime.replace('T', ' ')}</span>
                        <span className="block text-slate-400">to</span>
                        <span>{b.returnDatetime.replace('T', ' ')}</span>
                        <p className="text-slate-500">{b.pickupLocation}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">Identity Proofs:</span>
                        <button
                          onClick={() => setViewingDocBooking(b)}
                          className="mt-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Proofs ({b.documents?.length || 0})</span>
                        </button>
                      </div>
                    </div>

                    {/* Admin Status Transitions & Invoice */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const matchingInvoice = invoices.find(
                            inv => inv.bookingId === b.id || inv.bookingReference === b.referenceNumber
                          );
                          if (matchingInvoice) {
                            return (
                              <button
                                onClick={() => {
                                  setSelectedInvoice(matchingInvoice);
                                  setSelectedInvoiceBooking(b);
                                }}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-md flex items-center gap-1.5"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{matchingInvoice.invoiceNumber}</span>
                                <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-200 text-emerald-900 uppercase font-black">
                                  {matchingInvoice.paymentStatus}
                                </span>
                              </button>
                            );
                          }
                          return (
                            <button
                              onClick={() => {
                                setSelectedInvoice(null);
                                setSelectedInvoiceBooking(b);
                              }}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-md flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Invoice</span>
                            </button>
                          );
                        })()}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                        <span className="text-slate-500 font-semibold mr-1">Status:</span>
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-md"
                        >
                          Mark Completed
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter cancellation reason:') || 'Administrative decision';
                            handleUpdateBookingStatus(b.id, 'cancelled', reason);
                          }}
                          className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-md"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 3: VENDORS ================= */}
          {activeTab === 'vendors' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Registered Rental Vendors</h3>
                  <p className="text-xs text-slate-500">
                    Review incoming vendor applications, verify details, and manage approvals.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: `All (${vendors.length})` },
                    { id: 'pending', label: `Pending (${vendors.filter(v => v.status === 'pending' && !v.isDeleted).length})`, isAlert: vendors.some(v => v.status === 'pending' && !v.isDeleted) },
                    { id: 'approved', label: `Approved (${vendors.filter(v => v.status === 'approved' && !v.isDeleted).length})` },
                    { id: 'suspended', label: `Suspended (${vendors.filter(v => v.status === 'suspended' && !v.isDeleted).length})` },
                    { id: 'rejected', label: `Rejected (${vendors.filter(v => v.status === 'rejected' && !v.isDeleted).length})` },
                    { id: 'removed', label: `Removed (${vendors.filter(v => v.isDeleted || v.status === 'inactive').length})` },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setVendorFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        vendorFilter === f.id
                          ? 'bg-slate-900 text-white'
                          : f.isAlert
                          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vendors List */}
              <div className="space-y-3">
                {vendors
                  .filter(v => {
                    if (vendorFilter === 'all') return true;
                    if (vendorFilter === 'removed') return v.isDeleted || v.status === 'inactive';
                    if (vendorFilter === 'approved') return v.status === 'approved' && !v.isDeleted;
                    if (vendorFilter === 'suspended') return v.status === 'suspended' && !v.isDeleted;
                    return v.status === vendorFilter && !v.isDeleted;
                  })
                  .map(v => (
                  <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{v.businessName}</span>
                        {v.isDeleted ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Removed
                          </span>
                        ) : (
                          <StatusBadge status={v.status} size="sm" />
                        )}
                        {v.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Action Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Vendor Name: <strong>{v.vendorName}</strong> &bull; {v.serviceLocation} &bull; {v.phone} &bull; {v.email}
                      </p>
                      {v.rejectionReason && (
                        <p className="text-xs text-rose-700 mt-1">Rejection note: {v.rejectionReason}</p>
                      )}
                      <div className="text-[11px] text-slate-400 mt-1">
                        Registered: {new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {v.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleVendorStatus(v.id, { status: 'approved' })}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingVendor(v)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {v.status === 'approved' && !v.isDeleted && (
                        <button
                          onClick={() => handleVendorStatus(v.id, { status: 'suspended', reason: 'Suspended by super admin' })}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                        >
                          Suspend
                        </button>
                      )}

                      {v.status === 'suspended' && !v.isDeleted && (
                        <button
                          onClick={() => handleVendorStatus(v.id, { status: 'approved' })}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Reactivate
                        </button>
                      )}
                      
                      {!v.isDeleted ? (
                        <button
                          onClick={() => {
                            setPurgingVendor(v);
                            setPurgeConfirmationCheck(true);
                          }}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVendorStatus(v.id, { isDeleted: false, status: 'pending', reason: 'Restored by Super Admin' })}
                          className="px-3 py-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-xs font-bold"
                        >
                          Restore
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setPurgingVendor(v);
                          setPurgeConfirmationCheck(true);
                        }}
                        title="Permanently erase vendor and all fleet data from website"
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete All Data</span>
                      </button>
                    </div>
                  </div>
                ))}

                {vendors.filter(v => {
                  if (vendorFilter === 'all') return true;
                  if (vendorFilter === 'removed') return v.isDeleted || v.status === 'inactive';
                  if (vendorFilter === 'approved') return v.status === 'approved' && !v.isDeleted;
                  if (vendorFilter === 'suspended') return v.status === 'suspended' && !v.isDeleted;
                  return v.status === vendorFilter && !v.isDeleted;
                }).length === 0 && (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-slate-800 text-sm">No vendors match this status</div>
                    <p className="text-xs text-slate-500 mt-1">
                      {vendorFilter === 'pending'
                        ? 'There are currently no pending vendor approval requests.'
                        : `No vendors found with status "${vendorFilter}".`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 4: FLEET CATALOG ================= */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">All Platform Vehicles</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map(v => (
                  <div key={v.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="relative h-40 bg-slate-100">
                        <img src={v.coverImage} alt={v.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 flex gap-1">
                          {v.isDeleted ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Removed
                            </span>
                          ) : (
                            <>
                              <StatusBadge status={v.status} size="sm" />
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                                {v.isActive ? 'Active' : 'Paused'}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="absolute bottom-2 right-2 bg-slate-900/85 text-white px-2.5 py-1 rounded-lg text-xs font-extrabold">
                          ₹{v.dailyPrice} / day
                        </div>
                      </div>

                      <div className="p-4 space-y-1.5">
                        <h4 className="font-bold text-slate-900 text-sm">{v.name}</h4>
                        <div className="text-xs text-slate-500">
                          Plate: {v.registrationNumber} &bull; {v.category} &bull; {v.location}
                        </div>
                        <div className="text-xs text-slate-500">Vendor ID: {v.vendorId}</div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex flex-col gap-2 text-xs">
                      {v.status === 'pending_approval' && !v.isDeleted && (
                        <div className="flex gap-1.5 w-full">
                          <button
                            onClick={() => handleVehicleStatus(v.id, { status: 'approved' })}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingVehicle(v)}
                            className="flex-1 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      <div className="flex gap-1.5 w-full">
                        {v.status === 'approved' && !v.isDeleted && (
                          <button
                            onClick={() => handleVehicleStatus(v.id, { isActive: !v.isActive })}
                            className={`flex-1 py-1.5 rounded-lg font-bold ${v.isActive ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
                          >
                            {v.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        
                        {!v.isDeleted ? (
                          <button
                            onClick={() => setRemovingVehicle(v)}
                            className="flex-1 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVehicleStatus(v.id, { isDeleted: false, isActive: false, status: 'draft', reason: 'Restored by Super Admin' })}
                            className="flex-1 py-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg font-bold"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 5: OPERATIONAL SWITCHES ================= */}
          {activeTab === 'switches' && settings && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Platform Control Switches</h3>
                <p className="text-xs text-slate-500">
                  These switches take immediate effect and are strictly enforced at the backend API level.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                {[
                  {
                    key: 'acceptNewBookings',
                    title: 'Accept New Online Bookings',
                    desc: 'When disabled, guest customers cannot submit new reservation requests.',
                  },
                  {
                    key: 'allowVendorRegistration',
                    title: 'Allow Vendor Partner Registration',
                    desc: 'Toggle whether new vehicle owners in Goa can apply to become GoaMate fleet partners.',
                  },
                  {
                    key: 'allowVendorVehicleUploads',
                    title: 'Allow Vendor Vehicle Uploads',
                    desc: 'When disabled, vendors cannot add new cars or bikes to their catalog.',
                  },
                  {
                    key: 'allowVendorDirectLinks',
                    title: 'Allow Vendor Direct Form Links',
                    desc: 'Controls whether fleet partners can generate direct WhatsApp customer reservation links.',
                  },
                  {
                    key: 'showCars',
                    title: 'Show Cars Category on Website',
                    desc: 'Controls visibility of self-drive car inventory to public visitors.',
                  },
                  {
                    key: 'showBikes',
                    title: 'Show Bikes Category on Website',
                    desc: 'Controls visibility of Royal Enfield and motorcycle rentals.',
                  },
                  {
                    key: 'showScooters',
                    title: 'Show Scooters Category on Website',
                    desc: 'Controls visibility of Honda Activa and automatic scooter rentals.',
                  },
                  {
                    key: 'showWhatsAppSupport',
                    title: 'Show Floating WhatsApp Support',
                    desc: 'Display WhatsApp floating button and instant coordination links.',
                  },
                  {
                    key: 'maintenanceMode',
                    title: 'System Maintenance Mode',
                    desc: 'Restricts public site access with a friendly maintenance message. Admin remains accessible.',
                  },
                ].map(item => {
                  const val = (settings as any)[item.key];
                  return (
                    <div key={item.key} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>

                      <button
                        onClick={() => handleToggleSwitch(item.key as any)}
                        className={`p-1 rounded-full transition-colors ${
                          val ? 'text-emerald-600' : 'text-slate-300'
                        }`}
                        title={val ? 'Click to Disable' : 'Click to Enable'}
                      >
                        {val ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 6: AUDIT TRAIL ================= */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Chronological Security Audit Log</h3>

              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-4 text-xs flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                        <span className="text-slate-400">Entity: {log.entityType} ({log.entityId})</span>
                      </div>
                      <pre className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded-lg overflow-x-auto max-w-xl">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>

                    <div className="text-slate-400 text-right whitespace-nowrap">
                      <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px]">{new Date(log.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 7: SUPABASE DATABASE SYNC ================= */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">Supabase Cloud Database Synchronization</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        Live Connected
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Endpoint: <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{supabaseInfo?.metrics?.url || 'Configured'}</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => token && api.getAdminSupabaseStatus(token).then(setSupabaseInfo)}
                    className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Metrics</span>
                  </button>
                  <button
                    onClick={handleSyncSupabaseAll}
                    disabled={syncingSupabase}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    {syncingSupabase ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{syncingSupabase ? 'Syncing...' : 'Sync All Data to Supabase'}</span>
                  </button>
                </div>
              </div>

              {/* Status Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase">Bookings in Supabase</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">
                    {supabaseInfo?.metrics?.totalBookingsInDb ?? 0}
                  </div>
                  <span className="text-xs text-slate-500">
                    Local in memory: <strong>{bookings.length}</strong>
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase">Vehicles in Supabase</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">
                    {supabaseInfo?.metrics?.totalVehiclesInDb ?? 0}
                  </div>
                  <span className="text-xs text-slate-500">
                    Local catalog: <strong>{vehicles.length}</strong>
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase">Vendors in Supabase</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">
                    {supabaseInfo?.metrics?.totalVendorsInDb ?? 0}
                  </div>
                  <span className="text-xs text-slate-500">
                    Local vendors: <strong>{vendors.length}</strong>
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase">API Key Privilege</span>
                  <div className="mt-1">
                    {supabaseInfo?.metrics?.hasServiceRoleKey ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                        Service Role (Bypasses RLS)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
                        Publishable / Anon Key
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {supabaseInfo?.metrics?.hasServiceRoleKey
                      ? 'Full direct write access active'
                      : 'Subject to Supabase RLS policies'}
                  </span>
                </div>
              </div>

              {/* RLS Policy Notice & Guidance */}
              {(supabaseInfo?.metrics?.isRlsBlocked || !supabaseInfo?.metrics?.hasServiceRoleKey) && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">
                        Supabase Row-Level Security (RLS) Configuration Guide
                      </h4>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        Supabase protects tables by default with Row-Level Security. To ensure newly submitted bookings appear in your Supabase dashboard immediately, choose either of the following 2 quick methods:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Method 1 */}
                    <div className="bg-white p-4 rounded-xl border border-amber-200/80 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center justify-center">1</span>
                        <h5 className="font-bold text-slate-900 text-xs">Method 1 (Recommended): Add Service Role Key</h5>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        In your Supabase project dashboard, open <strong>Project Settings &gt; API</strong>, copy the secret <strong><code>service_role</code></strong> key (starts with <code>sb_secret_...</code>), and set it as <code>SUPABASE_SERVICE_ROLE_KEY</code> in AI Studio Settings. This gives the backend server full database access without requiring open public RLS policies.
                      </p>
                    </div>

                    {/* Method 2 */}
                    <div className="bg-white p-4 rounded-xl border border-amber-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold flex items-center justify-center">2</span>
                          <h5 className="font-bold text-slate-900 text-xs">Method 2: Run SQL in Supabase SQL Editor</h5>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={handleCopySql}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1"
                            title="Copy RLS policies script"
                          >
                            {copiedSql ? <Check className="w-3 h-3 text-emerald-600" /> : <FileText className="w-3 h-3" />}
                            <span>{copiedSql ? 'Copied RLS!' : 'Copy RLS'}</span>
                          </button>
                          {supabaseInfo?.fullSchemaSql && (
                            <button
                              onClick={handleCopyFullSql}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center gap-1"
                              title="Copy full database schema and seed data SQL"
                            >
                              {copiedFullSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Database className="w-3 h-3" />}
                              <span>{copiedFullSql ? 'Copied Full SQL!' : 'Copy Full DB SQL'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <pre className="text-[10px] font-mono bg-slate-900 text-slate-200 p-2.5 rounded-lg overflow-x-auto max-h-32">
{supabaseInfo?.sqlHelper || `-- In Supabase SQL Editor:
CREATE POLICY "Allow booking insert" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow doc insert" ON public.booking_documents FOR INSERT WITH CHECK (true);`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Synchronized Bookings Table View */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">Local & Supabase Synced Bookings Status</h4>
                  <span className="text-[11px] text-slate-500">
                    Automatic sync triggers on every new customer booking and status change
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                        <th className="py-2.5">Reference</th>
                        <th className="py-2.5">Customer</th>
                        <th className="py-2.5">Vehicle</th>
                        <th className="py-2.5">Amount</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.slice(0, 10).map(b => (
                        <tr key={b.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 font-mono font-bold text-slate-900">{b.referenceNumber}</td>
                          <td className="py-2.5 text-slate-700">{b.customerName}</td>
                          <td className="py-2.5 text-slate-600">{b.vehicle?.name || b.vehicleId}</td>
                          <td className="py-2.5 font-semibold text-slate-900">₹{b.totalEstimatedAmount}</td>
                          <td className="py-2.5">
                            <StatusBadge status={b.status} />
                          </td>
                          <td className="py-2.5 text-slate-500 text-[11px]">
                            {new Date(b.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 8: INVOICES ================= */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <InvoiceListView
                invoices={invoices}
                onViewInvoice={(inv) => {
                  const matchingBooking = bookings.find(
                    b => b.id === inv.bookingId || b.referenceNumber === inv.bookingReference
                  ) || ({
                    id: inv.bookingId,
                    referenceNumber: inv.bookingReference,
                    vehicleId: inv.vehicleId,
                    vendorId: inv.vendorId,
                    customerName: inv.customerDetails?.name || 'Customer',
                    customerPhone: inv.customerDetails?.phone || '',
                    customerEmail: inv.customerDetails?.email || '',
                    customerWhatsapp: inv.customerDetails?.whatsapp || '',
                    hotelOrDeliveryAddress: inv.customerDetails?.address || '',
                    pickupDatetime: inv.rentalDetails?.pickupDatetime || new Date().toISOString(),
                    returnDatetime: inv.rentalDetails?.returnDatetime || new Date().toISOString(),
                    pickupLocation: inv.rentalDetails?.pickupLocation || 'Margao Hub',
                    dropoffLocation: inv.rentalDetails?.dropoffLocation || 'Margao Hub',
                    daysCount: inv.rentalDetails?.totalDurationDays || 1,
                    dailyRate: inv.rentalDetails?.dailyRate || 0,
                    subtotalAmount: inv.subtotalAmount,
                    deliveryFee: inv.extraCharges,
                    securityDeposit: inv.securityDeposit,
                    totalEstimatedAmount: inv.totalAmount,
                    status: 'confirmed',
                    documents: (inv.documents || []).map(d => ({
                      id: d.id,
                      bookingId: inv.bookingId,
                      docType: d.docType,
                      idProofType: d.idProofType,
                      storagePath: d.storagePath,
                      fileName: d.fileName,
                      fileSizeBytes: 20000,
                      mimeType: 'image/svg+xml',
                      uploadedAt: inv.createdAt,
                      previewUrl: d.previewUrl,
                    })),
                    createdAt: inv.createdAt,
                  } as Booking);

                  setSelectedInvoice(inv);
                  setSelectedInvoiceBooking(matchingBooking);
                }}
                onRefresh={() => token && loadAdminData(token)}
                isLoading={loading}
                userRole="super_admin"
              />
            </div>
          )}
        </div>

        {/* Modal: Protected Customer Documents Preview */}
        {viewingDocBooking && (
          <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase">Super Admin Protected Document Access</span>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Documents for Booking {viewingDocBooking.referenceNumber}
                  </h3>
                </div>
                <button onClick={() => setViewingDocBooking(null)}>
                  <XCircle className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong>Audit Notice:</strong> This preview is recorded in the immutable compliance audit log.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewingDocBooking.documents?.map(doc => (
                  <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{doc.docType.replace(/_/g, ' ').toUpperCase()} ({doc.fileName})</span>
                      <span className="text-slate-500 text-[11px] whitespace-nowrap ml-2">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    {doc.previewUrl ? (
                      doc.mimeType.startsWith('image/') ? (
                        <div className="flex-1 flex items-center justify-center bg-white rounded-lg border border-slate-200 overflow-hidden">
                          <img src={doc.previewUrl} alt={doc.fileName} className="w-full h-48 object-contain" />
                        </div>
                      ) : (
                        <div className="h-48 bg-white border border-slate-200 rounded-lg text-xs font-bold flex items-center justify-center text-slate-700 text-center p-4">
                          {doc.fileName} (PDF Document)
                        </div>
                      )
                    ) : (
                      <div className="text-xs text-slate-400 italic h-48 flex items-center justify-center bg-white border border-slate-200 rounded-lg">Document stored in secure vault.</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setViewingDocBooking(null)}
                  className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
                >
                  Close Document Viewer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Reject Vendor Reason */}
        {rejectingVendor && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Reject Vendor Application</h3>
              <p className="text-xs text-slate-600">
                Please provide a reason for rejecting <strong>{rejectingVendor.businessName}</strong>. This will be shown to the vendor.
              </p>
              <textarea
                rows={3}
                required
                value={vendorRejectionReason || ''}
                onChange={e => setVendorRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete commercial permit documentation..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectingVendor(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVendorStatus(rejectingVendor.id, { status: 'rejected', reason: vendorRejectionReason })}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Reject Vehicle Reason */}
        {rejectingVehicle && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Reject Vehicle Listing</h3>
              <p className="text-xs text-slate-600">
                Please specify why <strong>{rejectingVehicle.name}</strong> was rejected.
              </p>
              <textarea
                rows={3}
                required
                value={vehicleRejectionReason || ''}
                onChange={e => setVehicleRejectionReason(e.target.value)}
                placeholder="e.g. Please supply clear front-quarter photos with registration plate visible..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectingVehicle(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVehicleStatus(rejectingVehicle.id, { status: 'rejected', rejectionReason: vehicleRejectionReason })}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: View / Generate Invoice (Super Admin) */}
        {selectedInvoiceBooking && (
          <InvoiceModal
            booking={selectedInvoiceBooking}
            invoice={selectedInvoice}
            adminToken={token}
            onClose={() => {
              setSelectedInvoiceBooking(null);
              setSelectedInvoice(null);
            }}
            onInvoiceGenerated={(newInv) => {
              setInvoices(prev => [newInv, ...prev.filter(i => i.id !== newInv.id)]);
              setSelectedInvoice(newInv);
            }}
            onInvoiceUpdated={(updInv) => {
              setInvoices(prev => prev.map(i => (i.id === updInv.id ? updInv : i)));
              setSelectedInvoice(updInv);
            }}
          />
        )}
        {/* Modal: Remove Vendor */}
        {removingVendor && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border-2 border-rose-500">
              <h3 className="font-extrabold text-rose-700 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Remove Vendor
              </h3>
              <p className="text-sm text-slate-800 font-bold">
                Are you sure you want to remove this vendor?
              </p>
              <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-700 space-y-1">
                <div><strong>Vendor:</strong> {removingVendor.vendorName}</div>
                <div><strong>Business:</strong> {removingVendor.businessName}</div>
                <div><strong>Phone:</strong> {removingVendor.phone}</div>
                <div><strong>Email:</strong> {removingVendor.email}</div>
                <div><strong>Active Booking Count:</strong> {bookings.filter(b => b.vendorId === removingVendor.id && b.status === 'confirmed').length}</div>
                <div><strong>Vehicles:</strong> {vehicles.filter(v => v.vendorId === removingVendor.id).length}</div>
              </div>
              <p className="text-xs text-slate-500">
                This action will deactivate the vendor and all their active vehicles. They will no longer appear in public searches. Historical bookings and invoices will remain intact.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason (Optional)</label>
                <select 
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs mb-2"
                  value={removingReason}
                  onChange={(e) => setRemovingReason(e.target.value)}
                >
                  <option value="">Select a reason...</option>
                  <option value="Vendor request">Vendor request</option>
                  <option value="Policy violation">Policy violation</option>
                  <option value="Vendor inactive">Vendor inactive</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-rose-950 text-xs">Want to remove vendor complete data?</div>
                  <div className="text-[11px] text-rose-800">Permanently erase vendor, fleet vehicles, and database records.</div>
                </div>
                <button
                  onClick={() => {
                    const target = removingVendor;
                    setRemovingVendor(null);
                    setPurgingVendor(target);
                    setPurgeConfirmationCheck(false);
                  }}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold shrink-0"
                >
                  Permanent Purge
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setRemovingVendor(null); setRemovingReason(''); }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setPurgingVendor(removingVendor);
                    setPurgeConfirmationCheck(false);
                    setRemovingVendor(null);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-200"
                >
                  Permanently Delete Vendor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Permanently Delete Vendor Complete Data */}
        {purgingVendor && (
          <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border-2 border-rose-600">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-rose-700 text-base flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-600" /> Delete Vendor Permanently?
                </h3>
                <button
                  onClick={() => { setPurgingVendor(null); setPurgeConfirmationCheck(false); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-1.5 text-rose-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-rose-950 block text-sm">Delete Vendor Permanently?</strong>
                    <span>This will permanently delete this vendor and all cars and bikes registered by this vendor. This action cannot be undone.</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
                <div><strong>Business Name:</strong> {purgingVendor.businessName}</div>
                <div><strong>Vendor Contact:</strong> {purgingVendor.vendorName} ({purgingVendor.phone})</div>
                <div><strong>Registered Email:</strong> {purgingVendor.email}</div>
                <div><strong>Service Location:</strong> {purgingVendor.serviceLocation}</div>
                <div><strong>Fleet Vehicles to Delete:</strong> {vehicles.filter(v => v.vendorId === purgingVendor.id || (purgingVendor.userId && v.vendorId === purgingVendor.userId)).length} vehicles</div>
              </div>

              <div className="text-xs space-y-2 text-slate-600">
                <div className="font-bold text-slate-800">What will be permanently wiped:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Vendor account and all administrative profiles on GoaMate</li>
                  <li>All {vehicles.filter(v => v.vendorId === purgingVendor.id || (purgingVendor.userId && v.vendorId === purgingVendor.userId)).length} fleet vehicles belonging to this vendor (removed from website & search)</li>
                  <li>All direct customer booking links for this vendor's vehicles</li>
                  <li>Database records from Supabase (<code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">vendors</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">vendor_profiles</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">vehicles</code>)</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer select-none bg-rose-50/60 p-3 rounded-xl border border-rose-100">
                  <input
                    type="checkbox"
                    checked={purgeConfirmationCheck}
                    onChange={(e) => setPurgeConfirmationCheck(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <span>I confirm that I want to permanently remove this vendor's complete data from this website.</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setPurgingVendor(null); setPurgeConfirmationCheck(false); }}
                  disabled={isPurgingVendor}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteVendorPermanently}
                  disabled={!purgeConfirmationCheck || isPurgingVendor}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-200 flex items-center gap-2"
                >
                  {isPurgingVendor ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting Vendor...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Vendor Permanently</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Remove Vehicle */}
        {removingVehicle && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border-2 border-rose-500">
              <h3 className="font-extrabold text-rose-700 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Remove Vehicle
              </h3>
              
              {bookings.some(b => b.vehicleId === removingVehicle.id && ['confirmed', 'pending'].includes(b.status)) ? (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs font-bold flex items-start gap-2 border border-amber-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  This vehicle has active or upcoming bookings. Removing it will hide it from new searches, but you must manually coordinate existing bookings.
                </div>
              ) : (
                <p className="text-sm text-slate-800 font-bold">
                  Are you sure you want to remove this vehicle from GoaMate?
                </p>
              )}
              
              <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-700 space-y-1">
                <div><strong>Vehicle Name:</strong> {removingVehicle.name}</div>
                <div><strong>Registration:</strong> {removingVehicle.registrationNumber}</div>
                <div><strong>Vendor:</strong> {removingVehicle.vendorBusinessName || vendors.find(v => v.id === removingVehicle.vendorId)?.businessName || 'Unknown'}</div>
              </div>
              <p className="text-xs text-slate-500">
                This action will deactivate the vehicle. Historical bookings and invoices will be preserved.
              </p>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason (Optional)</label>
                <select 
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs mb-2"
                  value={removingReason}
                  onChange={(e) => setRemovingReason(e.target.value)}
                >
                  <option value="">Select a reason...</option>
                  <option value="Vehicle unavailable">Vehicle unavailable</option>
                  <option value="Policy violation">Policy violation</option>
                  <option value="Duplicate listing">Duplicate listing</option>
                  <option value="Incorrect details">Incorrect details</option>
                  <option value="Vendor request">Vendor request</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setRemovingVehicle(null); setRemovingReason(''); }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVehicleStatus(removingVehicle.id, { isDeleted: true, isActive: false, status: 'inactive', reason: removingReason })}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-200"
                >
                  {bookings.some(b => b.vehicleId === removingVehicle.id && ['confirmed', 'pending'].includes(b.status)) 
                    ? 'Deactivate After Existing Bookings' 
                    : 'Remove Vehicle'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
