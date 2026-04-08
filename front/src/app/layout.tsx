import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        duration={4000}
      />
    </>
  );
}