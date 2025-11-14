import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package,
  Users,
  Tag,
  LogOut,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
    navigate('/auth');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Insumos', path: '/supplies' },
    { icon: Users, label: 'Grupos', path: '/groups' },
    { icon: Tag, label: 'Etiquetas', path: '/tags' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          {/* Logo/Title */}
          <div className="border-b border-border p-6">
            <h1 className="text-xl font-bold text-foreground">Gestión de Insumos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.email}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary text-secondary-foreground'
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-border p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
