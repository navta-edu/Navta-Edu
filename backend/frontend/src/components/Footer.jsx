import React from "react";

const Footer = () => {
  return (
    <footer
      className="
        relative
        w-full
        border-t
        border-slate-200/80
        bg-white/80
        px-5
        py-6
        backdrop-blur-xl
        transition-colors
        duration-300
        dark:border-slate-800/80
        dark:bg-slate-950/80
        sm:px-8
        lg:px-10
      "
    >
      <div
        className="
          mx-auto
          flex
          w-full
          max-w-7xl
          flex-col
          items-center
          justify-center
          gap-1
          text-center
        "
      >
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          © 2026 Navta. All rights reserved.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Learn. Practise. Test. Improve.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
