import { useEffect, useState } from 'react';

export default function ExamTimer({ duration, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onTimeUp();
    }
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft < 300) return 'text-red-600'; // Less than 5 minutes
    if (timeLeft < 600) return 'text-yellow-600'; // Less than 10 minutes
    return 'text-green-600';
  };

  return (
    <div className={`text-xl font-bold ${getTimerColor()}`}>
      Time Left: {formatTime(timeLeft)}
    </div>
  );
}