"use client";

import { ShoppingBag, Scale, Hammer, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/hooks/useAuth";
import SoonBadge from "./SoonBadge";

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Role } from "@/types/user";


interface QuickActionItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
}

interface ServiceShortcut {
  id: string;
  icon: React.ElementType;
  labelKey: string;
}

const serviceShortcuts: ServiceShortcut[] = [
  { id: "postPurchase", icon: ShoppingBag,     labelKey: "postPurchase" },
  { id: "legal",        icon: Scale,           labelKey: "legal"        },
  { id: "construction", icon: Hammer,          labelKey: "construction" },
  { id: "other",        icon: MoreHorizontal,  labelKey: "other"        },
];

export default function QuickActions() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const { user } = useAuth();
  const ui = settings.uiFlags;
  const isRtl = language === "ar";

  const actions: QuickActionItem[] = [
    {
      id: "subscriptions",
      title: t('sub.public.quickAction'),
      icon: <Image src="/icons/subscriptions-transparent.png" alt="Subscriptions" width={40} height={40} className="h-10 w-10 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />,
      accentColor: "group-hover:border-indigo-400/50",
      glowColor: "group-hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]",
    },
    {
      id: "wallet",
      title: t('action.wallet'),
      icon: <Image src="/icons/wallet.png" alt="Wallet" width={56} height={56} className="h-14 w-14 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />,
      accentColor: "group-hover:border-slate-500/60",
      glowColor: "group-hover:shadow-[0_8px_30px_rgba(148,163,184,0.15)]",
    },

    {
      id: "services",
      title: t('action.services'),
      icon: <Image src="/icons/2.png" alt="Services" width={56} height={56} className="h-14 w-14 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />,
      accentColor: "group-hover:border-gray-500/60",
      glowColor: "group-hover:shadow-[0_8px_30px_rgba(156,163,175,0.15)]",
    },
    {
      id: "offers",
      title: t('action.offers'),
      icon: <Image src="/icons/3.png" alt="Offers" width={56} height={56} className="h-14 w-14 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />,
      accentColor: "group-hover:border-slate-400/50",
      glowColor: "group-hover:shadow-[0_8px_30px_rgba(148,163,184,0.12)]",
    },

    {
      id: "requests",
      title: t('action.requests'),
      icon: <Image src="/icons/4.png" alt="Requests" width={56} height={56} className="h-14 w-14 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />,
      accentColor: "group-hover:border-slate-500/60",
      glowColor: "group-hover:shadow-[0_8px_30px_rgba(148,163,184,0.12)]",
    },

  ].filter((action) => {
    // Hide buildingmanagement if user has no departments (and is not admin)
    if (action.id === 'buildingmanagement') {
      if (!user) return false;
      if (user.role === Role.VIEWER) return false;
      if (user.role !== Role.ADMIN && user.role !== Role.MANGER && (!user.departments || user.departments.length === 0)) return false;
    }

    // Filter icons based on admin UI flags
    const flagMap: Record<string, string> = {
      buildingmanagement: 'show_quickaction_buildingmgmt',
      wallet:             'show_quickaction_wallet',
      subscriptions:      'show_quickaction_subscriptions',
      services:           'show_quickaction_services',
      offers:             'show_quickaction_offers',
      requests:           'show_quickaction_orders',
      scan_map:           'show_map_section',
    };
    const flagKey = flagMap[action.id];
    if (!flagKey) return true;
    return ui[flagKey] !== false;
  });

  const container = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1, y: 0,
      transition: { staggerChildren: 0.08, type: "spring", stiffness: 200 }
    } as any
  };

  const item = {
    hidden: { opacity: 0, scale: 0.6, y: 10 },
    show:  { opacity: 1, scale: 1,   y: 0  }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="w-full flex flex-col gap-4 py-4"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ── Main Quick Actions ── */}
      <div className="
        w-full flex items-center justify-between gap-3 md:gap-6
        px-6 py-6
        bg-gradient-to-b from-slate-800 to-slate-900
        border border-slate-700/60
        rounded-[2.5rem]
        shadow-[0_4px_32px_rgba(0,0,0,0.4)]
        relative overflow-hidden
      ">
        {/* Top shimmer */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-600/60 to-transparent" />
        {/* Subtle ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/2 via-transparent to-slate-500/2 pointer-events-none" />

        {actions.map((action) => (
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <motion.button
                variants={item}
                whileHover={{ scale: 1.12, y: -8 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  const flagKey = action.id === 'requests' ? 'orders' : action.id;
                  if (settings.sectionFlags[flagKey] === 'closed') return;

                  if (action.id === "services")           router.push("/services");
                  else if (action.id === "wallet")        router.push("/wallet");
                  else if (action.id === "subscriptions") router.push("/subscriptions/new");
                  else if (action.id === "offers")        router.push("/offers");
                  else if (action.id === "requests")      router.push("/orders");
                  else if (action.id === "buildingmanagement") router.push("/buildingmanagement");
                  else if (action.id === "scan_map")      router.push("/scan-map");
                }}
                className={`
                  group relative
                  w-16 h-16 md:w-24 md:h-24
                  rounded-2xl md:rounded-3xl
                  bg-gradient-to-br from-slate-700/60 to-slate-800/80
                  border border-slate-700/50
                  ${action.accentColor}
                  flex items-center justify-center
                  shadow-[0_2px_12px_rgba(0,0,0,0.3)]
                  ${action.glowColor}
                  transition-all duration-300
                  ${settings.sectionFlags[action.id === 'requests' ? 'orders' : action.id] === 'closed' ? 'opacity-40 grayscale pointer-events-none cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* Inner shimmer */}
                <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-tr from-transparent via-white/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Optimized Soon Badge */}
                {settings.sectionFlags[action.id === 'requests' ? 'orders' : action.id] === 'closed' && (
                  <SoonBadge className="absolute -top-1.5 -right-1.5 z-20 px-2 py-0.5 rounded-lg shadow-xl shadow-black/40">
                    {t('common.soon') || 'قريباً'}
                  </SoonBadge>
                )}

                {/* Icon */}
                <div className="relative z-10 p-2 md:p-3">
                  {action.icon}
                </div>

                {/* Hover dot indicator */}
                <div className="absolute -bottom-1 w-1 h-1 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl shadow-2xl">
              {action.title}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

    </motion.div>
  );
}
