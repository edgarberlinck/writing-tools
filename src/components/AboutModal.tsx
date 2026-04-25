import { FiX } from "react-icons/fi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    __APP_VERSION__?: string;
    desktop?: {
      version?: string;
      platform?: string;
      isElectron?: boolean;
    };
  }
}

export default function AboutModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const version =
    (typeof window !== "undefined" && window.__APP_VERSION__) ||
    (typeof window !== "undefined" && window.desktop?.version) ||
    "unknown";

  const isElectron =
    typeof window !== "undefined" && window.desktop?.isElectron;
  const platform = typeof window !== "undefined" && window.desktop?.platform;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            About Writing Tools
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600">Version</p>
            <p className="text-lg font-semibold text-gray-900">{version}</p>
          </div>

          {isElectron && (
            <div>
              <p className="text-sm text-gray-600">Platform</p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {platform || "Unknown"}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 space-y-3">
            <p className="text-xs text-gray-500">
              A minimalist writing application for authors. Your stories, your
              way.
            </p>
            <p className="text-xs text-gray-500">
              Made with love by{" "}
              <a
                href="https://github.com/edgarberlink"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                @Edgar Muniz Berlinck
              </a>
            </p>
            <p className="text-xs text-gray-500">
              This app is free, and will always be.{" "}
              <a
                href="https://buymeacoffee.com/edgarberlinck"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-600 hover:underline"
              >
                ☕ Buy me a coffee
              </a>
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
