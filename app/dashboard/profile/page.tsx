import { UserIcon } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">User Profile</h1>
      
      <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Profile sidebar */}
          <div className="md:w-1/3 bg-gray-800 p-6 flex flex-col items-center">
            <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Ivan Prints</h2>
            <p className="text-gray-400 mb-4">Administrator</p>
            
            <button className="w-full bg-orange-600 text-white rounded-md py-2 px-4 hover:bg-orange-700 mt-2">
              Change Photo
            </button>
          </div>
          
          {/* Profile details */}
          <div className="md:w-2/3 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Full Name</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value="Ivan Prints"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400">Email Address</label>
                <input 
                  type="email" 
                  className="mt-1 block w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value="user@ivanprints.com"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400">Phone Number</label>
                <input 
                  type="tel" 
                  className="mt-1 block w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value="+1 234 567 8900"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400">Role</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value="Administrator"
                  readOnly
                />
              </div>
              
              <div className="pt-4">
                <button className="bg-orange-600 text-white rounded-md py-2 px-4 hover:bg-orange-700">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden mt-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400">Current Password</label>
              <input 
                type="password" 
                className="mt-1 block w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="••••••••••••"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400">New Password</label>
              <input 
                type="password" 
                className="mt-1 block w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="••••••••••••"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400">Confirm New Password</label>
              <input 
                type="password" 
                className="mt-1 block w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="••••••••••••"
              />
            </div>
            
            <div className="pt-4">
              <button className="bg-orange-600 text-white rounded-md py-2 px-4 hover:bg-orange-700">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden mt-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="email-notifications"
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                defaultChecked
              />
              <label htmlFor="email-notifications" className="ml-3 block text-white">
                Email Notifications
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="order-updates"
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                defaultChecked
              />
              <label htmlFor="order-updates" className="ml-3 block text-white">
                Order Updates
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="task-reminders"
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                defaultChecked
              />
              <label htmlFor="task-reminders" className="ml-3 block text-white">
                Task Reminders
              </label>
            </div>
            
            <div className="pt-4">
              <button className="bg-orange-600 text-white rounded-md py-2 px-4 hover:bg-orange-700">
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 