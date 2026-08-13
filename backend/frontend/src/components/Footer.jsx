import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full py-4 bg-white dark:bg-[#0B0F19] text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        {/* Bottom Left */}
        <p>
          © 2026 Navta. All rights reserved.
        </p>

        {/* Bottom Right */}
        <a
          href="https://www.linkedin.com/in/YOUR-LINKEDIN-ID/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-400 transition-colors"
        >
          Developed by Hardik Sahu | www.linkedin.com/in/hardik-sahu-9797h1608p ↗
        </a>

      </div>
    </footer>
  );
};

export default Footer;
