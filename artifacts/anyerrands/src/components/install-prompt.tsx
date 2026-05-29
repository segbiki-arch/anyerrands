import { useEffect, useState } from "react";
import { Download, X, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "ae-install-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const onInstalled = () => {
      setShow(false);
      setDeferred(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt — show manual hint instead.
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) {
      iosTimer = setTimeout(() => {
        setIosHint(true);
        setShow(true);
      }, 2500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:left-auto sm:right-4 sm:max-w-sm"
      role="dialog"
      aria-label="Install AnyErrands"
    >
      <div className="relative rounded-2xl border border-black/10 bg-[#F5C400] p-4 shadow-2xl">
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 rounded-full p-1.5 text-black/60 transition-colors hover:bg-black/10 hover:text-black"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <img
            src="/icons/icon-192.png"
            alt="AnyErrands"
            className="h-12 w-12 shrink-0 rounded-xl"
          />
          <div className="min-w-0">
            <p className="text-sm font-extrabold leading-tight text-[#0D0D0D]">
              Install AnyErrands
            </p>
            {iosHint ? (
              <p className="mt-1 text-[13px] leading-snug text-black/70">
                Tap{" "}
                <Share className="inline h-3.5 w-3.5 -translate-y-px" aria-label="Share" />{" "}
                then <span className="font-semibold">"Add to Home Screen"</span>{" "}
                <Plus className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden />
              </p>
            ) : (
              <p className="mt-1 text-[13px] leading-snug text-black/70">
                Add it to your home screen for one-tap access.
              </p>
            )}
          </div>
        </div>

        {!iosHint && (
          <button
            onClick={install}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#0D0D0D] px-4 py-2.5 text-sm font-bold text-white transition-transform active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            Install app
          </button>
        )}
      </div>
    </div>
  );
}
