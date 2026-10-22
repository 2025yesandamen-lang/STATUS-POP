import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { TEMPLATES } from '../../lib/templates.ts';
import { FlyerCanvas } from '../editor/FlyerCanvas.tsx';
import { FlyerTemplate, UserFlyerData } from '../../types/index.ts';
import { Button } from '../ui/Button.tsx';

export interface TemplateBrowserProps {
  onBack: () => void;
  onSelectTemplate: (template: FlyerTemplate) => void;
}

export const TemplateBrowser: React.FC<TemplateBrowserProps> = ({
  onBack,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const sampleData: UserFlyerData = {
    productName: 'Original Nike Air Max Sneakers',
    headline: 'SUPER CLEARANCE SALE!',
    subtitle: 'Tested London Used • Free Delivery In Lagos',
    price: 32000,
    oldPrice: 42000,
    discountPct: 24,
    businessName: 'CHIDI DRIP LAGOS',
    phone: '08023456789',
    productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    productImages: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80',
    ],
    hasRemovedBg: false,
    aspectRatio: '9:16',
    selectedTemplateId: 'bold-sale-01',
    sector: 'fashion',
    category: 'fashion',
  };

  const categories = [
    'all',
    'mechanic',
    'artisan',
    'church',
    'barber',
    'thrift',
    'food',
    'fashion',
    'luxury',
    'tech',
    'general',
  ];

  const filteredTemplates =
    selectedCategory === 'all'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F1318] text-gray-900 dark:text-gray-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="tap-target p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white">
                Dev Template Gallery ({TEMPLATES.length} Templates)
              </h1>
              <p className="text-xs text-gray-500">
                Inspect every flyer template rendered with standard 1080x1920 layout rules
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`tap-target px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#0B6B3A] text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center space-y-4"
            >
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5A36]">
                  {tmpl.category} • {tmpl.photoSlots > 1 ? `${tmpl.photoSlots} Photos` : 'Single Photo'}
                </span>
                <h3 className="font-bold text-base text-gray-900 dark:text-white mt-0.5">
                  {tmpl.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-1">{tmpl.description}</p>
              </div>

              {/* Live Canvas Preview at 21% scale */}
              <div className="flex justify-center">
                <FlyerCanvas
                  template={tmpl}
                  userData={{ ...sampleData, selectedTemplateId: tmpl.id }}
                  scale={0.21}
                  showWatermark={true}
                />
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => onSelectTemplate(tmpl)}
              >
                Use This Template
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
