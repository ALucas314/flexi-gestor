import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileNav } from "./MobileNav";

export const Header = () => {
  return (
    <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <MobileNav />
        <div className="md:hidden">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            FlexiGestor
          </h1>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4 flex-1 max-w-md ml-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Buscar produtos, vendas..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs"></span>
        </Button>
        
        <Button variant="outline" size="icon">
          <User className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};