import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Gift } from "lucide-react";

interface TrialCountdownProps {
  trialEndDate: Date;
  onExpire?: () => void;
}

export const TrialCountdown = ({ trialEndDate, onExpire }: TrialCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = trialEndDate.getTime() - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onExpire?.();
        clearInterval(timer);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [trialEndDate, onExpire]);

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isExpired) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-destructive" />
            <div>
              <h3 className="font-semibold text-destructive">Période d'essai expirée</h3>
              <p className="text-sm text-muted-foreground">
                Passez au Premium pour continuer à publier vos articles
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Gift className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <h3 className="font-semibold text-primary">Essai gratuit actif</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Profitez de votre période d'essai pour publier sans limite
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Temps restant:</span>
              <div className="flex items-center gap-1 font-mono">
                <span className="bg-primary/20 px-2 py-1 rounded text-xs font-bold">
                  {timeLeft.days}j
                </span>
                <span className="bg-primary/20 px-2 py-1 rounded text-xs font-bold">
                  {String(timeLeft.hours).padStart(2, "0")}h
                </span>
                <span className="bg-primary/20 px-2 py-1 rounded text-xs font-bold">
                  {String(timeLeft.minutes).padStart(2, "0")}m
                </span>
                <span className="bg-primary/20 px-2 py-1 rounded text-xs font-bold">
                  {String(timeLeft.seconds).padStart(2, "0")}s
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};