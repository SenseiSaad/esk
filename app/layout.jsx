import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';

export const metadata = {
  title: 'ESK Enterprises — Digital products, engineered end to end',
  description: 'Independent software studio since 2019. Custom software, web, mobile, CRM and AI products for ambitious teams.',
};
export const viewport = { themeColor: '#0D0D0B', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <noscript>
          <style>{'.loader{display:none!important}'}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
