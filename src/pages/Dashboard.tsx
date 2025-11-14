import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, Tag, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Stats {
  totalSupplies: number;
  totalGroups: number;
  totalTags: number;
  totalProfit: number;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalSupplies: 0,
    totalGroups: 0,
    totalTags: 0,
    totalProfit: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      // Get user's groups
      const { data: userGroups } = await supabase
        .from('user_groups')
        .select('group_id')
        .eq('user_id', user?.id);

      const groupIds = userGroups?.map((ug) => ug.group_id) || [];

      if (groupIds.length === 0) {
        return;
      }

      // Get supplies count and profit
      const { data: supplies } = await supabase
        .from('supplies')
        .select('sale_price, cost, quantity')
        .in('group_id', groupIds);

      const totalProfit = supplies?.reduce((sum, supply) => {
        return sum + ((supply.sale_price - supply.cost) * supply.quantity);
      }, 0) || 0;

      // Get groups count
      const { count: groupsCount } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true })
        .in('id', groupIds);

      // Get tags count
      const { count: tagsCount } = await supabase
        .from('tags')
        .select('*', { count: 'exact', head: true })
        .in('group_id', groupIds);

      setStats({
        totalSupplies: supplies?.length || 0,
        totalGroups: groupsCount || 0,
        totalTags: tagsCount || 0,
        totalProfit,
      });
    } catch (error: any) {
      toast({
        title: 'Error al cargar estadísticas',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen general de tu gestión de insumos
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Insumos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSupplies}</div>
              <p className="text-xs text-muted-foreground">
                Registrados en tus grupos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grupos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGroups}</div>
              <p className="text-xs text-muted-foreground">
                Grupos de trabajo activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Etiquetas</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTags}</div>
              <p className="text-xs text-muted-foreground">
                Categorías personalizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancia Total</CardTitle>
              {stats.totalProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                stats.totalProfit >= 0 ? "text-success" : "text-destructive"
              )}>
                ${stats.totalProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Calculado sobre todos los insumos
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bienvenido al Sistema de Gestión</CardTitle>
            <CardDescription>
              Comienza creando un grupo de trabajo y agregando tus primeros insumos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Funcionalidades disponibles:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Gestión completa de insumos con cálculo automático de ganancias</li>
                <li>Organización por grupos de trabajo colaborativos</li>
                <li>Etiquetas personalizables para categorizar insumos</li>
                <li>Reportes y estadísticas en tiempo real</li>
                <li>Filtros avanzados por etiqueta y grupo</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default Dashboard;
