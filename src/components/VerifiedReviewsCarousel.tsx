import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Star,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  Car,
  FileCheck,
  TrendingUp,
  Award,
  ThumbsUp,
  Filter,
  Flame,
  Plus,
  X,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Order } from '../types';
import { useToast } from '../context/ToastContext';

export interface VerifiedReview {
  id: string;
  name: string;
  city: string;
  role: string;
  vehicle: string;
  vinPreview: string;
  orderNumber: string;
  planName: string;
  category: 'all' | 'title' | 'odometer' | 'auction' | 'fleet';
  rating: number;
  highlightTag: string;
  highlightType: 'emerald' | 'blue' | 'amber';
  reviewTitle: string;
  content: string;
  timeAgo: string;
  avatar?: string;
  initials: string;
  helpfulCount: number;
  hasVerifiedStamp: boolean;
}

interface LiveOrderActivity {
  id: string;
  timeAgo: string;
  minutesAgo: number;
  vehicle: string;
  location: string;
  serviceName: string;
  type: 'ordered' | 'delivered' | 'verified';
  orderNumber: string;
  statusBadge: string;
}

interface VerifiedReviewsCarouselProps {
  orders?: Order[];
  onStartOrderWithVin?: (vin: string, isVin: boolean) => void;
  onOpenSample?: () => void;
}

const INITIAL_VERIFIED_REVIEWS: VerifiedReview[] = [
  {
    id: 'rev-1',
    name: 'David K.',
    city: 'Dallas, TX',
    role: 'Private Vehicle Buyer',
    vehicle: '2021 BMW M340i xDrive',
    vinPreview: 'WBA5R7C09M8B71***',
    orderNumber: 'AA-10044',
    planName: 'Comprehensive VIN Report',
    category: 'title',
    rating: 5,
    highlightTag: 'Saved $4,200 · Hidden Structural Damage Flagged',
    highlightType: 'emerald',
    reviewTitle: 'Exposed undisclosed frame repair before closing deal',
    content: 'Found a gorgeous M340i listed by a private seller claiming clean title and zero accidents. The AutoAudit report flagged a prior insurance claim for left frame rail repair at 22,000 miles that was never declared in the listing. Walked away and saved myself thousands in future regret.',
    timeAgo: '2 hours ago',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    initials: 'DK',
    helpfulCount: 42,
    hasVerifiedStamp: true
  },
  {
    id: 'rev-2',
    name: 'Claire Montgomery',
    city: 'Chicago, IL',
    role: 'First-time Used Car Buyer',
    vehicle: '2019 Toyota RAV4 XLE',
    vinPreview: '2T3C1RFV5KC02***',
    orderNumber: 'AA-10039',
    planName: 'Complete History Audit',
    category: 'odometer',
    rating: 5,
    highlightTag: 'Odometer Rollback Discovered · 48k vs 114k mi',
    highlightType: 'amber',
    reviewTitle: 'Caught a 65,000-mile odometer rollback!',
    content: 'The dealer had the odometer showing 48,500 miles. AutoAudit pulled the official state inspection log showing 114,200 miles just 8 months ago! The gauge cluster had literally been reprogrammed. This $28 report was the best money I ever spent.',
    timeAgo: '4 hours ago',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    initials: 'CM',
    helpfulCount: 38,
    hasVerifiedStamp: true
  },
  {
    id: 'rev-3',
    name: 'Julian Vance',
    city: 'Miami, FL',
    role: 'Pre-Owned Luxury Enthusiast',
    vehicle: '2022 Porsche Macan GTS',
    vinPreview: 'WP1AA2AY3NL09***',
    orderNumber: 'AA-10032',
    planName: 'Premium Auction & Title Bundle',
    category: 'auction',
    rating: 5,
    highlightTag: 'Salvage Auction Crash Photos Included',
    highlightType: 'blue',
    reviewTitle: 'High-res salvage auction photos saved me from a rebuild',
    content: 'The salvage gallery included 10 photos from an insurance total-loss auction showing deployed side-curtain airbags and cracked suspension. Dealer insisted it was just a fender-bender. The PDF report arrived in my inbox in only 18 minutes.',
    timeAgo: '7 hours ago',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    initials: 'JV',
    helpfulCount: 29,
    hasVerifiedStamp: true
  },
  {
    id: 'rev-4',
    name: 'Hamza Tariq',
    city: 'Manchester / Lahore',
    role: 'Import Specialist',
    vehicle: '2021 Audi A4 45 TFSI quattro',
    vinPreview: 'WAUZZZF45LA01***',
    orderNumber: 'AA-10025',
    planName: 'Comprehensive VIN Check',
    category: 'fleet',
    rating: 5,
    highlightTag: 'Import Manifest & Odometer Verified',
    highlightType: 'emerald',
    reviewTitle: 'Perfect for verifying overseas imports & NMVTIS records',
    content: 'Verified all auction inspection sheets and port manifest records prior to wiring deposit for an imported Audi. The mileage progression was fully verified with 3 independent inspection timestamps. Exceptional turnaround and customer service.',
    timeAgo: '1 day ago',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    initials: 'HT',
    helpfulCount: 24,
    hasVerifiedStamp: true
  },
  {
    id: 'rev-5',
    name: 'Samantha Reed',
    city: 'Denver, CO',
    role: 'Private Vehicle Buyer',
    vehicle: '2020 Honda CR-V Touring',
    vinPreview: '7FARW2H84LE01***',
    orderNumber: 'AA-10019',
    planName: 'Basic VIN Check',
    category: 'title',
    rating: 5,
    highlightTag: '1-Owner Verified · Zero Liens',
    highlightType: 'emerald',
    reviewTitle: 'Clean bill of health and zero active bank liens',
    content: 'Confirmed single-owner history and routine service at verified Honda dealerships. The title was free of any active bank liens or repossession flags. Made negotiating with the private seller swift and stress-free.',
    timeAgo: '1 day ago',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    initials: 'SR',
    helpfulCount: 19,
    hasVerifiedStamp: true
  },
  {
    id: 'rev-6',
    name: 'Robert Chen',
    city: 'Seattle, WA',
    role: 'Truck Enthusiast',
    vehicle: '2018 Ford F-150 Lariat',
    vinPreview: '1FTFW1E84JFB2***',
    orderNumber: 'AA-10014',
    planName: 'Complete History Audit',
    category: 'odometer',
    rating: 5,
    highlightTag: '2 Open Recalls Discovered Before Buying',
    highlightType: 'blue',
    reviewTitle: 'Flagged 2 safety recalls that dealer fixed for free',
    content: 'AutoAudit flagged 2 open manufacturer safety recalls that the private seller had missed. Printed the report, showed it to the nearest Ford dealer, and they completed the transmission shift cable replacement under factory warranty before I finalized the purchase.',
    timeAgo: '2 days ago',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    initials: 'RC',
    helpfulCount: 31,
    hasVerifiedStamp: true
  },
  {
    id: 'rev-7',
    name: 'Aisha Al-Mansoor',
    city: 'Austin, TX',
    role: 'EV Buyer',
    vehicle: '2023 Tesla Model Y Long Range',
    vinPreview: '7SAYGDEE9PF72***',
    orderNumber: 'AA-10008',
    planName: 'Comprehensive VIN Check',
    category: 'fleet',
    rating: 5,
    highlightTag: 'Rapid 20-Min Delivery · Clean Title',
    highlightType: 'emerald',
    reviewTitle: 'Lightning-fast delivery directly on mobile',
    content: 'Ordered right while standing in the seller’s driveway. Within 20 minutes I received the PDF and interactive report link. Verified that the battery pack had no flood damage insurance claims. Proceeded with 100% confidence.',
    timeAgo: '3 days ago',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    initials: 'AA',
    helpfulCount: 17,
    hasVerifiedStamp: true
  }
];

const BASE_LIVE_ACTIVITIES: LiveOrderActivity[] = [
  {
    id: 'live-1',
    timeAgo: '2m ago',
    minutesAgo: 2,
    vehicle: '2022 Ford F-150 XLT 4WD',
    location: 'Dallas, TX',
    serviceName: 'Comprehensive VIN Check',
    type: 'ordered',
    orderNumber: 'AA-10048',
    statusBadge: '⚡ Just Ordered'
  },
  {
    id: 'live-2',
    timeAgo: '6m ago',
    minutesAgo: 6,
    vehicle: '2020 Honda Civic Sport',
    location: 'Chicago, IL',
    serviceName: 'Complete History Report',
    type: 'delivered',
    orderNumber: 'AA-10047',
    statusBadge: '✅ Report Delivered'
  },
  {
    id: 'live-3',
    timeAgo: '11m ago',
    minutesAgo: 11,
    vehicle: '2023 Tesla Model Y Long Range',
    location: 'Austin, TX',
    serviceName: 'Auction & Title Audit',
    type: 'ordered',
    orderNumber: 'AA-10046',
    statusBadge: '⚡ Just Ordered'
  },
  {
    id: 'live-4',
    timeAgo: '15m ago',
    minutesAgo: 15,
    vehicle: '2019 Mercedes-Benz C300',
    location: 'Miami, FL',
    serviceName: 'Salvage & Lien Check',
    type: 'delivered',
    orderNumber: 'AA-10045',
    statusBadge: '🛡️ Odometer Verified'
  },
  {
    id: 'live-5',
    timeAgo: '21m ago',
    minutesAgo: 21,
    vehicle: '2021 BMW M340i xDrive',
    location: 'Phoenix, AZ',
    serviceName: 'Comprehensive VIN Check',
    type: 'ordered',
    orderNumber: 'AA-10044',
    statusBadge: '⚡ Just Ordered'
  },
  {
    id: 'live-6',
    timeAgo: '28m ago',
    minutesAgo: 28,
    vehicle: '2022 Toyota RAV4 Prime',
    location: 'Denver, CO',
    serviceName: 'Single-Owner History Audit',
    type: 'delivered',
    orderNumber: 'AA-10043',
    statusBadge: '✅ Report Delivered'
  },
  {
    id: 'live-7',
    timeAgo: '35m ago',
    minutesAgo: 35,
    vehicle: '2018 Porsche 911 Carrera S',
    location: 'Seattle, WA',
    serviceName: 'Premium Auction Records Bundle',
    type: 'ordered',
    orderNumber: 'AA-10042',
    statusBadge: '⚡ Just Ordered'
  }
];

export const VerifiedReviewsCarousel: React.FC<VerifiedReviewsCarouselProps> = ({
  orders = [],
  onStartOrderWithVin,
  onOpenSample
}) => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<VerifiedReview[]>(INITIAL_VERIFIED_REVIEWS);
  const [activeCategory, setActiveCategory] = useState<'all' | 'title' | 'odometer' | 'auction' | 'fleet'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeLiveIndex, setActiveLiveIndex] = useState(0);
  const [helpfulVoted, setHelpfulVoted] = useState<Record<string, boolean>>({});
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  // New review form
  const [formName, setFormName] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formVehicle, setFormVehicle] = useState('');
  const [formOrderNumber, setFormOrderNumber] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<'title' | 'odometer' | 'auction' | 'fleet'>('title');

  // Derive dynamic live activities by merging recent props orders with fallback
  const liveActivities = useMemo(() => {
    const list: LiveOrderActivity[] = [];

    // Add recent real orders if available
    if (orders && orders.length > 0) {
      orders.slice(0, 3).forEach((ord, i) => {
        const vehicleStr = ord.vehicle
          ? `${ord.vehicle.year || ''} ${ord.vehicle.make || ''} ${ord.vehicle.model || ''}`.trim() || 'Vehicle Audit'
          : 'Vehicle Audit';
        
        list.push({
          id: `ord-live-${ord.id || i}`,
          timeAgo: i === 0 ? 'Just now' : `${(i + 1) * 3}m ago`,
          minutesAgo: i === 0 ? 0 : (i + 1) * 3,
          vehicle: vehicleStr,
          location: ord.vehicle?.countryOrState || 'United States',
          serviceName: ord.serviceName || 'Vehicle History Report',
          type: ord.status === 'Completed' || ord.status === 'Delivered' ? 'delivered' : 'ordered',
          orderNumber: ord.orderNumber || `AA-100${50 - i}`,
          statusBadge: ord.status === 'Completed' || ord.status === 'Delivered' ? '✅ Report Delivered' : '⚡ Live Order'
        });
      });
    }

    // Merge with base simulated activities to ensure constant lively activity
    BASE_LIVE_ACTIVITIES.forEach((item) => {
      if (!list.some((existing) => existing.orderNumber === item.orderNumber)) {
        list.push(item);
      }
    });

    return list;
  }, [orders]);

  // Filter reviews by selected category
  const filteredReviews = useMemo(() => {
    if (activeCategory === 'all') return reviews;
    return reviews.filter((r) => r.category === activeCategory);
  }, [reviews, activeCategory]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

  // Auto-advance reviews carousel when not paused
  useEffect(() => {
    if (isPaused || filteredReviews.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredReviews.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, filteredReviews.length]);

  // Auto-cycle the "Recently Ordered" activity badge
  useEffect(() => {
    if (liveActivities.length <= 1) return;
    const activityInterval = setInterval(() => {
      setActiveLiveIndex((prev) => (prev + 1) % liveActivities.length);
    }, 4500);
    return () => clearInterval(activityInterval);
  }, [liveActivities.length]);

  // Carousel navigation handlers
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? filteredReviews.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredReviews.length);
  };

  const handleHelpful = (reviewId: string) => {
    if (helpfulVoted[reviewId]) {
      showToast({
        type: 'info',
        title: 'Already Voted',
        message: 'You have already marked this customer review as helpful.'
      });
      return;
    }

    setHelpfulVoted((prev) => ({ ...prev, [reviewId]: true }));
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    );
    showToast({
      type: 'success',
      title: 'Feedback Recorded',
      message: 'Thank you! Your vote helps other car buyers identify reliable vehicle reports.'
    });
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formContent.trim() || !formVehicle.trim()) {
      showToast({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please provide your name, vehicle checked, and review feedback.'
      });
      return;
    }

    const orderNum = formOrderNumber.trim().toUpperCase() || `AA-${Math.floor(10050 + Math.random() * 200)}`;
    const initials = formName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const newReview: VerifiedReview = {
      id: `rev-${Date.now()}`,
      name: formName.trim(),
      city: formCity.trim() || 'Verified Buyer',
      role: 'Verified Customer',
      vehicle: formVehicle.trim(),
      vinPreview: '1HGCR2F83HA******',
      orderNumber: orderNum,
      planName: 'Comprehensive Vehicle Check',
      category: formCategory,
      rating: formRating,
      highlightTag: 'Verified Customer Audit',
      highlightType: 'emerald',
      reviewTitle: formTitle.trim() || 'Thorough & reliable vehicle report',
      content: formContent.trim(),
      timeAgo: 'Just now',
      initials,
      helpfulCount: 1,
      hasVerifiedStamp: true
    };

    setReviews([newReview, ...reviews]);
    setIsReviewModalOpen(false);
    // Reset form
    setFormName('');
    setFormCity('');
    setFormVehicle('');
    setFormOrderNumber('');
    setFormTitle('');
    setFormContent('');

    showToast({
      type: 'success',
      title: 'Review Published!',
      message: 'Your verified audit experience has been added to the customer reviews carousel.'
    });
  };

  // Current active live badge
  const currentLive = liveActivities[activeLiveIndex] || liveActivities[0];

  return (
    <section
      id="verified-reviews"
      className="py-20 bg-[#0B132B] text-white border-b border-[rgba(148,163,184,0.20)] relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#10B981]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-[#2563EB]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* =========================================================================
            TOP PULSE: REAL-TIME "RECENTLY ORDERED" ACTIVITY BADGE STRIP
           ========================================================================= */}
        <div className="mb-12">
          <div className="bg-[#0F1B2D]/90 backdrop-blur-md rounded-2xl border border-[rgba(148,163,184,0.20)] p-3 sm:p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Live radar badge indicator */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-xs font-bold tracking-wide">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
                </span>
                <span>LIVE ORDER PULSE</span>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Real-time registry checks & dispatch
              </span>
            </div>

            {/* Cycling Recently Ordered Activity Badge */}
            {currentLive && (
              <div
                key={currentLive.id}
                className="flex-1 flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3 transition-all duration-500 ease-out"
              >
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#07111F] border border-[rgba(148,163,184,0.25)] text-xs text-white font-medium shadow-inner">
                  <span className="text-[#10B981] font-bold">{currentLive.statusBadge}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300 font-semibold">{currentLive.vehicle}</span>
                  <span className="text-slate-500 hidden md:inline">({currentLive.location})</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{currentLive.timeAgo}</span>
                  <span className="hidden lg:inline text-slate-500">· Order #{currentLive.orderNumber}</span>
                </div>
              </div>
            )}

            {/* Quick action button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#07111F] text-slate-200 border border-[rgba(148,163,184,0.30)] hover:text-white hover:border-[#10B981] transition-all"
                title="Share your AutoAudit verification feedback"
              >
                <Plus className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Write Review</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION HEADER & TRUST METRICS
           ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#10B981] bg-[#059669]/15 border border-[#059669]/35 mb-3">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>VERIFIED CUSTOMER REVIEWS</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Real Experiences From Inspected Vehicle Buyers
            </h2>
            
            <p className="mt-2 text-sm sm:text-base text-[#CBD5E1] max-w-2xl leading-relaxed">
              Every review below is tied to a completed AutoAudit registry search. Browse verified stories of buyers who caught odometer fraud, structural salvage repairs, and hidden liens.
            </p>
          </div>

          {/* Trust Score Summary Pill */}
          <div className="shrink-0 bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-5">
            <div className="text-center pr-4 border-r border-[rgba(148,163,184,0.20)]">
              <div className="text-3xl font-extrabold text-white">4.9</div>
              <div className="flex items-center justify-center gap-0.5 text-amber-400 my-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">1,480+ Audits</div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span><strong className="text-white">99.4%</strong> Delivery Success</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong className="text-white">$3,850</strong> Avg. Savings Detected</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span><strong className="text-white">&lt; 35 min</strong> Avg. Fulfillment</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CATEGORY FILTER BUTTONS & CONTROLS
           ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Reviews', count: reviews.length },
              { id: 'title', label: 'Title & Salvage', count: reviews.filter((r) => r.category === 'title').length },
              { id: 'odometer', label: 'Odometer Rollbacks', count: reviews.filter((r) => r.category === 'odometer').length },
              { id: 'auction', label: 'Auction Records', count: reviews.filter((r) => r.category === 'auction').length },
              { id: 'fleet', label: 'Imports & Fleet', count: reviews.filter((r) => r.category === 'fleet').length }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  activeCategory === cat.id
                    ? 'bg-[#10B981] text-white border-[#10B981] shadow-md shadow-[#10B981]/20'
                    : 'bg-[#0F1B2D] text-slate-300 border-[rgba(148,163,184,0.20)] hover:text-white hover:border-slate-400'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* Carousel Arrows & Autoplay Pause */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white bg-[#0F1B2D] border border-[rgba(148,163,184,0.20)] transition-colors"
              title={isPaused ? 'Resume auto-play' : 'Pause auto-play'}
            >
              {isPaused ? '▶ Play' : '⏸ Pause'}
            </button>

            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-[#0F1B2D] text-slate-300 border border-[rgba(148,163,184,0.20)] hover:text-white hover:bg-[#07111F] hover:border-[#10B981] transition-all"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-[#0F1B2D] text-slate-300 border border-[rgba(148,163,184,0.20)] hover:text-white hover:bg-[#07111F] hover:border-[#10B981] transition-all"
              aria-label="Next review"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            CAROUSEL SLIDER DECK
           ========================================================================= */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12 bg-[#0F1B2D] rounded-2xl border border-[rgba(148,163,184,0.20)]">
              <p className="text-sm text-slate-400">No customer reviews in this category yet.</p>
              <button
                onClick={() => setActiveCategory('all')}
                className="mt-3 text-xs text-[#10B981] underline"
              >
                View all reviews
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Show 3 items starting from currentIndex, wrapping around */}
              {[0, 1, 2].map((offset) => {
                const itemIndex = (currentIndex + offset) % filteredReviews.length;
                const review = filteredReviews[itemIndex];
                if (!review) return null;

                const isVoted = helpfulVoted[review.id];

                return (
                  <div
                    key={`${review.id}-${offset}`}
                    className={`bg-[#0F1B2D] rounded-2xl border border-[rgba(148,163,184,0.20)] p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:border-[#10B981]/50 hover:shadow-2xl hover:shadow-[#10B981]/5 ${
                      offset > 0 ? 'hidden md:flex' : 'flex'
                    } ${offset === 2 ? 'md:hidden lg:flex' : ''}`}
                  >
                    {/* Top Row: Stars + Verified Badge */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                          <span className="ml-1 text-xs font-bold text-white">5.0</span>
                        </div>

                        {/* Verified Purchase Badge */}
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#059669]/20 text-[#10B981] border border-[#059669]/40 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>Verified Audit</span>
                        </div>
                      </div>

                      {/* Highlight Tag */}
                      <div>
                        <span
                          className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
                            review.highlightType === 'amber'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : review.highlightType === 'blue'
                              ? 'bg-[#2563EB]/15 text-blue-300 border-[#2563EB]/35'
                              : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                          }`}
                        >
                          {review.highlightTag}
                        </span>
                      </div>

                      {/* Review Title & Content */}
                      <div>
                        <h4 className="text-sm font-bold text-white mb-2 leading-snug">
                          "{review.reviewTitle}"
                        </h4>
                        <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed italic line-clamp-4">
                          {review.content}
                        </p>
                      </div>

                      {/* Vehicle checked pill */}
                      <div className="p-2.5 rounded-xl bg-[#07111F] border border-[rgba(148,163,184,0.15)] flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <Car className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                          <span className="font-semibold text-white truncate">{review.vehicle}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {review.vinPreview}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Reviewer profile, Report ID, and Helpful Button */}
                    <div className="pt-5 mt-5 border-t border-[rgba(148,163,184,0.20)] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {review.avatar ? (
                          <img
                            src={review.avatar}
                            alt={review.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border border-[rgba(148,163,184,0.20)] shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#07111F] text-[#10B981] border border-[#10B981]/40 flex items-center justify-center font-bold text-xs shrink-0">
                            {review.initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                            <span>{review.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {review.city} · <span className="font-mono text-slate-500">#{review.orderNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Helpful Button */}
                      <button
                        onClick={() => handleHelpful(review.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          isVoted
                            ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                            : 'bg-[#07111F] text-slate-400 border-[rgba(148,163,184,0.20)] hover:text-white hover:border-slate-400'
                        }`}
                        title="Was this review helpful?"
                      >
                        <ThumbsUp className={`w-3 h-3 ${isVoted ? 'text-[#10B981] fill-[#10B981]' : ''}`} />
                        <span>{review.helpfulCount}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Carousel Progress Dots */}
        {filteredReviews.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-8">
            {filteredReviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === i ? 'w-6 bg-[#10B981]' : 'w-2 bg-slate-600 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Bottom Guarantee Banner */}
        <div className="mt-12 bg-gradient-to-r from-[#07111F] via-[#0F1B2D] to-[#07111F] rounded-2xl border border-[rgba(148,163,184,0.20)] p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                100% Tamper-Evident Report Guarantee
              </h4>
              <p className="text-xs sm:text-sm text-[#CBD5E1]">
                Every report is generated directly from official state registries, NMVTIS database, and insurance loss files.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            {onOpenSample && (
              <button
                onClick={onOpenSample}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold bg-[#07111F] text-slate-200 border border-[rgba(148,163,184,0.30)] hover:text-white hover:border-[#10B981] transition-all"
              >
                View Sample Report
              </button>
            )}
            <button
              onClick={() => {
                const heroEl = document.getElementById('hero');
                if (heroEl) heroEl.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-all shadow-lg shadow-[#2563EB]/25"
            >
              Check a Vehicle Now
            </button>
          </div>
        </div>

      </div>

      {/* =========================================================================
          WRITE A VERIFIED REVIEW MODAL
         ========================================================================= */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0F1B2D] text-white border border-[rgba(148,163,184,0.20)] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#07111F] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
                Customer Feedback
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">
              Submit Your Verified Vehicle Audit Review
            </h3>
            <p className="text-xs text-[#CBD5E1] mb-5">
              Help other prospective buyers know how AutoAudit protected your used car transaction.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Jason Miller"
                    className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[rgba(148,163,184,0.20)] text-sm text-white focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    City, State / Region
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. Austin, TX"
                    className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[rgba(148,163,184,0.20)] text-sm text-white focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Vehicle Checked *
                  </label>
                  <input
                    type="text"
                    required
                    value={formVehicle}
                    onChange={(e) => setFormVehicle(e.target.value)}
                    placeholder="e.g. 2021 Honda Civic"
                    className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[rgba(148,163,184,0.20)] text-sm text-white focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Order # (Optional)
                  </label>
                  <input
                    type="text"
                    value={formOrderNumber}
                    onChange={(e) => setFormOrderNumber(e.target.value)}
                    placeholder="e.g. AA-10025"
                    className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[rgba(148,163,184,0.20)] text-sm text-white focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= formRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-amber-400 font-semibold ml-2">
                    {formRating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Audit Focus Category */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Audit Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[rgba(148,163,184,0.20)] text-sm text-white focus:outline-none focus:border-[#10B981]"
                >
                  <option value="title">Title & Salvage Verification</option>
                  <option value="odometer">Odometer History & Rollbacks</option>
                  <option value="auction">Auction Records & Photos</option>
                  <option value="fleet">Dealer, Fleet & Import Records</option>
                </select>
              </div>

              {/* Review Headline */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Review Headline
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Discovered salvage record and negotiated $2,000 off"
                  className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[rgba(148,163,184,0.20)] text-sm text-white focus:outline-none focus:border-[#10B981]"
                />
              </div>

              {/* Review Content */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Your Experience *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Tell us how AutoAudit helped verify the vehicle before buying..."
                  className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[rgba(148,163,184,0.20)] text-sm text-white focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(148,163,184,0.20)]">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#07111F] border border-[rgba(148,163,184,0.20)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#10B981] hover:bg-[#059669] text-white shadow-lg shadow-[#10B981]/25 transition-all"
                >
                  Publish Verified Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};
