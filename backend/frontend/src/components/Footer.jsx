import React from "react";
import { Linkedin, ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer
      className="
        relative
        w-full
        border-t
        border-slate-200/80
        bg-white/85
        px-5
        py-6
        backdrop-blur-xl
        transition-colors
        duration-300

        dark:border-slate-800/80
        dark:bg-slate-950/85

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
          gap-5

          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* =====================================================
            COPYRIGHT
        ===================================================== */}

        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            © 2026 Navta. All rights reserved.
          </p>

          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Learn. Practise. Test. Improve.
          </p>
        </div>

        {/* =====================================================
            DEVELOPER CREDIT
        ===================================================== */}

        <div
          className="
            flex
            flex-col
            items-start
            gap-2

            sm:items-end
          "
        >
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Developed by{" "}
            <span className="font-extrabold text-slate-900 dark:text-white">
              Hardik Sahu
            </span>
          </p>

          <a
            href="https://www.linkedin.com/in/hardik-sahu-9797h1608p/"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-sky-200
              bg-sky-50
              px-3
              py-2
              text-xs
              font-bold
              text-sky-700
              transition-all
              duration-200

              hover:-translate-y-0.5
              hover:border-sky-300
              hover:bg-sky-100

              dark:border-sky-800/60
              dark:bg-sky-950/30
              dark:text-sky-400
              dark:hover:border-sky-700
              dark:hover:bg-sky-950/50
            "
          >
            <Linkedin className="h-4 w-4" />

            LinkedIn

            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
