import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Exams() {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    const res = await fetch('/api/exams');
    if (res.ok) {
      const data = await res.json();
      setExams(data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Available Exams</h1>
        
        <div className="grid gap-6">
          {exams.map((exam) => (
            <div key={exam._id} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">{exam.title}</h3>
              <p className="text-gray-600 mb-4">{exam.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Duration: {exam.duration} minutes
                </span>
                <Link
                  href={`/exams/take/${exam._id}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Take Exam
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}