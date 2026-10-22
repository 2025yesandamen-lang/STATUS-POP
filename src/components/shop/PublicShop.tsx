import React, { useState } from 'react';
import {
  ShoppingBag,
  MessageCircle,
  MapPin,
  Phone,
  ArrowLeft,
  CheckCircle2,
  PackageCheck,
  CreditCard,
  Building2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { ProductItem, VendorProfile } from '../../types/index.ts';
import { formatNaira, formatWhatsAppPhone, formatDisplayPhone } from '../../lib/format.ts';
import { createOrder } from '../../lib/storage.ts';
import { Button } from '../ui/Button.tsx';
import { BottomSheet } from '../ui/BottomSheet.tsx';
import { useToast } from '../ui/Toast.tsx';

export interface PublicShopProps {
  vendor: VendorProfile;
  products: ProductItem[];
  onBackToApp?: () => void;
  onSelectProductForFlyer?: (product: ProductItem) => void;
}

export const PublicShop: React.FC<PublicShopProps> = ({
  vendor,
  products,
  onBackToApp,
  onSelectProductForFlyer,
}) => {
  const { showToast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'paystack_split'>('paystack_split');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);

  const publishedProducts = products.filter((p) => p.isPublished);

  const handleOpenOrderSheet = (product: ProductItem) => {
    setSelectedProduct(product);
    setQuantity(1);
    setOrderSuccess(null);
    setPayUrl(null);
  };

  const handleDirectWhatsAppOrder = (product: ProductItem) => {
    const phone = formatWhatsAppPhone(vendor.whatsappNumber || vendor.phone);
    const msg = encodeURIComponent(
      `Hello ${vendor.businessName}!\n\nI saw *${product.name}* on your StatusPop store (${formatNaira(
        product.price
      )}).\nIs it still available? I want to order!`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('Missing details', 'Please enter your name and phone number.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const totalAmount = selectedProduct.price * quantity;
      const order = createOrder({
        vendorId: vendor.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim() || 'Pickup / Arrange on WhatsApp',
        items: [
          {
            id: `item_${Date.now()}`,
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            price: selectedProduct.price,
            quantity: quantity,
            image: selectedProduct.image,
          },
        ],
        totalAmount,
        status: paymentMethod === 'paystack_split' ? 'confirmed' : 'pending',
      });

      // If user selected Paystack Direct Split payment
      if (paymentMethod === 'paystack_split') {
        const checkoutRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalAmount,
            plan: 'customer_order',
            email: `${customerPhone.replace(/\D/g, '')}@statuspop.ng`,
            subaccount: vendor.paystackSubaccountCode,
            vendorBusinessName: vendor.businessName,
            settlementBank: vendor.bankName,
            accountNumber: vendor.accountNumber,
            orderId: order.orderNumber,
          }),
        });

        if (checkoutRes.ok) {
          const checkData = await checkoutRes.json();
          if (checkData.data?.authorization_url) {
            setPayUrl(checkData.data.authorization_url);
            setOrderSuccess(order.orderNumber);
            setIsSubmitting(false);
            showToast(
              'Order Created!',
              `Proceeding to Paystack. Payout settles directly into ${vendor.businessName}'s ${vendor.bankName || 'bank'} account.`,
              'success'
            );
            return;
          }
        }
      }

      setIsSubmitting(false);
      setOrderSuccess(order.orderNumber);

      // Open WhatsApp with order summary for vendor
      const phone = formatWhatsAppPhone(vendor.whatsappNumber || vendor.phone);
      const text = encodeURIComponent(
        `*NEW ORDER: #${order.orderNumber}*\n` +
          `Customer: ${customerName}\n` +
          `Phone: ${customerPhone}\n` +
          `Item: ${selectedProduct.name} (x${quantity})\n` +
          `Total: ${formatNaira(totalAmount)}\n` +
          `Payment: Direct WhatsApp / Pay on Delivery\n` +
          `Address: ${customerAddress || 'Direct Delivery'}\n\n` +
          `Kindly confirm availability & delivery time!`
      );

      showToast('Order Placed!', `Order #${order.orderNumber} sent to vendor.`, 'success');
      setTimeout(() => {
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
      }, 1000);
    } catch (e) {
      setIsSubmitting(false);
      showToast('Error', 'Could not submit order, please message vendor directly.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F1318] text-gray-900 dark:text-gray-100 pb-16">
      {/* Top Banner with Store Info */}
      <div className="bg-[#0B6B3A] text-white pt-6 pb-8 px-4 rounded-b-3xl shadow-lg relative">
        <div className="max-w-2xl mx-auto">
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="tap-target mb-3 inline-flex items-center text-xs font-semibold text-white/90 hover:text-white bg-black/20 px-3 py-1.5 rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Flyer Creator
            </button>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FFC93C] text-[#111827] text-[10px] font-black uppercase tracking-wider mb-2">
                VERIFIED NAIJA VENDOR
              </span>
              <h1 className="text-2xl font-black tracking-tight">{vendor.businessName}</h1>
              {vendor.bio && (
                <p className="text-xs text-white/85 mt-1 leading-relaxed max-w-md">{vendor.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-white/80">
                {vendor.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#FFC93C]" /> {vendor.address}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#FFC93C]" />{' '}
                  {formatDisplayPhone(vendor.phone)}
                </span>
                {vendor.bankName && (
                  <span className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FFC93C]" /> Direct Bank Split: {vendor.bankName}
                  </span>
                )}
              </div>
            </div>

            <a
              href={`https://wa.me/${formatWhatsAppPhone(vendor.whatsappNumber || vendor.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target shrink-0 p-3 bg-[#25D366] text-white rounded-2xl shadow-md hover:bg-[#128C7E] transition-transform active:scale-95"
            >
              <MessageCircle className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#0B6B3A]" /> Available Products
          </h2>
          <span className="text-xs font-bold text-gray-500">{publishedProducts.length} items</span>
        </div>

        {publishedProducts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-bold text-gray-700 dark:text-gray-300">No products uploaded yet</h3>
            <p className="text-xs text-gray-500 mt-1">
              Check back soon or message the vendor on WhatsApp!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {publishedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-[#1A202C] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-4/3 relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                      {product.category}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-1">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                    <div className="pt-2 flex items-baseline gap-2">
                      <span className="font-black text-base text-[#0B6B3A] dark:text-[#FFC93C]">
                        {formatNaira(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatNaira(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 pt-0 flex gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => handleOpenOrderSheet(product)}
                    className="font-bold text-xs"
                  >
                    Order Now
                  </Button>

                  {onSelectProductForFlyer && (
                    <button
                      type="button"
                      onClick={() => onSelectProductForFlyer(product)}
                      className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100"
                      title="Make WhatsApp Flyer for this item"
                    >
                      Make Flyer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Order BottomSheet */}
      {selectedProduct && (
        <BottomSheet
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          title={`Order: ${selectedProduct.name}`}
        >
          {orderSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 text-[#0B6B3A] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white">
                  Order #{orderSuccess} Placed!
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed max-w-sm mx-auto">
                  {payUrl
                    ? `Payment splits straight into ${vendor.businessName}'s ${vendor.bankName || 'bank'} account. Click below to complete checkout.`
                    : `We forwarded your order details to ${vendor.businessName} via WhatsApp. They will reply shortly!`}
                </p>
              </div>

              {payUrl && (
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={() => window.open(payUrl, '_blank')}
                  leftIcon={<CreditCard className="w-5 h-5" />}
                  className="font-black text-sm shadow-md"
                >
                  Pay with Paystack (Card / USSD / OPay) →
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setSelectedProduct(null)}
              >
                Close & Continue Browsing
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-14 h-14 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                    {selectedProduct.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-sm text-[#0B6B3A] dark:text-[#FFC93C]">
                      {formatNaira(selectedProduct.price * quantity)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-7 h-7 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-7 h-7 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Choice (Paystack Direct Split vs WhatsApp) */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2">
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block">
                  Choose Payment Method:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paystack_split')}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === 'paystack_split'
                        ? 'border-[#0B6B3A] bg-emerald-50/60 dark:bg-emerald-950/30 text-[#0B6B3A] dark:text-emerald-300 font-bold shadow-xs'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs">
                      <CreditCard className="w-3.5 h-3.5 text-[#FF5A36]" />
                      <span>⚡ Pay Online</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Card, USSD, OPay, Bank Transfer
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('whatsapp')}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === 'whatsapp'
                        ? 'border-[#0B6B3A] bg-emerald-50/60 dark:bg-emerald-950/30 text-[#0B6B3A] dark:text-emerald-300 font-bold shadow-xs'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs">
                      <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>💬 WhatsApp Pay</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Pay on Delivery / Direct Transfer
                    </p>
                  </button>
                </div>

                {paymentMethod === 'paystack_split' && (
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 pt-0.5">
                    <ShieldCheck className="w-3 h-3 shrink-0" />
                    Funds deposit straight into {vendor.businessName}'s {vendor.bankName || 'bank'} account.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adeola Johnson"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#0B6B3A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  WhatsApp Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 08012345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#0B6B3A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Delivery Address / Area
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Yaba, Lagos / Lekki Phase 1"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#0B6B3A] outline-none"
                />
              </div>

              <Button
                type="submit"
                variant={paymentMethod === 'paystack_split' ? 'primary' : 'whatsapp'}
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                leftIcon={
                  paymentMethod === 'paystack_split' ? (
                    <CreditCard className="w-5 h-5" />
                  ) : (
                    <MessageCircle className="w-5 h-5" />
                  )
                }
                className="font-black"
              >
                {paymentMethod === 'paystack_split'
                  ? `Pay ${formatNaira(selectedProduct.price * quantity)} Online (Direct Split)`
                  : 'Send Order to Vendor on WhatsApp'}
              </Button>
            </form>
          )}
        </BottomSheet>
      )}
    </div>
  );
};
