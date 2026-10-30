import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Card, ErrorText, Field, Screen, Txt } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { money } from '../../lib/format';
import { useCreateBuilding, useCurrentBuilding, useSummary } from '../../lib/queries';

export default function HomeScreen() {
  const { building, isLoading } = useCurrentBuilding();

  if (isLoading) {
    return (
      <Screen title="PayTrack">
        <ActivityIndicator />
      </Screen>
    );
  }

  return building ? <Dashboard buildingId={building.id} name={building.name} address={building.address} code={building.inviteCode} /> : <CreateFirstBuilding />;
}

function Dashboard({ buildingId, name, address, code }: { buildingId: string; name: string; address: string; code: string }) {
  const { data: summary } = useSummary(buildingId);

  return (
    <Screen eyebrow={address} title={name}>
      <Card tone="dark">
        <Txt style={styles.label}>Total pendiente</Txt>
        <Txt style={styles.big}>{money(summary?.pendingCents ?? 0)}</Txt>
        <Txt style={styles.muted}>{summary?.openCharges ?? 0} cargos abiertos</Txt>
      </Card>

      <View style={styles.row}>
        <View style={styles.half}>
          <Card tone="coral">
            <Txt style={styles.label}>Vencido</Txt>
            <Txt style={styles.amount}>{money(summary?.overdueCents ?? 0)}</Txt>
          </Card>
        </View>
        <View style={styles.half}>
          <Card tone="mint">
            <Txt style={styles.label}>Cobrado este mes</Txt>
            <Txt style={styles.amount}>{money(summary?.collectedThisMonthCents ?? 0)}</Txt>
          </Card>
        </View>
      </View>

      <Card>
        <Txt style={styles.label}>Código del edificio</Txt>
        <Txt style={styles.code} selectable>
          {code}
        </Txt>
        <Txt style={styles.muted}>Los vecinos usarán este código, o su QR, para unirse a su departamento. Próximamente.</Txt>
      </Card>

      <Button label="Cerrar sesión" variant="ghost" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}

function CreateFirstBuilding() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const create = useCreateBuilding();

  return (
    <Screen eyebrow="Primer paso" title="Crea tu edificio">
      <Card>
        <Txt>Con el edificio creado podrás agregar departamentos y generar las cuotas del mes.</Txt>
        <View style={styles.form}>
          <Field placeholder="Nombre, p. ej. Edificio Los Álamos" value={name} onChangeText={setName} />
          <Field placeholder="Dirección" value={address} onChangeText={setAddress} />
          <ErrorText message={create.error?.message} />
          <Button
            label="Crear edificio"
            loading={create.isPending}
            disabled={!name.trim() || !address.trim()}
            onPress={() => create.mutate({ name: name.trim(), address: address.trim() })}
          />
        </View>
      </Card>
      <Button label="Cerrar sesión" variant="ghost" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, opacity: 0.8 },
  big: { fontSize: 44, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  amount: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  muted: { fontSize: 13, opacity: 0.75 },
  code: { fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  form: { gap: 10, marginTop: 10 },
});
