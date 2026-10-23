import React from 'react';

export type BannerSize = '468x60' | '300x250' | '160x300' | '160x600' | '320x50';

interface BannerConfig {
  key: string;
  width: number;
  height: number;
  unitId: string;
}

const BANNER_CONFIGS: Record<BannerSize, BannerConfig> = {
  '468x60': {
    key: 'b78c0de922e00eedb41a53a0f76311b0',
    width: 468,
    height: 60,
    unitId: '31882355'
  },
  '300x250': {
    key: '235b342ce4b5b594777c32c92a3911dd',
    width: 300,
    height: 250,
    unitId: '31882356'
  },
  '160x300': {
    key: '8f21ee0d05d0b2ed6d6a4233b51a4cba',
    width: 160,
    height: 300,
    unitId: '31882357'
  },
  '160x600': {
    key: '4cf61bb82fcf2556358945125ecaa3c3',
    width: 160,
    height: 600,
    unitId: '31882358'
  },
  '320x50': {
    key: 'f2cddbd6af920bde3137bcf8d90dc14a',
    width: 320,
    height: 50,
    unitId: '31882359'
  }
};

interface AdsterraBannerProps {
  size: BannerSize;
  className?: string;
  showLabel?: boolean;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({
  size,
  className = '',
  showLabel = true
}) => {
  const config = BANNER_CONFIGS[size];
  if (!config) return null;

  // Build isolated srcdoc HTML to prevent global window.atOptions collisions in React
  const srcDocHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${config.key}',
      'format' : 'iframe',
      'height' : ${config.height},
      'width' : ${config.width},
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://bicea.org/22/${config.key}"></script>
</body>
</html>`;

  return (
    <div className={`flex flex-col items-center justify-center my-2 ${className}`}>
      {showLabel && (
        <span className="text-[9px] tracking-wider uppercase font-semibold text-zinc-400 dark:text-zinc-500 mb-1 select-none">
          Advertisement
        </span>
      )}
      <div
        className="overflow-hidden rounded-lg border border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50 shadow-sm flex items-center justify-center"
        style={{
          width: config.width,
          minHeight: config.height,
          maxWidth: '100%'
        }}
      >
        <iframe
          title={`adsterra-banner-${size}`}
          srcDoc={srcDocHtml}
          width={config.width}
          height={config.height}
          style={{
            border: 'none',
            overflow: 'hidden',
            width: `${config.width}px`,
            height: `${config.height}px`
          }}
          loading="lazy"
          scrolling="no"
        />
      </div>
    </div>
  );
};
