import {
  LucideArrowUpDown,
  LucideClipboardCheck,
  LucideFactory,
  LucideGrid3x3,
  LucideHammer,
  LucideLayers,
  LucidePackage,
  LucidePackageOpen,
  LucideScan,
  LucideScanBarcode,
  LucideScissors,
  LucideShirt,
  LucideCircleDot,
  LucideStamp,
  LucideTruck,
  LucideUserCog,
} from 'lucide-react';

const DEFAULT_STYLE = {
  icon: LucideScan,
  bgColor: 'bg-gradient-to-br from-slate-500 to-slate-600',
  textColor: 'text-white',
};

const matchName = (name, keywords) =>
  keywords.some((key) => name.includes(key));

export const getScanProcessStyle = (processName, displayName) => {
  const name = String(displayName || processName || '').toLowerCase().trim();
  if (!name) return DEFAULT_STYLE;

  if (matchName(name, ['billscan', 'bill scan'])) {
    return {
      icon: LucideScanBarcode,
      bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['checking', 'check'])) {
    return {
      icon: LucideClipboardCheck,
      bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['packing', 'pack'])) {
    return {
      icon: LucidePackage,
      bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['press', 'prass', 'iron'])) {
    return {
      icon: LucideHammer,
      bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['pocket'])) {
    return {
      icon: LucideShirt,
      bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['sorting', 'sort'])) {
    return {
      icon: LucideArrowUpDown,
      bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
      textColor: 'text-white',
    };
  }
  if (name.includes('doracut') && name.includes('multiple')) {
    return {
      icon: LucideScissors,
      bgColor: 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600',
      textColor: 'text-white',
    };
  }
  if (name.includes('doracut') && name.includes('single')) {
    return {
      icon: LucideScissors,
      bgColor: 'bg-gradient-to-br from-pink-500 to-pink-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['doracut', 'dora'])) {
    return {
      icon: LucideScissors,
      bgColor: 'bg-gradient-to-br from-pink-500 to-pink-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['cutting'])) {
    return {
      icon: LucideScissors,
      bgColor: 'bg-gradient-to-br from-red-500 to-red-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['layering', 'layer'])) {
    return {
      icon: LucideLayers,
      bgColor: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['logo'])) {
    return {
      icon: LucideStamp,
      bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['rc', 'therd', 'thread'])) {
    return {
      icon: LucideCircleDot,
      bgColor: 'bg-gradient-to-br from-violet-500 to-violet-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['gaj', 'battan', 'batten'])) {
    return {
      icon: LucideGrid3x3,
      bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['loading', 'load'])) {
    return {
      icon: LucideTruck,
      bgColor: 'bg-gradient-to-br from-sky-500 to-sky-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['unloading', 'unload'])) {
    return {
      icon: LucidePackageOpen,
      bgColor: 'bg-gradient-to-br from-lime-500 to-lime-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['master'])) {
    return {
      icon: LucideUserCog,
      bgColor: 'bg-gradient-to-br from-rose-500 to-rose-600',
      textColor: 'text-white',
    };
  }
  if (matchName(name, ['factory', 'production'])) {
    return {
      icon: LucideFactory,
      bgColor: 'bg-gradient-to-br from-stone-500 to-stone-600',
      textColor: 'text-white',
    };
  }

  return DEFAULT_STYLE;
};
