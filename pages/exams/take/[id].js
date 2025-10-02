import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';

export default function TakeExam() {
  const router = useRouter();
  const { id } = router.query;
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  const fetchExam = useCallback(async () => {
    const res = await fetch(`/api/exams/${id}`);
    if (res.ok) {
      const examData = await res.json();
      setExam(examData);
      setTimeLeft(examData.duration * 60);
    }
  }, [id]);

  const submitExam = useCallback(async () => {
    await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId: id, answers })
    });
    router.push('/results');
  }, [id, answers, router]);

  useEffect(() => {
    if (id) {
      fetchExam();
    }
  }, [id, fetchExam]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && exam) {
      submitExam();
    }
  }, [timeLeft, exam, submitExam]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!exam) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{exam.title}</h1>
          <div className="text-xl font-semibold text-red-600">
            Time Left: {formatTime(timeLeft)}
          </div>
        </div>

        <div className="space-y-6">
          {exam.questions?.map((question, index) => (
            <div key={question._id} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">
                {index + 1}. {question.text}
              </h3>
              <div className="space-y-2">
                {question.options.map((option, optIndex) => (
                  <label key={optIndex} className="flex items-center">
                    <input
                      type="radio"
                      name={question._id}
                      value={optIndex}
                      onChange={(e) => setAnswers({...answers, [question._id]: e.target.value})}
                      className="mr-2"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={submitExam}
          className="mt-8 bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
        >
          Submit Exam
        </button>
      </div>
    </div>
  );
}