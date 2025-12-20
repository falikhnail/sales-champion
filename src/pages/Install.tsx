import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Check, ArrowLeft, Armchair } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cream/30 to-wood-light/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-wood border-wood-medium/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl gradient-wood shadow-glow flex items-center justify-center">
            <Armchair className="w-10 h-10 text-cream" />
          </div>
          <CardTitle className="font-display text-2xl text-wood-dark">
            Install FurniPrice
          </CardTitle>
          <CardDescription className="text-wood-medium">
            Akses cepat ke sistem kalkulasi harga furniture langsung dari home screen
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-wood-dark font-medium">
                Aplikasi sudah terinstall!
              </p>
              <Link to="/">
                <Button className="w-full gradient-wood text-cream hover:opacity-90">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Aplikasi
                </Button>
              </Link>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <div className="bg-cream/50 rounded-lg p-4 space-y-3">
                <p className="font-medium text-wood-dark text-center">
                  Cara Install di iPhone/iPad:
                </p>
                <ol className="space-y-2 text-sm text-wood-medium">
                  <li className="flex items-start gap-2">
                    <span className="bg-wood-dark text-cream w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                    <span>Tap tombol <strong>Share</strong> di Safari</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-wood-dark text-cream w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                    <span>Scroll dan pilih <strong>"Add to Home Screen"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-wood-dark text-cream w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                    <span>Tap <strong>"Add"</strong> di pojok kanan atas</span>
                  </li>
                </ol>
              </div>
              <Link to="/">
                <Button variant="outline" className="w-full border-wood-medium/30 text-wood-dark">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Aplikasi
                </Button>
              </Link>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-4">
              <div className="bg-cream/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gold" />
                  <span className="text-sm text-wood-dark">Akses offline</span>
                </div>
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-gold" />
                  <span className="text-sm text-wood-dark">Install langsung dari browser</span>
                </div>
              </div>
              
              <Button 
                onClick={handleInstall}
                className="w-full gradient-wood text-cream hover:opacity-90"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Install Sekarang
              </Button>
              
              <Link to="/">
                <Button variant="ghost" className="w-full text-wood-medium">
                  Nanti saja
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-cream/50 rounded-lg p-4">
                <p className="text-sm text-wood-medium text-center">
                  Buka halaman ini di browser mobile (Chrome/Safari) untuk menginstall aplikasi.
                </p>
              </div>
              <Link to="/">
                <Button variant="outline" className="w-full border-wood-medium/30 text-wood-dark">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Aplikasi
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
