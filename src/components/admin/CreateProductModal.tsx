'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { createProductFormSchema, type CreateProductFormData } from '@/lib/validators';
import { useCreateProduct } from '@/hooks/useAdminProducts';
import { formatNaira } from '@/lib/money';
import { SHOP } from '@/config/shop';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Curated high-res Unsplash watch photography presets for fast testing / addition
const IMAGE_PRESETS = [
  {
    label: 'Gold Classic',
    category: 'classic',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop',
  },
  {
    label: 'Black Diver',
    category: 'sport',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
  },
  {
    label: 'Silver Chrono',
    category: 'dress',
    url: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?q=80&w=800&auto=format&fit=crop',
  },
  {
    label: 'Modern Smart',
    category: 'smart',
    url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800&auto=format&fit=crop',
  },
];

export function CreateProductModal({ isOpen, onClose }: CreateProductModalProps) {
  const createProductMutation = useCreateProduct();
  const [imagePreviewError, setImagePreviewError] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductFormSchema),
    defaultValues: {
      name: '',
      brand: 'Dave Store',
      description: '',
      priceNaira: 35000,
      category: 'classic',
      stock: 10,
      imageUrl: IMAGE_PRESETS[0].url,
      movement: 'Automatic Movement',
      caseSizeMm: 40,
      strap: 'Stainless Steel',
      waterResistance: '5 ATM (50m)',
      featured: false,
    },
  });

  const watchImageUrl = watch('imageUrl');
  const watchPriceNaira = watch('priceNaira');

  if (!isOpen) return null;

  const handlePresetSelect = (presetUrl: string, presetCat: string) => {
    setValue('imageUrl', presetUrl, { shouldValidate: true });
    if (presetCat) {
      setValue('category', presetCat as CreateProductFormData['category']);
    }
    setImagePreviewError(false);
  };

  const onSubmit = async (data: CreateProductFormData) => {
    try {
      await createProductMutation.mutateAsync({
        name: data.name,
        brand: data.brand || 'Dave Store',
        description: data.description,
        priceKobo: Math.round(data.priceNaira * 100), // integer kobo calculation
        category: data.category,
        stock: data.stock,
        imageUrl: data.imageUrl,
        movement: data.movement || undefined,
        caseSizeMm: data.caseSizeMm ?? undefined,
        strap: data.strap || undefined,
        waterResistance: data.waterResistance || undefined,
        featured: Boolean(data.featured),
        gallery: [data.imageUrl],
      });

      reset();
      onClose();
    } catch {
      // Handled in mutation onError toast
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-[var(--ink)]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-[var(--sand)] rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--sand)] flex items-center justify-between bg-[var(--sand)]/20 shrink-0">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[var(--gold)] block">
              Store Inventory
            </span>
            <h2 className="font-serif text-2xl text-[var(--ink)] font-normal mt-0.5">
              Add New Watch
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--sand)]/50 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
          {/* Quick Image Presets */}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">
              Quick Image Presets or Custom URL
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {IMAGE_PRESETS.map((p) => {
                const isSelected = watchImageUrl === p.url;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePresetSelect(p.url, p.category)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--ink)]'
                        : 'border-[var(--sand)] hover:border-[var(--gold)]/50 bg-[var(--sand)]/20 text-[var(--muted)]'
                    }`}
                  >
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-neutral-200">
                      <Image src={p.url} alt={p.label} fill sizes="32px" className="object-cover" />
                    </div>
                    <span className="text-xs font-medium truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image URL input + preview */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-9 space-y-1">
              <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">
                Image URL <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  {...register('imageUrl')}
                  placeholder="https://images.unsplash.com/photo-..."
                  className={`w-full px-3.5 py-2.5 bg-[var(--sand)]/20 border rounded-lg text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--gold)] ${
                    errors.imageUrl ? 'border-[var(--danger)]' : 'border-[var(--sand)]'
                  }`}
                  onChange={(e) => {
                    register('imageUrl').onChange(e);
                    setImagePreviewError(false);
                  }}
                />
                <ImageIcon className="w-4 h-4 text-[var(--muted)] absolute right-3 top-3 pointer-events-none" />
              </div>
              {errors.imageUrl && (
                <p className="text-xs text-[var(--danger)] mt-1">{errors.imageUrl.message}</p>
              )}
            </div>

            {/* Live Thumbnail Preview */}
            <div className="sm:col-span-3 flex justify-center">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--sand)] bg-neutral-100 flex items-center justify-center">
                {watchImageUrl && !imagePreviewError ? (
                  <Image
                    src={watchImageUrl}
                    alt="Watch Preview"
                    fill
                    sizes="80px"
                    className="object-cover"
                    onError={() => setImagePreviewError(true)}
                  />
                ) : (
                  <span className="text-[10px] text-[var(--muted)] text-center p-1">No preview</span>
                )}
              </div>
            </div>
          </div>

          {/* Watch Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">
                Watch Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Royal Oak Automatic"
                className={`w-full px-3.5 py-2.5 bg-[var(--sand)]/20 border rounded-lg text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--gold)] ${
                  errors.name ? 'border-[var(--danger)]' : 'border-[var(--sand)]'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-[var(--danger)]">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">
                Brand Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                {...register('brand')}
                placeholder="e.g. Dave Store, Casio, Curren"
                className={`w-full px-3.5 py-2.5 bg-[var(--sand)]/20 border rounded-lg text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--gold)] ${
                  errors.brand ? 'border-[var(--danger)]' : 'border-[var(--sand)]'
                }`}
              />
              {errors.brand && (
                <p className="text-xs text-[var(--danger)]">{errors.brand.message}</p>
              )}
            </div>
          </div>

          {/* Category & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">
                Category <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                {...register('category')}
                className="w-full px-3.5 py-2.5 bg-[var(--sand)]/20 border border-[var(--sand)] rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] capitalize"
              >
                {SHOP.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} ({cat.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">
                Available Stock <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="number"
                min="0"
                {...register('stock', { valueAsNumber: true })}
                className={`w-full px-3.5 py-2.5 bg-[var(--sand)]/20 border rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] ${
                  errors.stock ? 'border-[var(--danger)]' : 'border-[var(--sand)]'
                }`}
              />
              {errors.stock && (
                <p className="text-xs text-[var(--danger)]">{errors.stock.message}</p>
              )}
            </div>
          </div>

          {/* Price (in Naira) with live preview */}
          <div className="p-4 rounded-xl bg-[var(--sand)]/30 border border-[var(--sand)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">
                Selling Price (in Naira ₦) <span className="text-[var(--danger)]">*</span>
              </label>
              <span className="font-serif text-lg font-bold text-[var(--gold)]">
                {watchPriceNaira ? formatNaira(Math.round(watchPriceNaira * 100)) : '₦0'}
              </span>
            </div>
            <input
              type="number"
              step="1000"
              min="100"
              {...register('priceNaira', { valueAsNumber: true })}
              placeholder="e.g. 45000"
              className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] ${
                errors.priceNaira ? 'border-[var(--danger)]' : 'border-[var(--sand)]'
              }`}
            />
            {errors.priceNaira && (
              <p className="text-xs text-[var(--danger)]">{errors.priceNaira.message}</p>
            )}
            <p className="text-[11px] text-[var(--muted)]">
              Automatically converted to integer kobo in the database.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">
              Watch Description <span className="text-[var(--danger)]">*</span>
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Highlight the watch's build, dial aesthetics, durability, and style suitability..."
              className={`w-full px-3.5 py-2.5 bg-[var(--sand)]/20 border rounded-lg text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--gold)] ${
                errors.description ? 'border-[var(--danger)]' : 'border-[var(--sand)]'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-[var(--danger)]">{errors.description.message}</p>
            )}
          </div>

          {/* Specifications */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">
              Watch Specifications (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                {...register('movement')}
                placeholder="Movement (e.g. Japanese Quartz, Automatic)"
                className="px-3.5 py-2 bg-[var(--sand)]/20 border border-[var(--sand)] rounded-lg text-xs text-[var(--ink)]"
              />
              <input
                type="number"
                {...register('caseSizeMm', { valueAsNumber: true })}
                placeholder="Case Size in mm (e.g. 40)"
                className="px-3.5 py-2 bg-[var(--sand)]/20 border border-[var(--sand)] rounded-lg text-xs text-[var(--ink)]"
              />
              <input
                type="text"
                {...register('strap')}
                placeholder="Strap (e.g. Stainless Steel Link, Leather)"
                className="px-3.5 py-2 bg-[var(--sand)]/20 border border-[var(--sand)] rounded-lg text-xs text-[var(--ink)]"
              />
              <input
                type="text"
                {...register('waterResistance')}
                placeholder="Water Resistance (e.g. 5 ATM, 50m)"
                className="px-3.5 py-2 bg-[var(--sand)]/20 border border-[var(--sand)] rounded-lg text-xs text-[var(--ink)]"
              />
            </div>
          </div>

          {/* Featured on Homepage toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="featured"
              {...register('featured')}
              className="w-4 h-4 rounded border-[var(--sand)] text-[var(--gold)] focus:ring-[var(--gold)]"
            />
            <label htmlFor="featured" className="text-xs text-[var(--ink)] font-medium cursor-pointer">
              Feature on Homepage Showcase (Top Picks)
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[var(--sand)] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-[var(--sand)] text-xs uppercase tracking-wider font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--sand)]/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProductMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--ink)] hover:bg-[var(--gold-deep)] text-[var(--ivory)] text-xs uppercase tracking-wider font-semibold transition-all shadow-md disabled:opacity-50"
            >
              {createProductMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Adding Watch...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[var(--gold)]" />
                  <span>Save Watch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
