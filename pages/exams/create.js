import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function CreateExam() {
  const router = useRouter();
  const [exam, setExam] = useState({
    title: '',
    description: '',
    duration: 60,
    questions: []
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const addQuestion = () => {
    setExam({
      ...exam,
      questions: [...exam.questions, {
        text: '',
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: 0
      }]
    });
  };

  const updateQuestion = (index, field, value) => {
    const questions = [...exam.questions];
    // For multiple-choice questions, ensure correctAnswer is a number
    if (field === 'correctAnswer' && questions[index].type === 'multiple-choice' && typeof value === 'string') {
      questions[index][field] = parseInt(value);
    } else {
      questions[index][field] = value;
    }
    setExam({ ...exam, questions });
  };

  const updateOption = (qIndex, oIndex, value) => {
    const questions = [...exam.questions];
    questions[qIndex].options[oIndex] = value;
    setExam({ ...exam, questions });
  };

  const removeQuestion = (index) => {
    const questions = [...exam.questions];
    questions.splice(index, 1);
    setExam({ ...exam, questions });
  };

  const submitExam = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exam)
      });
      
      if (res.ok) {
        setMessage('Exam created successfully!');
        setTimeout(() => {
          router.push('/exams');
        }, 1500);
      } else {
        const errorData = await res.json();
        setMessage(`Error: ${errorData.message || 'Failed to create exam'}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Create New Exam</h1>
          <Link href="/exams" className="text-blue-600 hover:text-blue-800">
            &larr; Back to Exams
          </Link>
        </div>
        
        {message && (
          <div className={`p-4 mb-6 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={submitExam} className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Exam Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
                <input
                  type="text"
                  placeholder="Enter exam title"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={exam.title}
                  onChange={(e) => setExam({...exam, title: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Enter exam description"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={exam.description}
                  onChange={(e) => setExam({...exam, description: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={exam.duration}
                  onChange={(e) => setExam({...exam, duration: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Question
              </button>
            </div>
            
            {exam.questions.length > 0 ? (
              <div className="space-y-6">
                {exam.questions.map((question, qIndex) => (
                  <div key={qIndex} className="border border-gray-200 rounded-lg p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Question {qIndex + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-red-600 hover:text-red-800 font-bold text-xl"
                      >
                        &times;
                      </button>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={question.type || 'multiple-choice'}
                        onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="text-based">Text-based</option>
                        <option value="coding">Coding Task</option>
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                      <textarea
                        placeholder="Enter question text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={question.text}
                        onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                        required
                        rows="3"
                      />
                    </div>
                    
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                      {question.type === 'multiple-choice' && question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center mb-2">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={question.correctAnswer === oIndex}
                            onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                            className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder={`Option ${oIndex + 1}`}
                            className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            required
                          />
                        </div>
                      ))}
                    </div>
                    
                    {(question.type === 'text-based' || question.type === 'coding') && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expected Answer</label>
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={question.correctAnswer || ''}
                          onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                          placeholder="Enter the expected answer or solution"
                          rows="3"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <p>No questions added yet. Click &apos;Add Question&apos; to get started.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 px-6 rounded-lg text-white font-medium ${
                loading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              } transition-colors`}
            >
              {loading ? 'Creating Exam...' : 'Create Exam'}
            </button>
            <Link
              href="/exams"
              className="flex-1 py-3 px-6 rounded-lg bg-gray-200 hover:bg-gray-300 text-center font-medium transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}