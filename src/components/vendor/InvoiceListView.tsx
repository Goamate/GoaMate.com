import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  IndianRupee,
  Calendar,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Invoice } from '../../types';

interface InvoiceListViewProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  userRole?: 'vendor' | 'super_admin';
}

export const InvoiceListView: React.FC<InvoiceListViewProps> = ({
  invoices,
  onViewInvoice,
  onRefresh,
  isLoading = false,
  userRole = 'vendor',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partially_paid' | 'pending'>('all');

  // Filtered list
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.bookingReference.toLowerCase().includes(q) ||
        inv.customerDetails?.name.toLowerCase().includes(q) ||
        inv.customerDetails?.phone.toLowerCase().includes(q) ||
        inv.vehicleDetails?.name.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [invoices, statusFilter, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const totalCollected = invoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
    const totalPending = invoices.reduce((sum, i) => sum + (i.amountDue || 0), 0);
    const paidCount = invoices.filter(i => i.paymentStatus === 'paid').length;
    const pendingCount = invoices.filter(i => i.paymentStatus === 'pending').length;

    return { totalInvoiced, totalCollected, totalPending, paidCount, pendingCount };
  }, [invoices]);

  const getStatusBadge = (status: Invoice['paymentStatus']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            PAID
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            PARTIAL
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Invoiced</span>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">₹{stats.totalInvoiced.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-1">{invoices.length} invoices issued</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Collected Revenue</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">₹{stats.totalCollected.toLocaleString('en-IN')}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">{stats.paidCount} fully paid</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending Receivables</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">₹{stats.totalPending.toLocaleString('en-IN')}</p>
          <p className="text-xs text-amber-600 font-semibold mt-1">{stats.pendingCount} awaiting payment</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">System Security</span>
            <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-800 mt-2">Server Calculated</p>
          <p className="text-xs text-slate-500 mt-1">Dual-Copy Protected (Customer / Internal)</p>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search invoice number, booking, customer..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({invoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Paid ({stats.paidCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'pending'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending ({stats.pendingCount})
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh invoices"
              className="p-2 ml-auto text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No invoices found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'Invoices will appear here once generated for confirmed bookings.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      <span className="text-emerald-700 font-black">{inv.invoiceNumber}</span>
                      <span className="block text-[11px] text-slate-400 font-normal mt-0.5">
                        {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {inv.bookingReference}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900">{inv.customerDetails?.name}</p>
                      <p className="text-xs text-slate-500">{inv.customerDetails?.phone}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-800">{inv.vehicleDetails?.name}</p>
                      <p className="text-xs text-slate-500">{inv.rentalDetails?.totalDurationDays} days</p>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-slate-900">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-emerald-700">
                      ₹{inv.amountPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(inv.paymentStatus)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View & Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
