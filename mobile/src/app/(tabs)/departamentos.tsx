import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Card, EmptyState, ErrorText, Field, Screen, Txt } from '../../components/ui';
import { useCreateUnit, useCurrentBuilding, useUnits } from '../../lib/queries';

export default function UnitsScreen() {
  const { building } = useCurrentBuilding();
  const units = useUnits(building?.id);
  const createUnit = useCreateUnit(building?.id);
  const [label, setLabel] = useState('');
  const [resident, setResident] = useState('');

  if (!building) {
    return (
      <Screen title="Departamentos">
        <EmptyState title="Primero crea un edificio" body="Desde Inicio puedes crear tu edificio." />
      </Screen>
    );
  }

  function onAdd() {
    createUnit.mutate(
      { label: label.trim(), residentName: resident.trim() || undefined },
      {
        onSuccess: () => {
          setLabel('');
          setResident('');
        },
      },
    );
  }

  return (
    <Screen eyebrow={building.name} title="Departamentos">
      <Card>
        <Txt style={styles.heading}>Agregar departamento</Txt>
        <Field placeholder="Número o nombre, p. ej. Dpto 301" value={label} onChangeText={setLabel} />
        <Field placeholder="Nombre del vecino (opcional)" value={resident} onChangeText={setResident} />
        <ErrorText message={createUnit.error?.message} />
        <Button label="Agregar" loading={createUnit.isPending} disabled={!label.trim()} onPress={onAdd} />
      </Card>

      {units.data?.length === 0 ? (
        <EmptyState title="Aún no hay departamentos" body="Agrega el primero para poder generar sus cuotas." />
      ) : null}

      {units.data?.map((u) => (
        <Card key={u.id}>
          <Txt style={styles.unit}>{u.label}</Txt>
          <Txt style={styles.muted}>{u.residentName ?? 'Sin vecino asignado'}</Txt>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  unit: { fontSize: 17, fontWeight: '800' },
  muted: { fontSize: 13, opacity: 0.7 },
});
