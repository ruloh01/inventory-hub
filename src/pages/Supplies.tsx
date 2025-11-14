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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, Trash2, Edit, TrendingUp, TrendingDown } from 'lucide-react';

interface Supply {
  id: string;
  name: string;
  quantity: number;
  cost: number;
  sale_price: number;
  market_price: number;
  tag_id: string | null;
  group_id: string;
  tags?: { name: string; color: string } | null;
  groups: { name: string };
}

interface Group {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  group_id: string;
}

const Supplies = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    cost: 0,
    sale_price: 0,
    market_price: 0,
    tag_id: '',
    group_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadGroups();
      loadSupplies();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      loadTags(selectedGroup);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('user_groups')
        .select('group_id, groups(id, name)')
        .eq('user_id', user?.id);

      if (error) throw error;
      const groupsData = data?.map((item: any) => item.groups).filter(Boolean) || [];
      setGroups(groupsData);
      if (groupsData.length > 0) {
        setSelectedGroup(groupsData[0].id);
      }
    } catch (error: any) {
      toast({
        title: 'Error al cargar grupos',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadTags = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('group_id', groupId);

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

  const loadSupplies = async () => {
    try {
      const { data: userGroups } = await supabase
        .from('user_groups')
        .select('group_id')
        .eq('user_id', user?.id);

      const groupIds = userGroups?.map((ug) => ug.group_id) || [];

      if (groupIds.length === 0) {
        return;
      }

      const { data, error } = await supabase
        .from('supplies')
        .select('*, tags(name, color), groups(name)')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSupplies(data || []);
    } catch (error: any) {
      toast({
        title: 'Error al cargar insumos',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('supplies')
          .update({
            name: formData.name,
            quantity: formData.quantity,
            cost: formData.cost,
            sale_price: formData.sale_price,
            market_price: formData.market_price,
            tag_id: formData.tag_id || null,
            group_id: formData.group_id,
          })
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: 'Insumo actualizado',
          description: 'El insumo ha sido actualizado exitosamente',
        });
      } else {
        const { error } = await supabase
          .from('supplies')
          .insert({
            name: formData.name,
            quantity: formData.quantity,
            cost: formData.cost,
            sale_price: formData.sale_price,
            market_price: formData.market_price,
            tag_id: formData.tag_id || null,
            group_id: formData.group_id,
            created_by: user?.id,
          });

        if (error) throw error;

        toast({
          title: 'Insumo creado',
          description: 'El insumo ha sido creado exitosamente',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadSupplies();
    } catch (error: any) {
      toast({
        title: 'Error al guardar insumo',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (supply: Supply) => {
    setEditingId(supply.id);
    setFormData({
      name: supply.name,
      quantity: supply.quantity,
      cost: supply.cost,
      sale_price: supply.sale_price,
      market_price: supply.market_price,
      tag_id: supply.tag_id || '',
      group_id: supply.group_id,
    });
    setSelectedGroup(supply.group_id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este insumo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('supplies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Insumo eliminado',
        description: 'El insumo ha sido eliminado exitosamente',
      });

      loadSupplies();
    } catch (error: any) {
      toast({
        title: 'Error al eliminar insumo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      quantity: 0,
      cost: 0,
      sale_price: 0,
      market_price: 0,
      tag_id: '',
      group_id: groups[0]?.id || '',
    });
  };

  const calculateProfit = (supply: Supply) => {
    return (supply.sale_price - supply.cost) * supply.quantity;
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
            <h1 className="text-3xl font-bold tracking-tight">Insumos</h1>
            <p className="text-muted-foreground">
              Gestiona el inventario de insumos
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button disabled={groups.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Insumo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Insumo' : 'Crear Nuevo Insumo'}</DialogTitle>
                  <DialogDescription>
                    {editingId ? 'Actualiza la información del insumo' : 'Registra un nuevo insumo en el sistema'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="group">Grupo</Label>
                    <Select
                      value={formData.group_id}
                      onValueChange={(value) => {
                        setFormData({ ...formData, group_id: value });
                        setSelectedGroup(value);
                      }}
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
                    <Label htmlFor="tag">Etiqueta</Label>
                    <Select
                      value={formData.tag_id}
                      onValueChange={(value) => setFormData({ ...formData, tag_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una etiqueta (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Nombre del Insumo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Costo Unitario</Label>
                    <Input
                      id="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sale_price">Precio de Venta</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="market_price">Precio Promedio de Mercado</Label>
                    <Input
                      id="market_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.market_price}
                      onChange={(e) => setFormData({ ...formData, market_price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Insumo'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Primero crea un grupo</h3>
              <p className="text-muted-foreground text-center mb-4">
                Necesitas tener al menos un grupo para registrar insumos
              </p>
              <Button onClick={() => navigate('/groups')}>
                Ir a Grupos
              </Button>
            </CardContent>
          </Card>
        ) : supplies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay insumos aún</h3>
              <p className="text-muted-foreground text-center mb-4">
                Registra tu primer insumo para comenzar
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Insumo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Listado de Insumos</CardTitle>
              <CardDescription>
                {supplies.length} insumo{supplies.length !== 1 ? 's' : ''} registrado{supplies.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Etiqueta</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Venta</TableHead>
                    <TableHead>Mercado</TableHead>
                    <TableHead>Ganancia</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplies.map((supply) => {
                    const profit = calculateProfit(supply);
                    return (
                      <TableRow key={supply.id}>
                        <TableCell className="font-medium">{supply.name}</TableCell>
                        <TableCell>{supply.groups.name}</TableCell>
                        <TableCell>
                          {supply.tags ? (
                            <Badge
                              style={{
                                backgroundColor: supply.tags.color,
                                color: '#fff',
                              }}
                            >
                              {supply.tags.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Sin etiqueta</span>
                          )}
                        </TableCell>
                        <TableCell>{supply.quantity}</TableCell>
                        <TableCell>${supply.cost.toFixed(2)}</TableCell>
                        <TableCell>${supply.sale_price.toFixed(2)}</TableCell>
                        <TableCell>${supply.market_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {profit >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-success mr-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-destructive mr-1" />
                            )}
                            <span className={profit >= 0 ? 'text-success' : 'text-destructive'}>
                              ${Math.abs(profit).toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(supply)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(supply.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Supplies;
