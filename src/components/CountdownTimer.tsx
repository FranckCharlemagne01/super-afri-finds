import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endTime: Date;
  onExpire?: () => void;
}

export const CountdownTimer = ({ endTime, onExpire }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance < 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        onExpire?.();
        clearInterval(timer);
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  const formatTime = (time: number) => time.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-2 bg-promo text-promo-foreground px-3 py-2 rounded-lg animate-pulse-promo">
      <Clock className="w-4 h-4" />
      <span className="text-sm font-bold">
        Se termine dans:
      </span>
      <div className="flex items-center gap-1 font-mono font-bold">
        <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
          {formatTime(timeLeft.hours)}
        </span>
        <span>:</span>
        <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
          {formatTime(timeLeft.minutes)}
        </span>
        <span>:</span>
        <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
          {formatTime(timeLeft.seconds)}
        </span>
      </div>
    </div>
  );
};