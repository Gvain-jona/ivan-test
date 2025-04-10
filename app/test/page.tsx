'use client';

import { useState } from 'react';

export default function TestPage() {
  const [message, setMessage] = useState('Hello, World!');

  return (
    <div className="p-8 text-center">
      <h1 className="text-xl font-bold">Test Page Works!</h1>
      <p className="mt-4">{message}</p>
      <button
        className="mt-4 inline-block bg-orange-500 px-4 py-2 rounded"
        onClick={() => setMessage('Button clicked!')}
      >
        Click Me
      </button>
      <a href="/dashboard/orders" className="mt-4 ml-4 inline-block bg-blue-500 px-4 py-2 rounded">
        Try Orders Page
      </a>
    </div>
  );
}