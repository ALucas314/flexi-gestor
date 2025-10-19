import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/use-responsive";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: ReactNode;
  className?: string;
}

export const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon, 
  className 
}: StatsCardProps) => {
  const { isMobile } = useResponsive();
  
  return (
    <Card className={cn(
      "relative overflow-hidden bg-white border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105",
      isMobile ? "rounded-lg" : "rounded-xl",
      className
    )}>
      <CardContent className={isMobile ? "p-4" : "p-6"}>
        <div className="flex items-center justify-between">
          <div className={`${isMobile ? 'space-y-2' : 'space-y-3'} flex-1`}>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-slate-600 leading-relaxed`}>
              {title}
            </p>
            <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-slate-800 tracking-tight`}>
              {value}
            </p>
            {change && (
              <div className="flex items-center space-x-2">
                <span className={cn(
                  `inline-flex items-center ${isMobile ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded-full ${isMobile ? 'text-xs' : 'text-xs'} font-medium`,
                  changeType === "positive" && "bg-green-100 text-green-700",
                  changeType === "negative" && "bg-red-100 text-red-700",
                  changeType === "neutral" && "bg-slate-100 text-slate-600"
                )}>
                  {changeType === "positive" && "↗️"}
                  {changeType === "negative" && "↘️"}
                  {changeType === "neutral" && "➡️"}
                  <span className={isMobile ? "ml-0.5" : "ml-1"}>{change}</span>
                </span>
              </div>
            )}
          </div>
          
          {/* Ícone com Background Gradiente Suave - Responsivo */}
          <div className="flex-shrink-0">
            <div className={cn(
              `${isMobile ? 'w-12 h-12' : 'w-16 h-16'} ${isMobile ? 'rounded-lg' : 'rounded-xl'} flex items-center justify-center shadow-md`,
              changeType === "positive" && "bg-gradient-to-br from-green-200 to-green-300",
              changeType === "negative" && "bg-gradient-to-br from-red-200 to-red-300",
              changeType === "neutral" && "bg-gradient-to-br from-blue-200 to-blue-300"
            )}>
              <div className={cn(
                changeType === "positive" && "text-green-700",
                changeType === "negative" && "text-red-700",
                changeType === "neutral" && "text-blue-700"
              )}>
                {icon}
              </div>
            </div>
          </div>
        </div>
        
        {/* Indicador de Status Suave */}
        <div className={cn(
          "absolute top-0 left-0 w-1 h-full",
          changeType === "positive" && "bg-gradient-to-b from-green-300 to-green-400",
          changeType === "negative" && "bg-gradient-to-b from-red-300 to-red-400",
          changeType === "neutral" && "bg-gradient-to-b from-blue-300 to-blue-400"
        )} />
      </CardContent>
    </Card>
  );
};