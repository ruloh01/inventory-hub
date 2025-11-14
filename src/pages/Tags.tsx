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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Tag as TagIcon, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Tag {
  id: string;
  name: string;
  color: string;
  group_id: string;
  groups: { name: string };
}

interface Group {
  id: string;
  name: string;
}

const Tags = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6', group_id: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorOptions = [
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Naranja' },
    { value: '#EF4444', label: 'Rojo' },
    { value: '#8B5CF6', label: 'Púrpura' },
    { value: '#EC4899', label: 'Rosa' },
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadTags();
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name')
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

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*, groups(name)');

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      toast({
        title: 'Error al cargar etiquetas',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('tags')
        .insert({
          name: formData.name,
          color: formData.color,
          group_id: formData.group_id,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Etiqueta creada',
        description: 'La etiqueta ha sido creada exitosamente',
      });

      setIsDialogOpen(false);
      setFormData({ name: '', color: '#3B82F6', group_id: '' });
      loadTags();
    } catch (error: any) {
      toast({
        title: 'Error al crear etiqueta',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta etiqueta?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast({
        title: 'Etiqueta eliminada',
        description: 'La etiqueta ha sido eliminada exitosamente',
      });

      loadTags();
    } catch (error: any) {
      toast({
        title: 'Error al eliminar etiqueta',
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
            <h1 className="text-3xl font-bold tracking-tight">Etiquetas</h1>
            <p className="text-muted-foreground">
              Gestiona las categorías de tus insumos
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={groups.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Etiqueta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Etiqueta</DialogTitle>
                  <DialogDescription>
                    Crea una etiqueta para categorizar tus insumos
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="group">Grupo</Label>
                    <Select
                      value={formData.group_id}
                      onValueChange={(value) => setFormData({ ...formData, group_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre de la Etiqueta</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Select
                      value={formData.color}
                      onValueChange={(value) => setFormData({ ...formData, color: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 rounded mr-2"
                                style={{ backgroundColor: option.value }}
                              />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creando...' : 'Crear Etiqueta'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <TagIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Primero crea un grupo</h3>
              <p className="text-muted-foreground text-center mb-4">
                Necesitas tener al menos un grupo para crear etiquetas
              </p>
              <Button onClick={() => navigate('/groups')}>
                Ir a Grupos
              </Button>
            </CardContent>
          </Card>
        ) : tags.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <TagIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay etiquetas aún</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crea tu primera etiqueta para categorizar insumos
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Etiqueta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <Card key={tag.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <Badge
                      style={{
                        backgroundColor: tag.color,
                        color: '#fff',
                      }}
                    >
                      {tag.name}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tag.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Grupo: {tag.groups?.name}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Tags;
