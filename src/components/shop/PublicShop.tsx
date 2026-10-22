import React, { useState } from 'react';
import {
  ShoppingBag,
  MessageCircle,
  MapPin,
  Phone,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { ProductItem, VendorProfile } from '../../types/index.ts';
import { formatNaira, formatWhatsAppPhone, formatDisplayPhone } from '../../lib/format.ts';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  const publishedProducts = products.filter((p) => p.isPublished);

  const handleOpenOrderSheet = (product: ProductItem) => {
    setSelectedProduct(product);
    setQuantity(1);
    setOrderSent(false);
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
    const totalAmount = selectedProduct.price * quantity;
    const phone = formatWhatsAppPhone(vendor.whatsappNumber || vendor.phone);
    const text = encodeURIComponent(
      `Hello ${vendor.businessName}, I would like to order:\n` +
      `${selectedProduct.name} x${quantity}\n` +
      `Total: ${formatNaira(totalAmount)}\n` +
      `Name: ${customerName.trim()}\nPhone: ${customerPhone.trim()}\n` +
      `Address: ${customerAddress.trim() || 'Pickup / arrange with vendor'}\n` +
      'Please confirm availability and payment details.'
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'noopener,noreferrer');
    setOrderSent(true);
    setIsSubmitting(false);
    showToast('WhatsApp opened', 'Your order message is ready to send to the vendor.', 'success');
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
                VENDOR SHOP
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
          {orderSent ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 text-[#0B6B3A] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white">
                  Order message prepared
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed max-w-sm mx-auto">
                  Your message was opened in WhatsApp. The vendor must confirm the order and payment directly.
                </p>
              </div>

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

              <p className="text-sm text-gray-600 dark:text-gray-300">No online payment is collected here. Confirm price, availability, delivery, and payment directly with the vendor.</p>

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
                variant="whatsapp"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                leftIcon={
                  <MessageCircle className="w-5 h-5" />
                }
                className="font-black"
              >
                Send Order to Vendor on WhatsApp
              </Button>
            </form>
          )}
        </BottomSheet>
      )}
    </div>
  );
};
