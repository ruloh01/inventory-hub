import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users as UsersIcon, Trash2 } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  user_groups: { role: string }[];
}

const Groups = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          user_groups!inner(role)
        `)
        .eq('user_groups.user_id', user?.id);

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      toast({
        title: 'Error al cargar grupos',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: formData.name,
          description: formData.description,
          created_by: user?.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('user_groups')
        .insert({
          user_id: user?.id,
          group_id: group.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      toast({
        title: 'Grupo creado',
        description: 'El grupo ha sido creado exitosamente',
      });

      setIsDialogOpen(false);
      setFormData({ name: '', description: '' });
      loadGroups();
    } catch (error: any) {
      toast({
        title: 'Error al crear grupo',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('¿Estás seguro de eliminar este grupo? Se eliminarán todos los insumos y etiquetas asociados.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: 'Grupo eliminado',
        description: 'El grupo ha sido eliminado exitosamente',
      });

      loadGroups();
    } catch (error: any) {
      toast({
        title: 'Error al eliminar grupo',
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Grupos de Trabajo</h1>
            <p className="text-muted-foreground">
              Gestiona tus grupos y colaboradores
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Grupo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Grupo</DialogTitle>
                  <DialogDescription>
                    Crea un nuevo grupo de trabajo para organizar tus insumos
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Grupo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creando...' : 'Crear Grupo'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <UsersIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay grupos aún</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crea tu primer grupo para comenzar a gestionar insumos
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Grupo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{group.name}</span>
                    {group.created_by === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(group.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>{group.description || 'Sin descripción'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <UsersIcon className="mr-2 h-4 w-4" />
                    Rol: {group.user_groups[0]?.role === 'admin' ? 'Administrador' : 'Miembro'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Groups;
