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
} from 'lucide-react';
import { api } from '../../services/api';
import { Booking, Vehicle, Vendor, SiteSettings, AuditLog, BookingStatus } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';

interface AdminPortalProps {
  onClose: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onClose }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('goamate_admin_token') || 'goamate-admin-secret-2026');
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'vendors' | 'vehicles' | 'switches' | 'audit' | 'database'>('overview');

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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Supabase Database Sync State
  const [supabaseInfo, setSupabaseInfo] = useState<any>(null);
  const [syncingSupabase, setSyncingSupabase] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [copiedFullSql, setCopiedFullSql] = useState<boolean>(false);

  // Modals & view targets
  const [viewingDocBooking, setViewingDocBooking] = useState<Booking | null>(null);
  const [rejectingVendor, setRejectingVendor] = useState<Vendor | null>(null);
  const [vendorRejectionReason, setVendorRejectionReason] = useState<string>('');

  const [rejectingVehicle, setRejectingVehicle] = useState<Vehicle | null>(null);
  const [vehicleRejectionReason, setVehicleRejectionReason] = useState<string>('');

  // Fetch all admin data
  const loadAdminData = async (adminToken: string) => {
    try {
      setLoading(true);
      setError(null);
      const [st, bk, vn, vh, sett, logs, sb] = await Promise.all([
        api.getAdminStats(adminToken),
        api.getAdminBookings(adminToken),
        api.getAdminVendors(adminToken),
        api.getAdminVehicles(adminToken).catch(() => api.getVehicles()),
        api.getSettings(),
        api.getAdminAuditLogs(adminToken),
        api.getAdminSupabaseStatus(adminToken).catch(() => null),
      ]);

      setStats(st);
      setBookings(bk);
      setVendors(vn);
      setVehicles(vh);
      setSettings(sett);
      setAuditLogs(logs);
      if (sb) setSupabaseInfo(sb);
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
  const handleVendorStatus = async (vendorId: string, newStatus: Vendor['status'], reason?: string) => {
    if (!token) return;
    try {
      setError(null);
      await api.updateVendorStatus(vendorId, newStatus, reason, token);
      setSuccessMsg(`Vendor status updated to ${newStatus}`);
      setRejectingVendor(null);
      await loadAdminData(token);
    } catch (err: any) {
      setError(err.message || 'Failed to update vendor');
    }
  };

  // Vehicle status update (Approve, Reject, Toggle Active)
  const handleVehicleStatus = async (vehicleId: string, data: { status?: Vehicle['status']; isActive?: boolean; rejectionReason?: string }) => {
    if (!token) return;
    try {
      setError(null);
      await api.updateVehicleStatus(vehicleId, data, token);
      setSuccessMsg(`Vehicle updated successfully`);
      setRejectingVehicle(null);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl">
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
            { id: 'vendors', label: `Vendors (${vendors.length})` },
            { id: 'vehicles', label: `Fleet Catalog (${vehicles.length})` },
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
                      <span className="font-bold text-amber-700">
                        {bookings.filter(b => b.status === 'pending').length}
                      </span>
                    </li>
                    <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                      <span>Pending Vendor Applications:</span>
                      <span className="font-bold text-amber-700">
                        {vendors.filter(v => v.status === 'pending').length}
                      </span>
                    </li>
                    <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                      <span>Vehicles Needing Approval:</span>
                      <span className="font-bold text-amber-700">
                        {vehicles.filter(v => v.status === 'pending_approval').length}
                      </span>
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

                    {/* Admin Status Transitions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500 font-semibold">Change Status (Enforces Concurrency):</span>
                      <div className="flex flex-wrap gap-1.5">
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
              <h3 className="font-bold text-slate-900 text-sm">Registered Rental Vendors</h3>

              <div className="space-y-3">
                {vendors.map(v => (
                  <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{v.businessName}</span>
                        <StatusBadge status={v.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Owner: <strong>{v.ownerName}</strong> &bull; {v.serviceLocation} &bull; {v.phone} &bull; {v.email}
                      </p>
                      {v.rejectionReason && (
                        <p className="text-xs text-rose-700 mt-1">Rejection note: {v.rejectionReason}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {v.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleVendorStatus(v.id, 'approved')}
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

                      {v.status === 'approved' && (
                        <button
                          onClick={() => handleVendorStatus(v.id, 'suspended', 'Suspended by super admin')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                        >
                          Suspend Vendor
                        </button>
                      )}

                      {v.status === 'suspended' && (
                        <button
                          onClick={() => handleVendorStatus(v.id, 'approved')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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
                          <StatusBadge status={v.status} size="sm" />
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                            {v.isActive ? 'Active' : 'Paused'}
                          </span>
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

                    <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-2 text-xs">
                      {v.status === 'pending_approval' && (
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

                      {v.status === 'approved' && (
                        <button
                          onClick={() => handleVehicleStatus(v.id, { isActive: !v.isActive })}
                          className={`w-full py-1.5 rounded-lg font-bold ${v.isActive ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'}`}
                        >
                          {v.isActive ? 'Deactivate Listing' : 'Activate Listing'}
                        </button>
                      )}
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
                  onClick={() => handleVendorStatus(rejectingVendor.id, 'rejected', vendorRejectionReason)}
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
      </div>
    </div>
  );
};
