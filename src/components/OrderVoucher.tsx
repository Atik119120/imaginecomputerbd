import { forwardRef } from 'react';
import logo from '@/assets/logo.webp';

interface OrderItem {
  product_name: string;
  product_image?: string;
  price: number;
  quantity: number;
  selected_size?: string;
  selected_color?: string;
}

interface OrderVoucherProps {
  orderId: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  deliveryArea: string;
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount?: number;
  grandTotal: number;
  orderDate: Date;
  status?: string;
}

const paymentLabel = (method: string) => {
  switch (method) {
    case 'bkash':
      return 'bKash';
    case 'nagad':
      return 'Nagad';
    case 'rocket':
      return 'Rocket';
    case 'cod':
    default:
      return 'Cash on Delivery';
  }
};

const money = (n: number) => `৳${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const OrderVoucher = forwardRef<HTMLDivElement, OrderVoucherProps>(
  (
    {
      orderId,
      customerName,
      phone,
      email,
      address,
      city,
      deliveryArea,
      paymentMethod,
      items,
      subtotal,
      shippingCost,
      discount = 0,
      grandTotal,
      orderDate,
      status,
    },
    ref
  ) => {
    const shortId = orderId.slice(0, 8).toUpperCase();

    return (
      <div
        ref={ref}
        className="voucher bg-white text-black mx-auto w-full max-w-3xl"
        style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
      >
        {/* Top bar */}
        <div style={{ background: '#FFCC00', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src={logo} alt="Gadget er Dokan" style={{ height: 68, width: 'auto', objectFit: 'contain' }} />
            <div>
              <p style={{ margin: 0, color: '#111111', fontSize: 18, fontWeight: 800, letterSpacing: '0.5px' }}>GADGET ER DOKAN</p>
              <p style={{ margin: 0, color: '#111111', opacity: 0.7, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Genuine Tech · Bangladesh</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, color: '#111111', fontSize: 20, fontWeight: 800, letterSpacing: '2px' }}>ORDER RECEIVED</p>
            <p style={{ margin: '2px 0 0', color: '#111111', opacity: 0.75, fontSize: 11, letterSpacing: '1px' }}>
              {orderDate.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div style={{ height: 4, background: '#111111' }} />


        <div style={{ padding: '22px 24px' }}>
          {/* Order meta */}
          <div style={{ border: '1px solid #e6e6e6', borderRadius: 8, padding: '14px 16px', marginBottom: 18 }}>
            <p style={{ margin: 0, fontSize: 10, letterSpacing: '1.5px', color: '#777', textTransform: 'uppercase' }}>Order ID</p>
            <p style={{ margin: '3px 0 0', fontSize: 15, fontWeight: 700, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.4 }}>
              #{shortId} <span style={{ fontSize: 11, fontWeight: 400, color: '#666' }}>({orderId})</span>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 24px', marginTop: 10, fontSize: 12 }}>
              <span><strong>Payment:</strong> {paymentLabel(paymentMethod)}</span>
              <span><strong>Delivery:</strong> {deliveryArea === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}</span>
              {status && <span><strong>Status:</strong> {status.charAt(0).toUpperCase() + status.slice(1)}</span>}
            </div>
          </div>

          {/* Customer + shipping */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
            <div style={{ flex: '1 1 220px', border: '1px solid #e6e6e6', borderRadius: 8, padding: '12px 14px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 10, letterSpacing: '1.5px', color: '#777', textTransform: 'uppercase' }}>Customer</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{customerName}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#444' }}>{phone}</p>
              {email && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#444', wordBreak: 'break-all' }}>{email}</p>}
            </div>
            <div style={{ flex: '1 1 220px', border: '1px solid #e6e6e6', borderRadius: 8, padding: '12px 14px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 10, letterSpacing: '1.5px', color: '#777', textTransform: 'uppercase' }}>Shipping Address</p>
              <p style={{ margin: 0, fontSize: 12, color: '#222', lineHeight: 1.5 }}>{address}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#444' }}>{city}</p>
            </div>
          </div>

          {/* Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <thead>
              <tr style={{ background: '#111111' }}>
                <th style={{ textAlign: 'left', padding: '9px 10px', fontSize: 10, letterSpacing: '1px', color: '#FFCC00', textTransform: 'uppercase' }}>Product</th>
                <th style={{ textAlign: 'center', padding: '9px 10px', fontSize: 10, letterSpacing: '1px', color: '#FFCC00', textTransform: 'uppercase' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '9px 10px', fontSize: 10, letterSpacing: '1px', color: '#FFCC00', textTransform: 'uppercase' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '9px 10px', fontSize: 10, letterSpacing: '1px', color: '#FFCC00', textTransform: 'uppercase' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '14px 10px', fontSize: 12, textAlign: 'center', color: '#777', borderBottom: '1px solid #eee' }}>
                    No items found for this order.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eeeeee' }}>
                    <td style={{ padding: '10px', fontSize: 12.5, verticalAlign: 'top' }}>
                      <span style={{ fontWeight: 600 }}>{item.product_name}</span>
                      {(item.selected_size || item.selected_color) && (
                        <span style={{ display: 'block', fontSize: 11, color: '#777', marginTop: 2 }}>
                          {[item.selected_color, item.selected_size].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px', fontSize: 12.5, textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '10px', fontSize: 12.5, textAlign: 'right' }}>{money(item.price)}</td>
                    <td style={{ padding: '10px', fontSize: 12.5, textAlign: 'right', fontWeight: 700 }}>{money(item.price * item.quantity)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <table style={{ width: 280, borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '5px 0', fontSize: 12.5, color: '#555' }}>Subtotal</td>
                  <td style={{ padding: '5px 0', fontSize: 12.5, textAlign: 'right' }}>{money(subtotal)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 0', fontSize: 12.5, color: '#555' }}>Delivery Charge</td>
                  <td style={{ padding: '5px 0', fontSize: 12.5, textAlign: 'right' }}>{money(shippingCost)}</td>
                </tr>
                {discount > 0 && (
                  <tr>
                    <td style={{ padding: '5px 0', fontSize: 12.5, color: '#c62828' }}>Discount</td>
                    <td style={{ padding: '5px 0', fontSize: 12.5, textAlign: 'right', color: '#c62828' }}>-{money(discount)}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '10px 8px', background: '#111111', color: '#FFCC00', fontSize: 13, fontWeight: 800, letterSpacing: '1px' }}>GRAND TOTAL</td>
                  <td style={{ padding: '10px 8px', background: '#111111', color: '#FFCC00', fontSize: 15, fontWeight: 800, textAlign: 'right' }}>{money(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment note */}
          <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 8, background: '#fff9e0', border: '1px solid #ffe27a', fontSize: 12.5, textAlign: 'center' }}>
            {paymentMethod === 'cod' ? (
              <span><strong>Amount to pay on delivery:</strong> {money(grandTotal)}</span>
            ) : (
              <span><strong>Paid via {paymentLabel(paymentMethod)}:</strong> {money(grandTotal)}</span>
            )}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #e6e6e6', textAlign: 'center', fontSize: 10.5, color: '#777', lineHeight: 1.7 }}>
            <p style={{ margin: 0 }}>Thank you for shopping with Gadget er Dokan.</p>
            <p style={{ margin: 0 }}>Support: admin@gadgeterdokanbd.com · gadgeterdokanbd.com</p>
            <p style={{ margin: 0 }}>This is a computer-generated document. No signature required.</p>
          </div>
        </div>
      </div>
    );
  }
);

OrderVoucher.displayName = 'OrderVoucher';
