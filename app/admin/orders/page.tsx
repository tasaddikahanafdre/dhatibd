'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  ShoppingBag, 
  Search, 
  Eye, 
  X, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Zap,
  Loader2,
  ExternalLink,
  CheckSquare,
  Square
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Selected Order for Modal View
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('Pending');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Bulk Selection State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [forwardingIds, setForwardingIds] = useState<Record<string, boolean>>({});
  const [bulkForwarding, setBulkForwarding] = useState(false);
  const [forwardSummary, setForwardSummary] = useState<{
    show: boolean;
    total: number;
    succeeded: number;
    failed: number;
    results: any[];
  } | null>(null);

  const loadOrders = () => {
    setLoading(true);
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setOrders(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('status');
      if (s) {
        setStatusFilter(s);
      }
    }
  }, []);

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.order_status as OrderStatus);
    setTrackingNumberInput(order.tracking_number || '');
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setUpdateLoading(true);

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          tracking_number: trackingNumberInput.trim() || null
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        setSelectedOrder(updated);
        alert('Order status successfully updated');
      }
    } catch {
      alert('Failed to update order status');
    } finally {
      setUpdateLoading(false);
    }
  };

  // 1-Click Forward Single Order to DropBazar BD
  const handleForwardToDropBazar = async (orderId: string) => {
    setForwardingIds(prev => ({ ...prev, [orderId]: true }));

    try {
      const res = await fetch('/api/admin/orders/forward-dropbazar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
      });

      const data = await res.json();

      if (res.ok && data.succeeded_count > 0) {
        const result = data.results[0];
        // Reload orders to get fresh DropBazar metadata
        loadOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? {
            ...prev,
            dropbazar_order_id: result.dropbazar_order_id,
            dropbazar_order_number: result.dropbazar_order_number,
            dropbazar_status: 'placed',
            order_status: 'Processing'
          } : null);
        }
        alert(`Success! Order forwarded to DropBazar BD.\nSupplier Order ID: #${result.dropbazar_order_number || result.dropbazar_order_id}`);
      } else {
        const errMsg = data.results?.[0]?.error || data.error || 'Failed to forward order to DropBazar';
        alert(`Forward Error: ${errMsg}`);
      }
    } catch (err: any) {
      alert(`Network Error: ${err.message || 'Could not connect to DropBazar'}`);
    } finally {
      setForwardingIds(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Bulk 1-Click Forward to DropBazar BD
  const handleBulkForward = async () => {
    if (selectedOrderIds.length === 0) return;

    const confirmMsg = `Are you sure you want to forward ${selectedOrderIds.length} orders directly to DropBazar BD?`;
    if (!confirm(confirmMsg)) return;

    setBulkForwarding(true);

    try {
      const res = await fetch('/api/admin/orders/forward-dropbazar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: selectedOrderIds })
      });

      const data = await res.json();

      if (res.ok) {
        loadOrders();
        setSelectedOrderIds([]);
        setForwardSummary({
          show: true,
          total: data.total_processed,
          succeeded: data.succeeded_count,
          failed: data.failed_count,
          results: data.results || []
        });
      } else {
        alert(`Bulk Forward Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Bulk Forward Error: ${err.message}`);
    } finally {
      setBulkForwarding(false);
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const exportCSV = () => {
    if (orders.length === 0) return;

    const headers = [
      'Order Number', 
      'Date', 
      'Customer Name', 
      'Phone', 
      'District', 
      'Address', 
      'DropBazar ID',
      'DropBazar Status',
      'Payment Method', 
      'Payment Status', 
      'Order Status', 
      'Total (BDT)'
    ];
    const rows = orders.map(o => [
      o.order_number,
      o.created_at || '',
      `"${o.customer_name}"`,
      `"${o.customer_phone}"`,
      `"${o.district || o.shipping_district || ''}"`,
      `"${(o.delivery_address || o.shipping_address || '').replace(/"/g, '""')}"`,
      `"${o.dropbazar_order_number || o.dropbazar_order_id || ''}"`,
      `"${o.dropbazar_status || ''}"`,
      o.payment_method,
      o.payment_status,
      o.order_status,
      o.total || o.total_amount || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dhati-orders-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search) ||
      (o.dropbazar_order_number && String(o.dropbazar_order_number).includes(search));
    const matchesStatus = statusFilter === 'All' || o.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                Order Fulfillment & DropBazar Hub
              </h1>
              <span className="bg-emerald-950 border border-emerald-800/60 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> 1-Click DropBazar API Live
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Process customer orders, forward orders directly to DropBazar BD, and track dispatch status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors border border-neutral-700"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Bulk Action Banner (Appears when items are selected) */}
        {selectedOrderIds.length > 0 && (
          <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 border border-[#eb5a00]/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#eb5a00] text-white flex items-center justify-center text-xs font-black">
                {selectedOrderIds.length}
              </span>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  {selectedOrderIds.length} Orders Selected
                </p>
                <p className="text-[11px] text-neutral-400">
                  Ready for instant 1-click batch placement into DropBazar supplier system
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setSelectedOrderIds([])}
                className="px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={handleBulkForward}
                disabled={bulkForwarding}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#eb5a00] hover:bg-[#d04f00] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {bulkForwarding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Forwarding {selectedOrderIds.length} Orders...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>⚡ Bulk Forward ({selectedOrderIds.length} Orders)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by Order ID, phone or DropBazar ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-600"
            />
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 text-xs px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-hidden focus:border-neutral-600 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <span className="text-xs text-neutral-500 ml-auto">
            Showing <strong className="text-white">{filteredOrders.length}</strong> orders
          </span>
        </div>

        {/* Orders Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button 
                      onClick={toggleSelectAll}
                      className="p-1 hover:text-white text-neutral-500"
                      title={selectedOrderIds.length === filteredOrders.length ? 'Deselect All' : 'Select All'}
                    >
                      {selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length ? (
                        <CheckSquare className="w-4 h-4 text-[#eb5a00]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 font-semibold">Order Number</th>
                  <th className="py-3 px-4 font-semibold">Customer & Phone</th>
                  <th className="py-3 px-4 font-semibold">District / Address</th>
                  <th className="py-3 px-4 font-semibold">DropBazar Status</th>
                  <th className="py-3 px-4 font-semibold">Total</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">1-Click Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-500">
                      No orders found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const isSelected = selectedOrderIds.includes(o.id);
                    const isForwarding = forwardingIds[o.id] || false;
                    const isForwarded = Boolean(o.dropbazar_order_id || o.dropbazar_order_number);

                    return (
                      <tr key={o.id} className={`hover:bg-neutral-800/40 transition-colors ${isSelected ? 'bg-neutral-800/60' : ''}`}>
                        {/* Checkbox */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => toggleSelectOrder(o.id)}
                            className="p-1 text-neutral-500 hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#eb5a00]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Order Number */}
                        <td className="py-3.5 px-3 font-mono font-bold text-white">
                          {o.order_number}
                          <span className="block text-[10px] text-neutral-500 font-sans font-normal">
                            {formatDate(o.created_at)}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-neutral-200">{o.customer_name}</p>
                          <p className="text-[10px] text-neutral-400 font-mono">{o.customer_phone}</p>
                        </td>

                        {/* Address */}
                        <td className="py-3.5 px-4 text-neutral-300 max-w-xs truncate">
                          <span className="font-medium text-white">{o.district || o.shipping_district || 'Dhaka'}</span>
                          <span className="block text-[10px] text-neutral-400 truncate">
                            {o.delivery_address || o.shipping_address}
                          </span>
                        </td>

                        {/* DropBazar Fulfillment Tag */}
                        <td className="py-3.5 px-4">
                          {isForwarded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                              <CheckCircle2 className="w-3 h-3" />
                              DB #{o.dropbazar_order_number || o.dropbazar_order_id}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
                              Not Forwarded
                            </span>
                          )}
                        </td>

                        {/* Total */}
                        <td className="py-3.5 px-4 font-bold text-white">
                          {formatPrice(o.total || o.total_amount)}
                        </td>

                        {/* Order Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            o.order_status === 'Delivered' ? 'bg-emerald-950 text-emerald-400' :
                            o.order_status === 'Shipped' ? 'bg-blue-950 text-blue-400' :
                            o.order_status === 'Processing' ? 'bg-purple-950 text-purple-400' :
                            o.order_status === 'Cancelled' ? 'bg-red-950 text-red-400' :
                            'bg-amber-950 text-amber-400'
                          }`}>
                            {o.order_status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                          {/* 1-Click Forward Button */}
                          {!isForwarded ? (
                            <button
                              onClick={() => handleForwardToDropBazar(o.id)}
                              disabled={isForwarding}
                              className="inline-flex items-center gap-1.5 bg-[#eb5a00] hover:bg-[#d04f00] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                              title="Forward directly to DropBazar BD"
                            >
                              {isForwarding ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Zap className="w-3.5 h-3.5" />
                              )}
                              <span>Forward</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleForwardToDropBazar(o.id)}
                              disabled={isForwarding}
                              className="inline-flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                              title="Re-forward / update on DropBazar"
                            >
                              <span>Re-Forward</span>
                            </button>
                          )}

                          {/* Inspect Modal Button */}
                          <button
                            onClick={() => openOrderModal(o)}
                            className="inline-flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details & Status Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 text-white shadow-2xl space-y-6">
              
              {/* Modal Top */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-tight flex items-center gap-2">
                    <span>Order: {selectedOrder.order_number}</span>
                    {selectedOrder.dropbazar_order_id && (
                      <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/60">
                        DropBazar #{selectedOrder.dropbazar_order_number || selectedOrder.dropbazar_order_id}
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-neutral-400">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* DropBazar One-Click Card */}
              <div className="p-4 bg-gradient-to-r from-neutral-950 to-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#eb5a00]" />
                    DropBazar BD Fulfillment
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {selectedOrder.dropbazar_order_id ? (
                      <span className="text-emerald-400 font-semibold">
                        ✓ Successfully forwarded to DropBazar. Order #{selectedOrder.dropbazar_order_number || selectedOrder.dropbazar_order_id}
                      </span>
                    ) : (
                      'Forward this order directly to DropBazar supplier API for packaging & courier dispatch.'
                    )}
                  </p>
                </div>

                <button
                  onClick={() => handleForwardToDropBazar(selectedOrder.id)}
                  disabled={forwardingIds[selectedOrder.id]}
                  className="shrink-0 inline-flex items-center gap-2 bg-[#eb5a00] hover:bg-[#d04f00] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {forwardingIds[selectedOrder.id] ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Forwarding...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>{selectedOrder.dropbazar_order_id ? 'Re-Forward' : 'Forward to DropBazar'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status Update Control */}
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Update Store Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-neutral-400 block mb-1">Order Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                      className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">Courier Tracking ID</label>
                    <input
                      type="text"
                      placeholder="e.g. STEAD-DH-84912"
                      value={trackingNumberInput}
                      onChange={(e) => setTrackingNumberInput(e.target.value)}
                      className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updateLoading}
                    className="bg-white text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-neutral-200 uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    {updateLoading ? 'Saving...' : 'Apply Status Update'}
                  </button>
                </div>
              </div>

              {/* Customer & Address Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <div>
                  <h4 className="font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Recipient Info</h4>
                  <p className="font-semibold text-white">{selectedOrder.customer_name}</p>
                  <p className="text-neutral-400 font-mono">{selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && <p className="text-neutral-400">{selectedOrder.customer_email}</p>}
                </div>
                <div>
                  <h4 className="font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Delivery Address</h4>
                  <p className="text-neutral-300">{selectedOrder.delivery_address || selectedOrder.shipping_address}</p>
                  <p className="text-white font-semibold mt-0.5">{selectedOrder.district || selectedOrder.shipping_district || 'Dhaka'}</p>
                  {(selectedOrder.notes || selectedOrder.customer_notes) && (
                    <p className="text-neutral-400 italic mt-1.5">Note: &quot;{selectedOrder.notes || selectedOrder.customer_notes}&quot;</p>
                  )}
                </div>
              </div>

              {/* Items List with Selected Color/Version & Size */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Ordered Items</h4>
                <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl overflow-hidden text-xs">
                  {selectedOrder.items?.map((item: any, idx: number) => {
                    const optionsStr = item.selected_options 
                      ? Object.entries(item.selected_options).map(([k, v]) => `${k}: ${v}`).join(' | ')
                      : (item.variant_details || item.variant?.name || '');

                    return (
                      <div key={idx} className="p-3 bg-neutral-950 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.product_name}
                              className="w-10 h-10 rounded-lg object-cover border border-neutral-800 shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-white">{item.product_name}</p>
                            {optionsStr && (
                              <p className="text-[11px] text-[#eb5a00] font-bold">
                                {optionsStr}
                              </p>
                            )}
                            <p className="text-[11px] text-neutral-400">
                              Qty: {item.quantity} × {formatPrice(item.product_price || item.price)}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-white shrink-0">
                          {formatPrice(item.subtotal || (item.product_price || item.price) * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals */}
              <div className="pt-2 text-xs space-y-1.5 text-neutral-400 border-t border-neutral-800">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="text-white">{formatPrice(selectedOrder.delivery_charge)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-neutral-800">
                  <span>Grand Total</span>
                  <span>{formatPrice(selectedOrder.total || selectedOrder.total_amount)}</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Bulk Forward Results Summary Modal */}
        {forwardSummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-base font-bold uppercase tracking-tight flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#eb5a00]" />
                  <span>DropBazar Forward Report</span>
                </h3>
                <button onClick={() => setForwardSummary(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  <p className="text-lg font-black text-white">{forwardSummary.total}</p>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Total</p>
                </div>
                <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/60">
                  <p className="text-lg font-black text-emerald-400">{forwardSummary.succeeded}</p>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Succeeded</p>
                </div>
                <div className="bg-red-950/60 p-3 rounded-xl border border-red-800/60">
                  <p className="text-lg font-black text-red-400">{forwardSummary.failed}</p>
                  <p className="text-[10px] text-red-400 uppercase tracking-wider font-bold">Failed</p>
                </div>
              </div>

              {/* Result Details List */}
              <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
                {forwardSummary.results.map((res: any, idx: number) => (
                  <div 
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      res.success 
                        ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' 
                        : 'bg-red-950/40 border-red-800/50 text-red-300'
                    }`}
                  >
                    <div>
                      <p className="font-mono font-bold text-white">{res.order_number}</p>
                      {res.success ? (
                        <p className="text-[11px] text-emerald-400">DropBazar Order #{res.dropbazar_order_number || res.dropbazar_order_id}</p>
                      ) : (
                        <p className="text-[11px] text-red-400">{res.error}</p>
                      )}
                    </div>
                    {res.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setForwardSummary(null)}
                className="w-full py-2.5 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
