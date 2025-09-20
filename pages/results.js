import { useEffect, useState } from 'react';

export default function Results() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    const res = await fetch('/api/results');
    if (res.ok) {
      const data = await res.json();
      setResults(data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Results</h1>
        
        <div className="space-y-4">
          {results.map((result) => (
            <div key={result._id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">{result.exam?.title}</h3>
                  <p className="text-gray-600">
                    Completed on: {new Date(result.completedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.score}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {result.correctAnswers}/{result.totalQuestions}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No exam results found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}