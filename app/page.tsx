export default function Home() {
  // No meta refresh - rely solely on middleware for redirection
  console.log('Root page component rendered - should redirect via middleware');
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-900 p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Ivan Prints</h1>
          <p className="mt-2 text-gray-400">Business Management System</p>
          <p className="mt-4 text-sm text-orange-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    </div>
  );
} 