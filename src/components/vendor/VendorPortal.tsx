import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import {
  Car,
  Bike,
  Plus,
  Link as LinkIcon,
  MessageSquare,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Copy,
  ExternalLink,
  Shield,
  Trash2,
  Calendar,
  IndianRupee,
  LogOut,
  User,
  Check,
  AlertTriangle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api';
import { Vehicle, Booking, BookingFormLink, Vendor } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { getWhatsAppLink } from '../../lib/constants';
import { InvoiceModal } from './InvoiceModal';

interface VendorPortalProps {
  onClose: () => void;
  onOpenDirectLink: (token: string) => void;
}

export const VendorPortal: React.FC<VendorPortalProps> = ({ onClose, onOpenDirectLink }) => {
  const formatInputDate = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('goamate_vendor_token'));
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'bookings' | 'links'>('overview');

  // Login & Register state
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const [regForm, setRegForm] = useState({
    ownerName: '',
    businessName: '',
    phone: '',
    whatsapp: '',
    email: '',
    serviceLocation: 'Margao, South Goa',
    password: '',
  });

  // Data lists
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [linksList, setLinksList] = useState<BookingFormLink[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals inside vendor portal
  const [showAddVehicleModal, setShowAddVehicleModal] = useState<boolean>(false);
  const [showCreateLinkModal, setShowCreateLinkModal] = useState<boolean>(false);
  const [viewingDocBooking, setViewingDocBooking] = useState<Booking | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Booking | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Add Vehicle Form State
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    name: '',
    category: 'car',
    registrationNumber: '',
    brand: '',
    model: '',
    dailyPrice: 1800,
    securityDeposit: 3000,
    transmission: 'Manual',
    fuelType: 'Petrol',
    seats: 5,
    location: 'Margao Hub',
    description: 'Clean, reliable, tourist-ready vehicle with valid commercial permits.',
    coverImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
    features: ['Air Conditioning', 'Power Steering', 'Music System', 'Clean Interior'],
  });

  // Create Link Form State
  const [newLinkData, setNewLinkData] = useState({
    vehicleId: '',
    presetPickupDatetime: '',
    presetReturnDatetime: '',
    expiryDays: 7,
  });

  // Load Vendor Data
  const loadVendorData = async (sessToken: string) => {
    try {
      setLoading(true);
      setActionError(null);
      const meRes = await api.getVendorMe(sessToken);
      setVendor(meRes.vendor);
      setStats(meRes.stats);

      if (meRes.vendor.status === 'approved') {
        const [vList, bList, lList] = await Promise.all([
          api.getVendorVehicles(sessToken),
          api.getVendorBookings(sessToken),
          api.getVendorDirectLinks(sessToken),
        ]);
        setVehiclesList(vList);
        setBookingsList(bList);
        setLinksList(lList);
      }
    } catch (err: any) {
      if (err.message.includes('suspended') || err.message.includes('pending')) {
        // Handled via status screens
      } else {
        setActionError(err.message || 'Failed to authenticate vendor');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadVendorData(token);
    }
  }, [token]);

  // Login Action
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setActionError(null);
      const res = await api.vendorLogin(loginEmail, loginPassword);
      setToken(res.token);
      localStorage.setItem('goamate_vendor_token', res.token);
      await loadVendorData(res.token);
    } catch (err: any) {
      setActionError(err.message || 'Vendor login failed');
    } finally {
      setLoading(false);
    }
  };

  // Register Action
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setActionError(null);
      const res = await api.vendorRegister(regForm);
      setVendor(res.vendor);
      setSuccessMsg(res.message);
    } catch (err: any) {
      setActionError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Logout Action
  const handleLogout = () => {
    localStorage.removeItem('goamate_vendor_token');
    setToken(null);
    setVendor(null);
    setLoginEmail('');
    setLoginPassword('');
  };

  // Create Vehicle Action
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setLoading(true);
      await api.createVendorVehicle(token, newVehicle);
      setShowAddVehicleModal(false);
      setSuccessMsg('Vehicle submitted! It is now pending GoaMate super-admin review.');
      await loadVendorData(token);
    } catch (err: any) {
      setActionError(err.message || 'Failed to create vehicle');
    } finally {
      setLoading(false);
    }
  };

  // Create Direct Link Action
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newLinkData.vehicleId) return;
    try {
      setLoading(true);
      await api.createVendorDirectLink(token, newLinkData);
      setShowCreateLinkModal(false);
      setSuccessMsg('Direct booking link generated successfully!');
      await loadVendorData(token);
    } catch (err: any) {
      setActionError(err.message || 'Failed to create link');
    } finally {
      setLoading(false);
    }
  };

  // Revoke Link Action
  const handleRevokeLink = async (id: string) => {
    if (!token || !confirm('Are you sure you want to revoke this direct booking link?')) return;
    try {
      await api.revokeVendorDirectLink(token, id);
      await loadVendorData(token);
    } catch (err: any) {
      setActionError(err.message || 'Failed to revoke link');
    }
  };

  // Copy Link Helper
  const handleCopyLink = (rawToken: string, linkId: string) => {
    const fullUrl = `${window.location.origin}/?token=${rawToken}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLinkId(linkId);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  // Status Change on Booking
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: any) => {
    try {
      setActionError(null);
      await api.updateBookingStatus(bookingId, newStatus);
      setSuccessMsg(`Booking status updated to ${newStatus}`);
      if (token) await loadVendorData(token);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update booking status');
    }
  };

  // -------------------------------------------------------------
  // RENDER: NOT LOGGED IN (LOGIN / REGISTRATION)
  // -------------------------------------------------------------
  if (!token || !vendor) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Fleet Partner Hub</span>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {isRegistering ? 'Vendor Registration' : 'Vendor Login'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-full">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {actionError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isRegistering ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Vendor Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Login to Fleet Dashboard</span>}
              </button>

              <div className="pt-2 text-center text-xs text-slate-600">
                <span>Want to list your fleet on GoaMate? </span>
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Register Partner Account
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Owner Name *</label>
                <input
                  type="text"
                  required
                  value={regForm.ownerName}
                  onChange={e => setRegForm({ ...regForm, ownerName: e.target.value })}
                  placeholder="e.g. Francis D'Souza"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Business / Agency Name *</label>
                <input
                  type="text"
                  required
                  value={regForm.businessName}
                  onChange={e => setRegForm({ ...regForm, businessName: e.target.value })}
                  placeholder="e.g. Margao Speed Tours"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={regForm.phone}
                    onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="+91 9403..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={regForm.whatsapp}
                    onChange={e => setRegForm({ ...regForm, whatsapp: e.target.value })}
                    placeholder="+91 9403..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="contact@agency.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Location in Goa *</label>
                <input
                  type="text"
                  required
                  value={regForm.serviceLocation}
                  onChange={e => setRegForm({ ...regForm, serviceLocation: e.target.value })}
                  placeholder="e.g. Margao / Colva / Benaulim"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Password *</label>
                <input
                  type="password"
                  required
                  value={regForm.password}
                  onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Partner Application'}
              </button>

              <div className="pt-2 text-center text-slate-600">
                <span>Already registered? </span>
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: PENDING APPROVAL SCREEN
  // -------------------------------------------------------------
  if (vendor.status === 'pending') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Awaiting Super Admin Approval</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your vendor registration for <strong>{vendor.businessName}</strong> is pending review by the GoaMate administration. You cannot publish vehicles or access customer bookings until your account is approved.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1">
            <div><strong>Owner:</strong> {vendor.ownerName}</div>
            <div><strong>Location:</strong> {vendor.serviceLocation}</div>
            <div><strong>Contact:</strong> {vendor.phone}</div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
            >
              Sign Out
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: SUSPENDED SCREEN
  // -------------------------------------------------------------
  if (vendor.status === 'suspended') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Account Suspended</h2>
            <p className="text-xs text-rose-700 mt-2 leading-relaxed">
              Your vendor partner privileges have been suspended by the platform administrator. Access to fleet management and customer reservations is revoked.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
            >
              Sign Out
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: MAIN APPROVED VENDOR DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Vendor Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-base">
              {vendor.businessName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-white text-base sm:text-lg">{vendor.businessName}</h2>
                <StatusBadge status={vendor.status} size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                {vendor.ownerName} &bull; {vendor.serviceLocation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Dashboard Sub-Nav Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'vehicles', label: `My Fleet (${vehiclesList.length})` },
            { id: 'bookings', label: `Assigned Bookings (${bookingsList.length})` },
            { id: 'links', label: `Direct Customer Links (${linksList.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Alerts in Dashboard */}
        {actionError && (
          <div className="m-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)}>
              <XCircle className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="m-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)}>
              <XCircle className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        )}

        {/* Main Tab Views */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 bg-slate-50">
          {/* ================= TAB 1: OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase">Fleet Vehicles</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">
                    {vehiclesList.length}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    {vehiclesList.filter(v => v.status === 'approved').length} Approved
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase">Pending Requests</span>
                  <div className="text-2xl font-extrabold text-amber-600 mt-1">
                    {bookingsList.filter(b => b.status === 'pending').length}
                  </div>
                  <span className="text-[11px] text-slate-500">Require Verification</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase">Confirmed Bookings</span>
                  <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                    {bookingsList.filter(b => b.status === 'confirmed').length}
                  </div>
                  <span className="text-[11px] text-slate-500">Active Rentals</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase">Direct Form Links</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">
                    {linksList.length}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {linksList.filter(l => !l.isUsed && !l.isRevoked).length} Active
                  </span>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Vehicle to Fleet</span>
                </button>

                <button
                  onClick={() => setShowCreateLinkModal(true)}
                  className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <LinkIcon className="w-4 h-4 text-amber-400" />
                  <span>Generate Direct Customer Link</span>
                </button>
              </div>

              {/* Recent Bookings Snapshot */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm">Latest Guest Booking Requests</h3>
                  {bookingsList.length > 0 && (
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      View All
                    </button>
                  )}
                </div>
                {bookingsList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No bookings assigned yet.</p>
                ) : (
                  <div className="space-y-3">
                    {bookingsList.slice(0, 3).map(b => (
                      <div
                        key={b.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{b.referenceNumber}</span>
                            <StatusBadge status={b.status} size="sm" />
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            {b.customerName} &bull; {b.vehicle?.name} &bull; ₹{b.totalEstimatedAmount}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={getWhatsAppLink(`Hello ${b.customerName}, regarding GoaMate booking ${b.referenceNumber}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                          <button
                            onClick={() => setActiveTab('bookings')}
                            className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 2: MY VEHICLES ================= */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Fleet Inventory</h3>
                  <p className="text-xs text-slate-500">Vehicles created require GoaMate Super Admin review.</p>
                </div>
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Vehicle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehiclesList.map(v => (
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

                      <div className="p-4 space-y-2">
                        <h4 className="font-bold text-slate-900 text-sm">{v.name}</h4>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Plate: {v.registrationNumber}</span>
                          <span>{v.category} &bull; {v.transmission}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Deposit: ₹{v.securityDeposit} &bull; {v.location}
                        </div>
                        {v.rejectionReason && (
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800">
                            <strong>Admin rejection:</strong> {v.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">ID: {v.id}</span>
                      <button
                        onClick={() => {
                          setNewLinkData({ ...newLinkData, vehicleId: v.id });
                          setShowCreateLinkModal(true);
                        }}
                        className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Create Link</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 3: BOOKINGS ================= */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Assigned Guest Bookings</h3>

              {bookingsList.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                  No bookings found for your fleet yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {bookingsList.map(b => (
                    <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">{b.referenceNumber}</span>
                            <StatusBadge status={b.status} />
                          </div>
                          <span className="text-xs text-slate-500">Vehicle: {b.vehicle?.name}</span>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-xs text-slate-500">Total Estimated</span>
                          <div className="text-lg font-black text-emerald-700">₹{b.totalEstimatedAmount}</div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                        <div>
                          <span className="font-bold text-slate-700 block">Customer:</span>
                          <span>{b.customerName}</span>
                          <p className="text-slate-500">{b.customerPhone}</p>
                          <p className="text-slate-500">{b.customerEmail}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700 block">Pickup &amp; Return:</span>
                          <span>{b.pickupDatetime.replace('T', ' ')}</span>
                          <span className="block text-slate-400">to</span>
                          <span>{b.returnDatetime.replace('T', ' ')}</span>
                          <p className="text-slate-500">{b.pickupLocation}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700 block">Documents:</span>
                          <button
                            onClick={() => setViewingDocBooking(b)}
                            className="mt-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>View DL &amp; ID Proofs ({b.documents?.length || 0})</span>
                          </button>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-2">
                          <a
                            href={getWhatsAppLink(`Hello ${b.customerName}, regarding your GoaMate booking ${b.referenceNumber}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp Customer</span>
                          </a>

                          <a
                            href={`tel:${b.customerPhone}`}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>

                          <button
                            onClick={() => setViewingInvoice(b)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                        </div>

                        {/* Status dropdown */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 font-semibold">Change Status:</span>
                          <select
                            value={b.status || 'pending'}
                            onChange={e => handleUpdateBookingStatus(b.id, e.target.value)}
                            className="px-3 py-1 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: DIRECT CUSTOMER LINKS ================= */}
          {activeTab === 'links' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Direct Customer Form Links</h3>
                  <p className="text-xs text-slate-500">
                    Send single-use customer links via WhatsApp with preselected vehicle and dates.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateLinkModal(true)}
                  className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>New Direct Link</span>
                </button>
              </div>

              {linksList.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                  No direct customer booking links created yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {linksList.map(l => {
                    const isExpired = l.expiresAt && new Date(l.expiresAt).getTime() < Date.now();
                    return (
                      <div key={l.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{l.vehicleName}</span>
                            {l.isUsed && <StatusBadge status="used" size="sm" />}
                            {l.isRevoked && <StatusBadge status="revoked" size="sm" />}
                            {isExpired && !l.isUsed && <StatusBadge status="expired" size="sm" />}
                            {!l.isUsed && !l.isRevoked && !isExpired && <StatusBadge status="active" size="sm" />}
                          </div>
                          <div className="text-xs text-slate-500">
                            Created: {new Date(l.createdAt).toLocaleDateString()} &bull; Expires: {l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : 'Never'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {l.token && !l.isUsed && !l.isRevoked && !isExpired && (
                            <>
                              <button
                                onClick={() => handleCopyLink(l.token!, l.id)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1"
                              >
                                {copiedLinkId === l.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedLinkId === l.id ? 'Copied!' : 'Copy Link'}</span>
                              </button>

                              <a
                                href={getWhatsAppLink(`Hello, here is your direct GoaMate booking link for the ${l.vehicleName}: ${window.location.origin}/?token=${l.token}`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Send WhatsApp</span>
                              </a>
                            </>
                          )}

                          {!l.isRevoked && !l.isUsed && (
                            <button
                              onClick={() => handleRevokeLink(l.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold"
                              title="Revoke this link"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal: Add Vehicle */}
        {showAddVehicleModal && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-lg">Add New Fleet Vehicle</h3>
                <button onClick={() => setShowAddVehicleModal(false)}>
                  <XCircle className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateVehicle} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle Name (Brand + Model) *</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.name || ''}
                    onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })}
                    placeholder="e.g. Maruti Suzuki Swift VXI"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={newVehicle.category || 'car'}
                      onChange={e => setNewVehicle({ ...newVehicle, category: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="car">Car (Self-Drive)</option>
                      <option value="bike">Bike / Motorcycle</option>
                      <option value="scooter">Scooter / Activa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Registration Plate *</label>
                    <input
                      type="text"
                      required
                      value={newVehicle.registrationNumber || ''}
                      onChange={e => setNewVehicle({ ...newVehicle, registrationNumber: e.target.value })}
                      placeholder="GA-08-X-1234"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Daily Rental Price (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      min={200}
                      value={newVehicle.dailyPrice ?? 1800}
                      onChange={e => setNewVehicle({ ...newVehicle, dailyPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Security Deposit (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newVehicle.securityDeposit ?? 3000}
                      onChange={e => setNewVehicle({ ...newVehicle, securityDeposit: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Transmission</label>
                    <select
                      value={newVehicle.transmission || 'Manual'}
                      onChange={e => setNewVehicle({ ...newVehicle, transmission: e.target.value as any })}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="Manual">Manual</option>
                      <option value="Automatic">Automatic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fuel Type</label>
                    <select
                      value={newVehicle.fuelType || 'Petrol'}
                      onChange={e => setNewVehicle({ ...newVehicle, fuelType: e.target.value as any })}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Seats</label>
                    <input
                      type="number"
                      value={newVehicle.seats ?? 5}
                      onChange={e => setNewVehicle({ ...newVehicle, seats: Number(e.target.value) })}
                      className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Photo Image *</label>
                  <input
                    type="file"
                    accept="image/*"
                    required={!newVehicle.coverImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewVehicle({ ...newVehicle, coverImage: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {newVehicle.coverImage && (
                    <div className="mt-2">
                      <img src={newVehicle.coverImage} alt="Preview" className="h-24 w-auto rounded-lg border border-slate-200 object-cover" />
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddVehicleModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit for Approval'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Direct Link */}
        {showCreateLinkModal && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base">Generate Direct Booking Link</h3>
                <button onClick={() => setShowCreateLinkModal(false)}>
                  <XCircle className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateLink} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Vehicle *</label>
                  <select
                    required
                    value={newLinkData.vehicleId || ''}
                    onChange={e => setNewLinkData({ ...newLinkData, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">-- Choose Approved Vehicle --</option>
                    {vehiclesList
                      .filter(v => v.status === 'approved')
                      .map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} (₹{v.dailyPrice}/day)
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Optional Preset Pickup Time</label>
                  <DatePicker
                    selected={newLinkData.presetPickupDatetime ? new Date(newLinkData.presetPickupDatetime) : null}
                    onChange={(date: Date | null) => setNewLinkData({ ...newLinkData, presetPickupDatetime: date ? formatInputDate(date) : undefined })}
                    showTimeSelect
                    dateFormat="dd/MM/yyyy h:mm aa"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    wrapperClassName="w-full"
                    isClearable
                    placeholderText="Select date & time"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Optional Preset Return Time</label>
                  <DatePicker
                    selected={newLinkData.presetReturnDatetime ? new Date(newLinkData.presetReturnDatetime) : null}
                    onChange={(date: Date | null) => setNewLinkData({ ...newLinkData, presetReturnDatetime: date ? formatInputDate(date) : undefined })}
                    showTimeSelect
                    dateFormat="dd/MM/yyyy h:mm aa"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    wrapperClassName="w-full"
                    isClearable
                    placeholderText="Select date & time"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link Expiry (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newLinkData.expiryDays ?? 7}
                    onChange={e => setNewLinkData({ ...newLinkData, expiryDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateLinkModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating...' : 'Generate Token'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Protected Customer Documents Preview */}
        {viewingDocBooking && (
          <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase">Protected Document Access</span>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Documents for Booking {viewingDocBooking.referenceNumber}
                  </h3>
                </div>
                <button onClick={() => setViewingDocBooking(null)}>
                  <XCircle className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong>Audit Notice:</strong> Viewing customer identity documents is logged in the GoaMate compliance trail. Never distribute or photograph customer proofs.
              </div>

              <div className="space-y-4">
                {viewingDocBooking.documents?.map(doc => (
                  <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{doc.docType.replace(/_/g, ' ').toUpperCase()} ({doc.fileName})</span>
                      <span className="text-slate-500 text-[11px]">{new Date(doc.uploadedAt).toLocaleString()}</span>
                    </div>

                    {doc.previewUrl ? (
                      doc.mimeType.startsWith('image/') ? (
                        <img src={doc.previewUrl} alt={doc.fileName} className="max-h-64 rounded-lg border border-slate-300 mx-auto" />
                      ) : (
                        <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center text-slate-700">
                          {doc.fileName} (PDF Document)
                        </div>
                      )
                    ) : (
                      <div className="text-xs text-slate-400 italic">Document stored in secure vault.</div>
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

        {/* Modal: View Invoice */}
        {viewingInvoice && (
          <InvoiceModal
            booking={viewingInvoice}
            onClose={() => setViewingInvoice(null)}
          />
        )}
      </div>
    </div>
  );
};
