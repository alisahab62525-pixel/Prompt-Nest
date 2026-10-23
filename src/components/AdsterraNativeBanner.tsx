import React from 'react';

interface AdsterraNativeBannerProps {
  className?: string;
  showLabel?: boolean;
}

export const AdsterraNativeBanner: React.FC<AdsterraNativeBannerProps> = ({
  className = '',
  showLabel = true
}) => {
  const containerId = 'container-355dd0b0c3938d0bc1aa700c9bba8f00';
  const scriptSrc = 'https://bicea.org/21/355dd0b0c3938d0bc1aa700c9bba8f00';

  const srcDocHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 12px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: transparent;
      color: inherit;
      overflow-x: hidden;
    }
    #${containerId} {
      width: 100%;
      min-height: 140px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
</head>
<body>
  <div id="${containerId}"></div>
  <script async="async" data-cfasync="false" src="${scriptSrc}"></script>
</body>
</html>`;

  return (
    <div className={`w-full max-w-5xl mx-auto my-6 px-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] tracking-wider uppercase font-semibold text-zinc-400 dark:text-zinc-500">
            Sponsored Recommendations
          </span>
          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
            Partner Network
          </span>
        </div>
      )}
      <div className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-2 sm:p-4 shadow-sm overflow-hidden">
        <iframe
          title="adsterra-native-banner-31882352"
          srcDoc={srcDocHtml}
          className="w-full min-h-[160px] sm:min-h-[180px] border-none"
          loading="lazy"
          scrolling="no"
        />
      </div>
    </div>
  );
};
