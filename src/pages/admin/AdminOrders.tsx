import { useState, useEffect, useRef } from 'react';
import { Eye, Search, RefreshCw, Truck, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Order {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  address: string;
  city: string;
  total_amount: number;
  shipping_cost: number;
  status: string;
  notes: string | null;
  created_at: string;
  consignment_id?: string | null;
  tracking_code?: string | null;
  courier_status?: string | null;
  courier_sent_at?: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  selected_size: string | null;
  selected_color: string | null;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-warning text-white' },
  { value: 'processing', label: 'Processing', color: 'bg-info text-white' },
  { value: 'shipped', label: 'Shipped', color: 'bg-primary text-primary-foreground' },
  { value: 'delivered', label: 'Delivered', color: 'bg-accent text-accent-foreground' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-destructive text-destructive-foreground' },
];

const courierStatusLabel = (s?: string | null) => {
  if (!s) return 'Not Sent';
  const map: Record<string, string> = {
    in_review: 'In Review',
    pending: 'Pending',
    delivered_approval_pending: 'Delivered (Approval)',
    partial_delivered_approval_pending: 'Partial Delivered (Approval)',
    cancelled_approval_pending: 'Cancel (Approval)',
    delivered: 'Delivered',
    partial_delivered: 'Partial Delivered',
    cancelled: 'Cancelled',
    hold: 'Hold',
    unknown: 'Unknown',
  };
  return map[s] || s;
};

const courierStatusColor = (s?: string | null) => {
  if (!s) return 'bg-secondary text-secondary-foreground';
  if (s === 'delivered') return 'bg-green-600 text-white';
  if (s === 'cancelled') return 'bg-destructive text-destructive-foreground';
  if (s === 'hold') return 'bg-yellow-600 text-white';
  if (s === 'in_review' || s === 'pending') return 'bg-blue-500 text-white';
  return 'bg-primary text-primary-foreground';
};

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [bulkDispatching, setBulkDispatching] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const { toast } = useToast();
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Auto-refresh every 10s for live status
  useEffect(() => {
    pollingRef.current = window.setInterval(() => {
      fetchOrders(true);
    }, 10000);
    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, []);

  // Background courier status sync every 30s
  useEffect(() => {
    const id = window.setInterval(() => {
      supabase.functions.invoke('steadfast', { body: { action: 'refresh_status' } }).catch(() => {});
    }, 30000);
    return () => window.clearInterval(id);
  }, []);

  const fetchOrders = async (silent = false) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (!silent) toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    await fetchOrderItems(order.id);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Order status updated' });

      // Notify the customer on every status change. Email failure must never block the update.
      const order = orders.find((o) => o.id === orderId);
      if (order?.email) {
        supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'order_status',
            to: order.email,
            data: {
              orderId: order.id,
              customerName: order.full_name,
              status: newStatus,
              total: order.total_amount,
              trackingCode: order.tracking_code || null,
            },
          },
        }).then(({ error }) => {
          if (error) console.error('Status email failed:', error);
          else toast({ title: 'Customer notified', description: `Email sent to ${order.email}` });
        }).catch((e) => console.error('Status email failed:', e));
      }

      fetchOrders();

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const dispatchOne = async (orderId: string) => {
    setDispatchingId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('steadfast', {
        body: { action: 'create_order', order_id: orderId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: 'Sent to Steadfast', description: `Tracking: ${(data as any).consignment?.tracking_code}` });
      fetchOrders();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message || 'Dispatch failed', variant: 'destructive' });
    } finally {
      setDispatchingId(null);
    }
  };

  const bulkDispatch = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast({ title: 'Select orders', description: 'No orders selected', variant: 'destructive' });
      return;
    }
    setBulkDispatching(true);
    try {
      const { data, error } = await supabase.functions.invoke('steadfast', {
        body: { action: 'bulk_create', order_ids: ids },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({
        title: 'Bulk dispatch complete',
        description: `${(data as any).dispatched}/${(data as any).total} orders sent`,
      });
      setSelectedIds(new Set());
      fetchOrders();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message || 'Bulk dispatch failed', variant: 'destructive' });
    } finally {
      setBulkDispatching(false);
    }
  };

  const refreshCourierStatus = async () => {
    setRefreshingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('steadfast', {
        body: { action: 'refresh_status' },
      });
      if (error) throw error;
      toast({ title: 'Status refreshed', description: `${(data as any)?.updated?.length || 0} updates` });
      fetchOrders();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setRefreshingStatus(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const eligible = filteredOrders.filter(o => !o.consignment_id).map(o => o.id);
    if (eligible.every(id => selectedIds.has(id)) && eligible.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligible));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return (
      <Badge className={statusConfig?.color || 'bg-secondary'}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.tracking_code || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold">Orders</h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="default"
            onClick={bulkDispatch}
            disabled={bulkDispatching || selectedIds.size === 0}
          >
            {bulkDispatching ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Truck size={18} className="mr-2" />}
            Bulk Send to Steadfast ({selectedIds.size})
          </Button>
          <Button variant="outline" onClick={refreshCourierStatus} disabled={refreshingStatus}>
            {refreshingStatus ? <Loader2 size={18} className="mr-2 animate-spin" /> : <RefreshCw size={18} className="mr-2" />}
            Refresh Courier Status
          </Button>
          <Button variant="outline" onClick={() => fetchOrders()}>
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, order ID or tracking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No orders found.
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        filteredOrders.filter(o => !o.consignment_id).length > 0 &&
                        filteredOrders.filter(o => !o.consignment_id).every(o => selectedIds.has(o.id))
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(order.id)}
                        disabled={!!order.consignment_id}
                        onCheckedChange={() => toggleSelect(order.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{order.full_name}</TableCell>
                    <TableCell>{order.phone}</TableCell>
                    <TableCell className="font-semibold">
                      ৳{order.total_amount}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue>{getStatusBadge(order.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={courierStatusColor(order.courier_status)}>
                          {courierStatusLabel(order.courier_status)}
                        </Badge>
                        {order.tracking_code && (
                          <a
                            href={`https://steadfast.com.bd/t/${order.tracking_code}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                          >
                            {order.tracking_code} <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye size={18} />
                        </Button>
                        {!order.consignment_id ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => dispatchOne(order.id)}
                            disabled={dispatchingId === order.id}
                          >
                            {dispatchingId === order.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <><Truck size={14} className="mr-1" /> Send</>
                            )}
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-xs">Sent</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-bold text-lg">৳{selectedOrder.total_amount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Courier Status</p>
                  <Badge className={courierStatusColor(selectedOrder.courier_status)}>
                    {courierStatusLabel(selectedOrder.courier_status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Tracking Code</p>
                  <p className="font-mono">{selectedOrder.tracking_code || '—'}</p>
                </div>
              </div>

              {/* Steadfast actions */}
              {!selectedOrder.consignment_id && (
                <Button
                  className="w-full"
                  onClick={() => dispatchOne(selectedOrder.id)}
                  disabled={dispatchingId === selectedOrder.id}
                >
                  {dispatchingId === selectedOrder.id ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Sending...</>
                  ) : (
                    <><Truck size={16} className="mr-2" /> Send to Steadfast</>
                  )}
                </Button>
              )}

              {/* Customer info */}
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p>{selectedOrder.full_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p>{selectedOrder.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p>{selectedOrder.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City</p>
                    <p>{selectedOrder.city}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Address</p>
                    <p>{selectedOrder.address}</p>
                  </div>
                  {selectedOrder.notes && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Notes</p>
                      <p>{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order items */}
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-3">Order Items</h4>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg"
                    >
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.selected_size && `Size: ${item.selected_size}`}
                          {item.selected_size && item.selected_color && ' | '}
                          {item.selected_color && `Color: ${item.selected_color}`}
                        </p>
                        <p className="text-sm">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">৳{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                {/* Order summary */}
                <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>৳{selectedOrder.total_amount - selectedOrder.shipping_cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>৳{selectedOrder.shipping_cost}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                    <span>Total</span>
                    <span>৳{selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>

              {/* Update status */}
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-3">Update Status</h4>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
