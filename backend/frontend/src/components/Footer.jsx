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
          gap-5

          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* =========================================
            LEFT - COPYRIGHT
        ========================================= */}

        <div>
          <p
            className="
              text-sm
              font-medium
              text-slate-600
              dark:text-slate-400
            "
          >
            © 2026 Navta. All rights reserved.
          </p>

          <p
            className="
              mt-1
              text-xs
              text-slate-400
              dark:text-slate-500
            "
          >
            Learn. Practise. Test. Improve.
          </p>
        </div>

        {/* =========================================
            RIGHT - DEVELOPER CREDIT
        ========================================= */}

        <div
          className="
            flex
            flex-col
            items-start
            gap-2

            sm:items-end
          "
        >
          <p
            className="
              text-sm
              text-slate-600
              dark:text-slate-400
            "
          >
            Developed by{" "}
            <span
              className="
                font-extrabold
                text-slate-900
                dark:text-white
              "
            >
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
            {/* LinkedIn logo without lucide-react */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.047c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286h-.002ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
            </svg>

            <span>LinkedIn</span>

            <span
              aria-hidden="true"
              className="text-sm"
            >
              ↗
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
