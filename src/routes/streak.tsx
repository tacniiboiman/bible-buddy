import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Flame, Calendar, Trophy, Zap, Star, Info } from "lucide-react";
import { getStreakData } from "@/lib/streak-store";

export const Route = createFileRoute("/streak")({
  component: StreakPage,
});

const INSPIRATION = [
  { text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.", ref: "Galatians 6:9" },
  { text: "I have fought the good fight, I have finished the race, I have kept the faith.", ref: "2 Timothy 4:7" },
  { text: "But you, take courage! Do not let your hands be weak, for your work shall be rewarded.", ref: "2 Chronicles 15:7" },
  { text: "Therefore, my beloved brothers, be steadfast, immovable, always abounding in the work of the Lord.", ref: "1 Corinthians 15:58" },
];

function StreakPage() {
  const streakData = useMemo(() => getStreakData(), []);
  
  const dailyQuote = useMemo(() => {
    const day = new Date().getDate();
    return INSPIRATION[day % INSPIRATION.length];
  }, []);

  // Generate last 30 days grid
  const historyGrid = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const isActive = streakData.activityHistory.includes(dateStr);
      days.push({ date: dateStr, isActive, dayNum: date.getDate() });
    }
    return days;
  }, [streakData]);

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-10 text-center relative border border-border/20 rounded-3xl p-10 bg-card/40 backdrop-blur-xl shadow-xl shadow-orange-500/5 isolate overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute -top-24 -left-24 h-64 w-64 bg-orange-500/10 rounded-full blur-[100px] -z-10 animate-pulse" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 bg-yellow-500/20 rounded-full blur-[100px] -z-10" />
        
        <div className="relative mb-6 inline-flex items-center justify-center">
             <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full animate-pulse" />
             <div className="relative rounded-3xl bg-gradient-to-br from-orange-500 to-yellow-500 p-6 shadow-lg shadow-orange-500/20 transform hover:scale-105 transition-transform duration-500">
                <Flame className="h-16 w-16 text-white" />
             </div>
        </div>
        
        <h1 className="font-serif text-5xl font-black tracking-tight text-foreground sm:text-6xl">
          {streakData.currentStreak}
        </h1>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.4em] text-orange-600/80">
          Day Streak
        </p>
        
        <div className="mt-8 flex items-center justify-center gap-4">
            <div className="flex flex-col items-center px-6 py-3 rounded-2xl bg-background/40 border border-border/50">
               <span className="text-xl font-black text-foreground">{streakData.longestStreak}</span>
               <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Personal Best</span>
            </div>
            <div className="flex flex-col items-center px-6 py-3 rounded-2xl bg-background/40 border border-border/50">
               <span className="text-xl font-black text-foreground">{streakData.activityHistory.length}</span>
               <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Days</span>
            </div>
        </div>
      </header>

      {/* Activity Grid */}
      <section className="mb-10 rounded-3xl border border-border/30 bg-card/30 backdrop-blur-md p-6">
         <div className="mb-6 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
               <Calendar className="h-4 w-4 text-primary" />
               <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Recent Activity</h2>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
               <Info className="h-3 w-3" />
               Last 30 days
            </div>
         </div>
         
         <div className="grid grid-cols-7 gap-2">
            {historyGrid.map((day, i) => (
              <div 
                key={day.date}
                className={`aspect-square flex items-center justify-center rounded-lg border transition-all duration-500 ${
                  day.isActive 
                    ? "bg-orange-500 border-orange-400 text-white shadow-sm shadow-orange-500/20 scale-100" 
                    : "bg-secondary/20 border-border/30 text-muted-foreground/40 text-[10px] scale-90"
                }`}
                title={day.date}
              >
                {day.isActive ? <Zap className="h-4 w-4 fill-current" /> : day.dayNum}
              </div>
            ))}
         </div>
      </section>

      {/* Milestones / Rewards */}
      <section className="mb-10 space-y-4">
         <div className="flex items-center gap-2 px-2">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Milestones</h2>
         </div>
         
         <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/20 p-4 transition-all hover:bg-card/40">
               <div className={`p-3 rounded-xl ${streakData.currentStreak >= 3 ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground opacity-50'}`}>
                  <Star className="h-5 w-5" />
               </div>
               <div>
                  <h3 className="text-sm font-bold">Consistent</h3>
                  <p className="text-[10px] text-muted-foreground">Active for 3 days in a row</p>
               </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/20 p-4 transition-all hover:bg-card/40">
               <div className={`p-3 rounded-xl ${streakData.currentStreak >= 7 ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground opacity-50'}`}>
                  <Trophy className="h-5 w-5" />
               </div>
               <div>
                  <h3 className="text-sm font-bold">Week Warrior</h3>
                  <p className="text-[10px] text-muted-foreground">Full week commitment</p>
               </div>
            </div>
         </div>
      </section>

      {/* Daily Motivation */}
      <footer className="relative overflow-hidden rounded-3xl border border-primary/10 bg-primary/5 p-8 text-center isolate">
         <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="h-20 w-20 text-primary" />
         </div>
         <p className="font-serif text-lg italic tracking-tight text-foreground/90 leading-relaxed max-w-md mx-auto">
           "{dailyQuote.text}"
         </p>
         <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
           {dailyQuote.ref}
         </p>
      </footer>
    </div>
  );
}
