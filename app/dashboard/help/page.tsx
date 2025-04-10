import { HelpCircleIcon } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Help & Support</h1>
      
      <div className="bg-gray-900 rounded-lg p-6 shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Support</h2>
        <p className="text-gray-300 mb-4">
          Need immediate assistance? Reach out to our support team:
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a 
            href="mailto:support@ivanprints.com" 
            className="flex items-center justify-center gap-2 bg-orange-600 text-white rounded-md px-4 py-3 hover:bg-orange-700"
          >
            Email Support
          </a>
          <a 
            href="tel:+1234567890" 
            className="flex items-center justify-center gap-2 bg-gray-800 text-white rounded-md px-4 py-3 hover:bg-gray-700"
          >
            Call Support
          </a>
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg p-6 shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div className="border-b border-gray-800 pb-4">
            <h3 className="text-lg font-medium text-white mb-2">How do I create a new order?</h3>
            <p className="text-gray-300">
              Navigate to the Orders section from the sidebar and click the "New Order" button. Fill in the 
              client details, add products, and save the order.
            </p>
          </div>
          
          <div className="border-b border-gray-800 pb-4">
            <h3 className="text-lg font-medium text-white mb-2">How can I track expenses?</h3>
            <p className="text-gray-300">
              Use the Expenses section to record all business expenses. You can categorize them and 
              generate reports to monitor your spending.
            </p>
          </div>
          
          <div className="border-b border-gray-800 pb-4">
            <h3 className="text-lg font-medium text-white mb-2">Can I manage inventory with this system?</h3>
            <p className="text-gray-300">
              Yes! Record material purchases in the dedicated section, and the system will automatically 
              track your inventory levels as you use materials for orders.
            </p>
          </div>
          
          <div className="border-b border-gray-800 pb-4">
            <h3 className="text-lg font-medium text-white mb-2">How do I access financial reports?</h3>
            <p className="text-gray-300">
              Visit the Analytics section to view financial reports, including revenue, expenses, and profit 
              margins. You can filter by date ranges for more specific insights.
            </p>
          </div>
          
          <div className="pb-4">
            <h3 className="text-lg font-medium text-white mb-2">How do I manage recurring tasks?</h3>
            <p className="text-gray-300">
              Use the To-Do section to create, assign, and track tasks. You can set due dates, reminders, 
              and mark tasks as complete when finished.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Video Tutorials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-white">Getting Started Guide</h3>
              <p className="text-sm text-gray-400 mt-1">Learn the basics of the system in this introduction video</p>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-white">Managing Orders Tutorial</h3>
              <p className="text-sm text-gray-400 mt-1">Learn how to efficiently process and track orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 