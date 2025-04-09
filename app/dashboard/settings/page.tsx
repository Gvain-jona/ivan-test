import { CogIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-800 p-6">
        <CogIcon className="h-12 w-12 text-orange-500" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-white">System Settings</h1>
      <p className="mt-2 max-w-md text-gray-400">
        This feature is coming soon. The settings page will allow you to configure user accounts, profit calculations, and system preferences.
      </p>
    </div>
  );
} 